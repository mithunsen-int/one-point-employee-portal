import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { recordTransitionAudit } from "@/services/workflow/recordTransitionAudit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DecisionPayload {
  decision?: unknown;
  reason?: unknown;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const transferRequest = await TransferRequest.findById(id);
  if (!transferRequest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Only the specific assigned Manager, not "any Manager" — 403 for a
  // non-assigned Manager (test_cases.md QT09, resolved 2026-09-19).
  if (transferRequest.assignedManagerId.toString() !== authResult.identity.userId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Only the assigned Manager may decide on this request." } },
      { status: 403 },
    );
  }

  if (transferRequest.status !== "Pending: Manager") {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  let payload: DecisionPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation_error", fields: ["decision"] }, { status: 400 });
  }

  if (payload.decision !== "approve" && payload.decision !== "reject") {
    return NextResponse.json({ error: "validation_error", fields: ["decision"] }, { status: 400 });
  }

  let action: string;
  if (payload.decision === "reject") {
    if (typeof payload.reason !== "string" || payload.reason.length === 0) {
      return NextResponse.json({ error: "validation_error", fields: ["reason"] }, { status: 400 });
    }
    transferRequest.status = "Rejected";
    transferRequest.managerDecisionReason = payload.reason;
    action = "manager_rejected";
  } else {
    transferRequest.status = "Pending: HR";
    action = "manager_approved";
  }

  await transferRequest.save();
  await recordTransitionAudit(transferRequest._id, { id: authResult.identity.userId, role: authResult.identity.role }, action);

  return NextResponse.json({ id: transferRequest._id.toString(), status: transferRequest.status }, { status: 200 });
}
