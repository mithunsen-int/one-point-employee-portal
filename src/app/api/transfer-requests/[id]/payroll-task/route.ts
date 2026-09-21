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

  if (authResult.identity.role !== "Payroll") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Only Payroll may complete this task." } },
      { status: 403 },
    );
  }

  // Independent of IT/Facilities by construction — this handler reads and
  // writes only payrollTaskStatus, never the other two fields (AC10).
  if (transferRequest.status !== "Pending: Payroll, IT, Facilities" || transferRequest.payrollTaskStatus !== "Pending") {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  // API05's payload has no documented 400 exception — action: "update" and
  // "no_action_needed" both simply mark the task Completed, per this task's
  // own scope note; the payload content itself isn't validated here.
  transferRequest.payrollTaskStatus = "Completed";
  // internal-transfer-workflow.AC25: once this is genuinely the last of the
  // 3 parallel tasks to complete, move to Pending: Transfer so HR's final
  // mapping step becomes directly observable, not just access-control-implied.
  if (allParallelTasksCompleted(transferRequest)) {
    transferRequest.status = "Pending: Transfer";
  }
  await transferRequest.save();
  await recordTransitionAudit(
    transferRequest._id,
    { id: authResult.identity.userId, role: authResult.identity.role },
    "payroll_task_completed",
  );

  return NextResponse.json({ id: transferRequest._id.toString(), payrollTaskStatus: "Completed" }, { status: 200 });
}
