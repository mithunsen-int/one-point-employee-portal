import { Schema, model, models } from "mongoose";

export interface DepartmentAttributes {
  name: string;
}

const departmentSchema = new Schema<DepartmentAttributes>({
  name: { type: String, required: true, unique: true },
});

export const Department = models.Department || model<DepartmentAttributes>("Department", departmentSchema);
