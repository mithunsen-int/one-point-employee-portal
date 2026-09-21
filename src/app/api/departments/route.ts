import { NextRequest, NextResponse } from "next/server";
import { withAuthorization } from "@/services/auth/withAuthorization";
import { authenticateRequest } from "@/services/auth/authenticate";
import { Department } from "@/services/org-structure/Department";

interface CreatePayload {
  name?: unknown;
}

export const POST = withAuthorization("admin.departmentRoleManagement", async (request) => {
  let payload: CreatePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation_error", fields: ["name"] }, { status: 400 });
  }

  if (typeof payload.name !== "string" || payload.name.length === 0) {
    return NextResponse.json({ error: "validation_error", fields: ["name"] }, { status: 400 });
  }

  try {
    const department = await Department.create({ name: payload.name });
    return NextResponse.json({ id: department._id.toString(), name: department.name }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000) {
      return NextResponse.json({ error: "name_exists" }, { status: 409 });
    }
    throw error;
  }
});

// Any authenticated role, not Admin-only (org-structure-management.T03,
// 2026-09-20) — org-structure-management.AC2 only restricts create/edit/
// delete to Admin; AC6 never restricted reads. Employees (and every other
// role) need this list to populate the Department dropdown when submitting
// a transfer request (internal-transfer-workflow.API01).
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const departments = await Department.find();
  return NextResponse.json(
    departments.map((department) => ({ id: department._id.toString(), name: department.name })),
    { status: 200 },
  );
}
