import { Types } from "mongoose";
import { appendAuditLogEntry } from "@/services/audit/appendAuditLogEntry";

export interface TransitionActor {
  id: string;
  role: string;
}

// Single point of contact with transfer-audit-trail's append function, so
// internal-transfer-workflow's 8 route files each import this local helper
// rather than reaching directly into a different spec's service directory
// ten separate times.
export async function recordTransitionAudit(
  transferRequestId: Types.ObjectId | string,
  actor: TransitionActor,
  action: string,
): Promise<void> {
  await appendAuditLogEntry(transferRequestId, actor, action);
}
