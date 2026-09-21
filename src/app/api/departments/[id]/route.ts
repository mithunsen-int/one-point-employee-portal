import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { withAuthorization } from "@/services/auth/withAuthorization";
import { Department } from "@/services/org-structure/Department";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface EditPayload {
  name?: unknown;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  // withAuthorization only wraps a single-arg handler; `context` (the dynamic
  // route's params) is captured via closure rather than widening that
  // wrapper's signature — avoids touching rbac-api-security.T06's already
  // Merged code for a change this task doesn't need project-wide.
  return withAuthorization("admin.departmentRoleManagement", async (req) => {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    let payload: EditPayload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "validation_error", fields: ["name"] }, { status: 400 });
    }

    if (typeof payload.name !== "string" || payload.name.length === 0) {
      return NextResponse.json({ error: "validation_error", fields: ["name"] }, { status: 400 });
    }

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    department.name = payload.name;
    try {
      await department.save();
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000) {
        return NextResponse.json({ error: "name_exists" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ id: department._id.toString(), name: department.name }, { status: 200 });
  })(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withAuthorization("admin.departmentRoleManagement", async () => {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ id: department._id.toString() }, { status: 200 });
  })(request);
}
