import { Schema, model, models, Types } from "mongoose";

export type TransferRequestStatus =
  | "Pending: Manager"
  | "Pending: HR"
  | "Pending: Payroll, IT, Facilities"
  | "Pending: Transfer"
  | "Rejected"
  | "Withdrawn"
  | "Completed";

export const TRANSFER_REQUEST_STATUSES: readonly TransferRequestStatus[] = [
  "Pending: Manager",
  "Pending: HR",
  "Pending: Payroll, IT, Facilities",
  "Pending: Transfer",
  "Rejected",
  "Withdrawn",
  "Completed",
];

export type TaskStatus = "Pending" | "Completed";

export const TASK_STATUSES: readonly TaskStatus[] = ["Pending", "Completed"];

export interface TransferRequestAttributes {
  employeeId: Types.ObjectId;
  departmentId: Types.ObjectId;
  jobRoleId: Types.ObjectId;
  location: string;
  effectiveDate: Date;
  reason?: string;
  status: TransferRequestStatus;
  assignedManagerId: Types.ObjectId;
  managerDecisionReason?: string;
  hrDecisionReason?: string;
  payrollTaskStatus: TaskStatus;
  itTaskStatus: TaskStatus;
  facilitiesTaskStatus: TaskStatus;
  newManagerId?: Types.ObjectId;
  submittedAt: Date;
  completedAt?: Date;
}

const transferRequestSchema = new Schema<TransferRequestAttributes>({
  employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  jobRoleId: { type: Schema.Types.ObjectId, ref: "JobRole", required: true },
  location: { type: String, required: true },
  effectiveDate: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, required: true, enum: TRANSFER_REQUEST_STATUSES },
  // Snapshotted from the Employee's managerId at submission time, not looked
  // up live — see plan's Data Model decision. Required: an Employee record
  // always has a managerId (user-management-console.T01's own schema rule),
  // so this is reliably available at submission.
  assignedManagerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  managerDecisionReason: { type: String },
  hrDecisionReason: { type: String },
  // Default "Pending" on creation, not left undefined — these three fields
  // are independently trackable state per AC10-AC12 from the moment a
  // request exists, not only once the Payroll/IT/Facilities stage begins.
  payrollTaskStatus: { type: String, enum: TASK_STATUSES, default: "Pending" },
  itTaskStatus: { type: String, enum: TASK_STATUSES, default: "Pending" },
  facilitiesTaskStatus: { type: String, enum: TASK_STATUSES, default: "Pending" },
  newManagerId: { type: Schema.Types.ObjectId, ref: "User" },
  submittedAt: { type: Date, required: true },
  completedAt: { type: Date },
});

export const TransferRequest =
  models.TransferRequest || model<TransferRequestAttributes>("TransferRequest", transferRequestSchema);
