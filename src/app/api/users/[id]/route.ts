import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { User, UserRole } from "@/services/users/User";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function notFound(): NextResponse {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

function forbidden(): NextResponse {
  return NextResponse.json(
    { error: { code: "FORBIDDEN", message: "Your role is not permitted to act on this user." } },
    { status: 403 },
  );
}

function canActOn(callerRole: string, targetRole: UserRole): boolean {
  if (callerRole === "Admin") {
    return true;
  }
  return callerRole === "HR" && targetRole === "Employee";
}

interface PatchPayload {
  username?: unknown;
  role?: unknown;
  managerId?: unknown;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const callerRole = authResult.identity.role;
  if (callerRole !== "Admin" && callerRole !== "HR") {
    return forbidden();
  }

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return notFound();
  }

  const target = await User.findOne({ _id: id, deletedAt: null });
  if (!target) {
    return notFound();
  }

  if (!canActOn(callerRole, target.role)) {
    return forbidden();
  }

  return NextResponse.json(
    {
      id: target._id.toString(),
      username: target.username,
      role: target.role,
      dateOfJoining: target.dateOfJoining.toISOString(),
      managerId: target.managerId ? target.managerId.toString() : null,
    },
    { status: 200 },
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return notFound();
  }

  const target = await User.findOne({ _id: id, deletedAt: null });
  if (!target) {
    return notFound();
  }

  if (!canActOn(authResult.identity.role, target.role)) {
    return forbidden();
  }

  let payload: PatchPayload;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  if (typeof payload.username === "string") {
    target.username = payload.username;
  }
  if (typeof payload.role === "string") {
    target.role = payload.role as UserRole;
  }
  if (typeof payload.managerId === "string" && Types.ObjectId.isValid(payload.managerId)) {
    target.managerId = new Types.ObjectId(payload.managerId);
  }

  await target.save();

  return NextResponse.json({ id: target._id.toString(), username: target.username, role: target.role }, { status: 200 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return notFound();
  }

  const target = await User.findOne({ _id: id, deletedAt: null });
  if (!target) {
    return notFound();
  }

  if (!canActOn(authResult.identity.role, target.role)) {
    return forbidden();
  }

  target.deletedAt = new Date();
  await target.save();

  return NextResponse.json({ id: target._id.toString() }, { status: 200 });
}
