import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { User } from "@/services/users/User";
import { recordTransitionAudit } from "@/services/workflow/recordTransitionAudit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DecisionPayload {
  decision?: unknown;
  reason?: unknown;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_DAYS_ELIGIBLE = 90;

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

  // Any HR user, not a specific assigned reviewer — per the spec's Explicitly
  // Out of Scope (no per-request HR routing, unlike the Manager's
  // assignedManagerId).
  if (authResult.identity.role !== "HR") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Only HR may decide on this request." } },
      { status: 403 },
    );
  }

  if (transferRequest.status !== "Pending: HR") {
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

  if (payload.decision === "reject") {
    if (typeof payload.reason !== "string" || payload.reason.length === 0) {
      return NextResponse.json({ error: "validation_error", fields: ["reason"] }, { status: 400 });
    }
    // The 90-day eligibility rule (AC7) applies to approval only — AC8 places
    // no tenure precondition on rejection.
    transferRequest.status = "Rejected";
    transferRequest.hrDecisionReason = payload.reason;
    await transferRequest.save();
    await recordTransitionAudit(
      transferRequest._id,
      { id: authResult.identity.userId, role: authResult.identity.role },
      "hr_rejected",
    );
    return NextResponse.json({ id: transferRequest._id.toString(), status: transferRequest.status }, { status: 200 });
  }

  const employee = await User.findById(transferRequest.employeeId);
  const daysSinceJoining = employee
    ? Math.floor((Date.now() - employee.dateOfJoining.getTime()) / MS_PER_DAY)
    : 0;
  if (daysSinceJoining < MIN_DAYS_ELIGIBLE) {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  transferRequest.status = "Pending: Payroll, IT, Facilities";
  transferRequest.payrollTaskStatus = "Pending";
  transferRequest.itTaskStatus = "Pending";
  transferRequest.facilitiesTaskStatus = "Pending";
  await transferRequest.save();
  await recordTransitionAudit(
    transferRequest._id,
    { id: authResult.identity.userId, role: authResult.identity.role },
    "hr_approved",
  );

  return NextResponse.json({ id: transferRequest._id.toString(), status: transferRequest.status }, { status: 200 });
}
