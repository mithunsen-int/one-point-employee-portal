import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { recordTransitionAudit } from "@/services/workflow/recordTransitionAudit";

interface RouteContext {
  params: Promise<{ id: string }>;
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

  // Same ownership check as T03 — only the requesting Employee, no Admin or
  // other-role carve-out.
  if (transferRequest.employeeId.toString() !== authResult.identity.userId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You may only withdraw your own transfer request." } },
      { status: 403 },
    );
  }

  if (transferRequest.status !== "Pending: Manager") {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  transferRequest.status = "Withdrawn";
  await transferRequest.save();
  await recordTransitionAudit(
    transferRequest._id,
    { id: authResult.identity.userId, role: authResult.identity.role },
    "withdrawn",
  );

  return NextResponse.json({ id: transferRequest._id.toString(), status: transferRequest.status }, { status: 200 });
}
