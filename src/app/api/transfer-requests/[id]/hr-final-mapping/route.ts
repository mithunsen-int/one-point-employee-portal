import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { User } from "@/services/users/User";
import { recordTransitionAudit } from "@/services/workflow/recordTransitionAudit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface FinalMappingPayload {
  newManagerId?: unknown;
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

  // Any HR user, same non-routing rule as T05's hr-decision (QT20).
  if (authResult.identity.role !== "HR") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Only HR may perform the final manager mapping." } },
      { status: 403 },
    );
  }

  // AC13/AC14 (amended 2026-09-20, AC25): status is now the single source
  // of truth for "all 3 parallel tasks are done" — set atomically by
  // whichever of payroll/it/facilities-task is the last to complete — rather
  // than re-checking the three fields independently here.
  if (transferRequest.status !== "Pending: Transfer") {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  let payload: FinalMappingPayload;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  // AC13: HR chooses the new manager for the employee — "the employee's
  // manager is updated" means the employee's own User.managerId, not just a
  // record on this request. Confirmed 2026-09-19 (previously flagged as an
  // interpretive gap at Gate 2 review).
  if (typeof payload.newManagerId === "string") {
    const newManagerId = new Types.ObjectId(payload.newManagerId);
    transferRequest.newManagerId = newManagerId;
    await User.findByIdAndUpdate(transferRequest.employeeId, { managerId: newManagerId });
  }
  transferRequest.status = "Completed";
  transferRequest.completedAt = new Date();
  await transferRequest.save();
  await recordTransitionAudit(
    transferRequest._id,
    { id: authResult.identity.userId, role: authResult.identity.role },
    "hr_final_mapping",
  );

  return NextResponse.json({ id: transferRequest._id.toString(), status: transferRequest.status }, { status: 200 });
}
