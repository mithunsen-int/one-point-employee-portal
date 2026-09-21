import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { AuditLog } from "@/services/audit/AuditLog";
import { findTransferRequestById } from "@/services/audit/transferRequestLookup";
import { User } from "@/services/users/User";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { id } = await context.params;
  // Consistent with every other [id] route in this project (Users,
  // Departments, JobRoles): a malformed id is treated as 404, not 400 — the
  // spec/API contract itself doesn't specify which (QT06), so this follows
  // the project's own established convention rather than inventing a new one.
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const transferRequest = await findTransferRequestById(id);
  if (!transferRequest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { role, userId } = authResult.identity;
  const isOwner = role === "Employee" && transferRequest.employeeId === userId;
  if (role !== "Admin" && !isOwner) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You may only view your own transfer request's audit log." } },
      { status: 403 },
    );
  }

  const entries = await AuditLog.find({ transferRequestId: id });

  // Resolve each entry's actor to a username for display. Deliberately not
  // filtered by deletedAt: null — an audit trail must not silently
  // reinterpret history just because the actor has since left (same
  // principle already applied to actorRole's snapshotting). Falls back to
  // the raw actorId string only if no matching User record exists at all
  // (a data-integrity edge case, not an expected path).
  const actorIds = [...new Set(entries.map((entry) => entry.actorId.toString()))];
  const users = await User.find({ _id: { $in: actorIds } });
  const usernameByActorId = new Map(users.map((user) => [user._id.toString(), user.username]));

  return NextResponse.json(
    entries.map((entry) => ({
      actor: usernameByActorId.get(entry.actorId.toString()) ?? entry.actorId.toString(),
      action: entry.action,
      timestamp: entry.timestamp.toISOString(),
    })),
    { status: 200 },
  );
}
