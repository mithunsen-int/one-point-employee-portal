import { NextRequest, NextResponse } from "next/server";
import { withAuthorization } from "@/services/auth/withAuthorization";
import { authenticateRequest } from "@/services/auth/authenticate";
import { JobRole } from "@/services/org-structure/JobRole";

interface CreatePayload {
  title?: unknown;
}

export const POST = withAuthorization("admin.departmentRoleManagement", async (request) => {
  let payload: CreatePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation_error", fields: ["title"] }, { status: 400 });
  }

  if (typeof payload.title !== "string" || payload.title.length === 0) {
    return NextResponse.json({ error: "validation_error", fields: ["title"] }, { status: 400 });
  }

  try {
    const jobRole = await JobRole.create({ title: payload.title });
    return NextResponse.json({ id: jobRole._id.toString(), title: jobRole.title }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000) {
      return NextResponse.json({ error: "name_exists" }, { status: 409 });
    }
    throw error;
  }
});

// Any authenticated role, not Admin-only (org-structure-management.T03,
// 2026-09-20) — same fix and same reasoning as GET /departments.
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const jobRoles = await JobRole.find();
  return NextResponse.json(
    jobRoles.map((jobRole) => ({ id: jobRole._id.toString(), title: jobRole.title })),
    { status: 200 },
  );
}
