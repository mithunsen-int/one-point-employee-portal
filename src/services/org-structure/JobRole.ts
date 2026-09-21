import { Schema, model, models } from "mongoose";

export interface JobRoleAttributes {
  title: string;
}

const jobRoleSchema = new Schema<JobRoleAttributes>({
  title: { type: String, required: true, unique: true },
});

export const JobRole = models.JobRole || model<JobRoleAttributes>("JobRole", jobRoleSchema);
