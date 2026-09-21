import { Types } from "mongoose";
import { AuditLog } from "@/services/audit/AuditLog";

export interface AuditActor {
  id: Types.ObjectId | string;
  role: string;
}

export async function appendAuditLogEntry(
  transferRequestId: Types.ObjectId | string,
  actor: AuditActor,
  action: string,
): Promise<void> {
  await AuditLog.create({
    transferRequestId,
    actorId: actor.id,
    actorRole: actor.role,
    action,
    timestamp: new Date(),
  });
}
