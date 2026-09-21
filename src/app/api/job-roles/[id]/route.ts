import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { withAuthorization } from "@/services/auth/withAuthorization";
import { JobRole } from "@/services/org-structure/JobRole";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface EditPayload {
  title?: unknown;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAuthorization("admin.departmentRoleManagement", async (req) => {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    let payload: EditPayload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "validation_error", fields: ["title"] }, { status: 400 });
    }

    if (typeof payload.title !== "string" || payload.title.length === 0) {
      return NextResponse.json({ error: "validation_error", fields: ["title"] }, { status: 400 });
    }

    const jobRole = await JobRole.findById(id);
    if (!jobRole) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    jobRole.title = payload.title;
    try {
      await jobRole.save();
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000) {
        return NextResponse.json({ error: "name_exists" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ id: jobRole._id.toString(), title: jobRole.title }, { status: 200 });
  })(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withAuthorization("admin.departmentRoleManagement", async () => {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const jobRole = await JobRole.findByIdAndDelete(id);
    if (!jobRole) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ id: jobRole._id.toString() }, { status: 200 });
  })(request);
}
