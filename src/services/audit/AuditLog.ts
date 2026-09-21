import { Schema, model, models, Types } from "mongoose";

export interface AuditLogAttributes {
  transferRequestId: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole: string;
  action: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<AuditLogAttributes>({
  transferRequestId: { type: Schema.Types.ObjectId, ref: "TransferRequest", required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, required: true },
});

function blockMutation(): never {
  throw new Error("AuditLogs is append-only — update and delete are not permitted.");
}

// Enforced at the model layer, not just by the absence of an update/delete
// route — a future engineer can't accidentally introduce a mutation path
// without deliberately removing an explicit guard first (plan decision).
auditLogSchema.pre(["findOneAndUpdate", "findOneAndDelete"], function () {
  blockMutation();
});
auditLogSchema.pre(["deleteOne", "deleteMany"], { document: true, query: true }, function () {
  blockMutation();
});

export const AuditLog = models.AuditLog || model<AuditLogAttributes>("AuditLog", auditLogSchema);
