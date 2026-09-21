import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { allParallelTasksCompleted } from "@/services/workflow/allParallelTasksCompleted";
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

  if (authResult.identity.role !== "Facilities") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Only Facilities may complete this task." } },
      { status: 403 },
    );
  }

  // Independent of Payroll/IT by construction — this handler reads and
  // writes only facilitiesTaskStatus, never the other two fields (AC12).
  if (transferRequest.status !== "Pending: Payroll, IT, Facilities" || transferRequest.facilitiesTaskStatus !== "Pending") {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  transferRequest.facilitiesTaskStatus = "Completed";
  // internal-transfer-workflow.AC25: see payroll-task's own identical comment.
  if (allParallelTasksCompleted(transferRequest)) {
    transferRequest.status = "Pending: Transfer";
  }
  await transferRequest.save();
  await recordTransitionAudit(
    transferRequest._id,
    { id: authResult.identity.userId, role: authResult.identity.role },
    "facilities_task_completed",
  );

  return NextResponse.json({ id: transferRequest._id.toString(), facilitiesTaskStatus: "Completed" }, { status: 200 });
}
