import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { withAuthorization } from "@/services/auth/withAuthorization";
import { Department } from "@/services/org-structure/Department";
import { JobRole } from "@/services/org-structure/JobRole";
import { location as allowedLocations } from "@/services/constants/referenceValues";
import { User } from "@/services/users/User";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { recordTransitionAudit } from "@/services/workflow/recordTransitionAudit";

interface SubmitPayload {
  departmentId?: unknown;
  jobRoleId?: unknown;
  location?: unknown;
  effectiveDate?: unknown;
  reason?: unknown;
}

export const POST = withAuthorization("transfer.initiate", async (request, identity) => {
  let payload: SubmitPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "validation_error", fields: ["departmentId", "jobRoleId", "location", "effectiveDate"] },
      { status: 400 },
    );
  }

  const fields: string[] = [];
  if (typeof payload.departmentId !== "string" || payload.departmentId.length === 0) {
    fields.push("departmentId");
  }
  if (typeof payload.jobRoleId !== "string" || payload.jobRoleId.length === 0) {
    fields.push("jobRoleId");
  }
  if (typeof payload.location !== "string" || payload.location.length === 0) {
    fields.push("location");
  }
  if (typeof payload.effectiveDate !== "string" || payload.effectiveDate.length === 0) {
    fields.push("effectiveDate");
  }
  if (fields.length > 0) {
    return NextResponse.json({ error: "validation_error", fields }, { status: 400 });
  }

  if (!allowedLocations.includes(payload.location as string)) {
    return NextResponse.json({ error: "validation_error", fields: ["location"] }, { status: 400 });
  }

  const departmentId = payload.departmentId as string;
  if (!Types.ObjectId.isValid(departmentId) || !(await Department.exists({ _id: departmentId }))) {
    return NextResponse.json({ error: "not_found", field: "departmentId" }, { status: 404 });
  }

  const jobRoleId = payload.jobRoleId as string;
  if (!Types.ObjectId.isValid(jobRoleId) || !(await JobRole.exists({ _id: jobRoleId }))) {
    return NextResponse.json({ error: "not_found", field: "jobRoleId" }, { status: 404 });
  }

  // Snapshotted at submission, not looked up live afterward — per the plan's
  // explicit Data Model decision (the assigned Manager stays stable even if
  // the employee's manager is reassigned elsewhere while this request sits
  // pending indefinitely).
  const employee = await User.findById(identity.userId);
  const submittedAt = new Date();

  const transferRequest = await TransferRequest.create({
    employeeId: identity.userId,
    departmentId,
    jobRoleId,
    location: payload.location,
    effectiveDate: new Date(payload.effectiveDate as string),
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
    status: "Pending: Manager",
    assignedManagerId: employee?.managerId,
    submittedAt,
  });

  await recordTransitionAudit(transferRequest._id, { id: identity.userId, role: identity.role }, "submitted");

  return NextResponse.json(
    { id: transferRequest._id.toString(), status: transferRequest.status, submittedAt: submittedAt.toISOString() },
    { status: 201 },
  );
});
