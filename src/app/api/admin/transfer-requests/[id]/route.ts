import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { checkPermission } from "@/services/auth/permissions";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { resolveActionHistory } from "@/services/audit/resolveActionHistory";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Admin-only, full stop — unlike internal-transfer-workflow.API02, there is
// no "requesting employee" ownership exception here (AC7/QT09: every other
// role gets 403, including the request's own employee).
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  if (!checkPermission(authResult.identity.role, "admin.transferMonitoring")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You are not authorized to view transfer request details." } },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const transferRequest = await TransferRequest.findById(id);
  if (!transferRequest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const actionHistory = await resolveActionHistory(transferRequest._id);

  // Field set resolved with the reviewer during Gate 2: API01's 5 submitted
  // fields (departmentId, location, jobRoleId, effectiveDate, reason) plus
  // assignedManagerId and submittedAt — not the full TransferRequest
  // document (task statuses, newManagerId, completedAt, decision reasons
  // remain omitted; not asked for).
  return NextResponse.json(
    {
      id: transferRequest._id.toString(),
      status: transferRequest.status,
      departmentId: transferRequest.departmentId.toString(),
      location: transferRequest.location,
      jobRoleId: transferRequest.jobRoleId.toString(),
      effectiveDate: transferRequest.effectiveDate.toISOString(),
      reason: transferRequest.reason,
      assignedManagerId: transferRequest.assignedManagerId.toString(),
      submittedAt: transferRequest.submittedAt.toISOString(),
      actionHistory,
    },
    { status: 200 },
  );
}
