import { Types } from "mongoose";
import { TransferRequest } from "@/services/workflow/TransferRequest";

export interface TransferRequestSummary {
  id: string;
  employeeId: string;
}

// Implements transfer-audit-trail.T04 — wires this read-contract (fixed
// since transfer-audit-trail.T03's own scope) to the real TransferRequests
// collection, closing the stub T03 deliberately left open pending
// internal-transfer-workflow.T01. A malformed id returns null rather than
// letting Mongoose's CastError propagate, matching this project's standing
// Types.ObjectId.isValid() convention.
export async function findTransferRequestById(id: string): Promise<TransferRequestSummary | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const transferRequest = await TransferRequest.findById(id);
  if (!transferRequest) {
    return null;
  }

  return {
    id: transferRequest._id.toString(),
    employeeId: transferRequest.employeeId.toString(),
  };
}
