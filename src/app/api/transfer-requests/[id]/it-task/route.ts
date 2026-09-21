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

  if (authResult.identity.role !== "IT") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Only IT may complete this task." } },
      { status: 403 },
    );
  }

  // Independent of Payroll/Facilities by construction — this handler reads
  // and writes only itTaskStatus, never the other two fields (AC11).
  if (transferRequest.status !== "Pending: Payroll, IT, Facilities" || transferRequest.itTaskStatus !== "Pending") {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  transferRequest.itTaskStatus = "Completed";
  // internal-transfer-workflow.AC25: see payroll-task's own identical comment.
  if (allParallelTasksCompleted(transferRequest)) {
    transferRequest.status = "Pending: Transfer";
  }
  await transferRequest.save();
  await recordTransitionAudit(
    transferRequest._id,
    { id: authResult.identity.userId, role: authResult.identity.role },
    "it_task_completed",
  );

  return NextResponse.json({ id: transferRequest._id.toString(), itTaskStatus: "Completed" }, { status: 200 });
}
