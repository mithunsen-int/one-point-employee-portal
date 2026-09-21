import { TransferRequestAttributes } from "@/services/workflow/TransferRequest";

// internal-transfer-workflow.AC25: shared by payroll-task/it-task/facilities-task
// so the "am I the last of the three?" check isn't tripled across handlers.
export function allParallelTasksCompleted(
  transferRequest: Pick<TransferRequestAttributes, "payrollTaskStatus" | "itTaskStatus" | "facilitiesTaskStatus">,
): boolean {
  return (
    transferRequest.payrollTaskStatus === "Completed" &&
    transferRequest.itTaskStatus === "Completed" &&
    transferRequest.facilitiesTaskStatus === "Completed"
  );
}
