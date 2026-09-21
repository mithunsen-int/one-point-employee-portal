import { Schema, model, models, Types } from "mongoose";

export type UserRole = "Employee" | "HR" | "Manager" | "Payroll" | "IT" | "Facilities" | "Admin";

export const USER_ROLES: readonly UserRole[] = ["Employee", "HR", "Manager", "Payroll", "IT", "Facilities", "Admin"];

export interface UserAttributes {
  username: string;
  passwordHash: string;
  role: UserRole;
  dateOfJoining: Date;
  managerId?: Types.ObjectId | null;
  deletedAt?: Date | null;
}

const userSchema = new Schema<UserAttributes>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: USER_ROLES },
  dateOfJoining: { type: Date, required: true },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: function (this: UserAttributes) {
      return this.role === "Employee";
    },
  },
  deletedAt: { type: Date, default: null },
});

userSchema.index(
  { role: 1, deletedAt: 1 },
  { unique: true, partialFilterExpression: { role: "Admin", deletedAt: null } },
);

export const User = models.User || model<UserAttributes>("User", userSchema);
