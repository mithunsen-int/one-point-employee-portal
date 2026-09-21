import { Types } from "mongoose";
import { AuditLog } from "@/services/audit/AuditLog";
import { User } from "@/services/users/User";

export interface ActionHistoryEntry {
  actor: string;
  action: string;
  timestamp: string;
}

// Shared by three consumers (transfer-audit-trail's own GET .../audit-log,
// internal-transfer-workflow's GET /transfer-requests/{id}, and
// transfer-admin-oversight's GET /admin/transfer-requests/{id}) — extracted
// once a third consumer needed the identical "resolve AuditLog entries to
// usernames" logic, per the Note left in both of the earlier two Gate 2
// reviews anticipating exactly this.
export async function resolveActionHistory(transferRequestId: Types.ObjectId | string): Promise<ActionHistoryEntry[]> {
  const entries = await AuditLog.find({ transferRequestId });
  const actorIds = [...new Set(entries.map((entry) => entry.actorId.toString()))];
  const users = await User.find({ _id: { $in: actorIds } });
  const usernameByActorId = new Map(users.map((user) => [user._id.toString(), user.username]));

  return entries.map((entry) => ({
    actor: usernameByActorId.get(entry.actorId.toString()) ?? entry.actorId.toString(),
    action: entry.action,
    timestamp: entry.timestamp.toISOString(),
  }));
}
