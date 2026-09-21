import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { hashPassword } from "@/services/users/passwordHashing";
import { User, USER_ROLES, UserRole } from "@/services/users/User";

const REGISTERABLE_ROLES: readonly UserRole[] = USER_ROLES.filter((role) => role !== "Admin");

interface RegisterPayload {
  username?: unknown;
  password?: unknown;
  role?: unknown;
  dateOfJoining?: unknown;
  managerId?: unknown;
}

function forbidden(message: string): NextResponse {
  return NextResponse.json({ error: { code: "FORBIDDEN", message } }, { status: 403 });
}

export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const callerRole = authResult.identity.role;
  if (callerRole !== "Admin" && callerRole !== "HR") {
    return forbidden("Your role is not permitted to list users.");
  }

  // user-management-console.T07 (AC13's 2026-09-20 amendment): HR may also
  // request Manager records specifically, for a Manager-selector use case
  // (stakeholder-panel-ui.AC9) — no other role value is permitted for HR,
  // and Admin's own unfiltered view is unaffected by this parameter.
  const requestedRole = request.nextUrl.searchParams.get("role");
  let filter: Record<string, unknown> = { deletedAt: null };
  if (callerRole === "HR") {
    if (requestedRole === null) {
      filter = { role: "Employee", deletedAt: null };
    } else if (requestedRole === "Manager") {
      filter = { role: "Manager", deletedAt: null };
    } else {
      return NextResponse.json({ error: "validation_error", fields: ["role"] }, { status: 400 });
    }
  }
  const users = await User.find(filter);

  return NextResponse.json(
    users.map((user) => ({ id: user._id.toString(), username: user.username, role: user.role })),
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  let payload: RegisterPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation_error", fields: ["username", "password", "role", "dateOfJoining"] }, { status: 400 });
  }

  const fields: string[] = [];
  if (typeof payload.username !== "string" || payload.username.length === 0) {
    fields.push("username");
  }
  if (typeof payload.password !== "string" || payload.password.length === 0) {
    fields.push("password");
  }
  if (typeof payload.dateOfJoining !== "string" || payload.dateOfJoining.length === 0) {
    fields.push("dateOfJoining");
  }
  const role = payload.role;
  if (typeof role !== "string" || !REGISTERABLE_ROLES.includes(role as UserRole)) {
    fields.push("role");
  }
  const isEmployee = role === "Employee";
  if (isEmployee && (typeof payload.managerId !== "string" || payload.managerId.length === 0)) {
    fields.push("managerId");
  }
  if (fields.length > 0) {
    return NextResponse.json({ error: "validation_error", fields }, { status: 400 });
  }

  const callerRole = authResult.identity.role;
  const targetRole = role as UserRole;
  const callerIsAllowed = callerRole === "Admin" || (callerRole === "HR" && targetRole === "Employee");
  if (!callerIsAllowed) {
    return forbidden("Your role is not permitted to register this user.");
  }

  let managerId: Types.ObjectId | undefined;
  if (isEmployee) {
    if (!Types.ObjectId.isValid(payload.managerId as string)) {
      return NextResponse.json({ error: "manager_not_found" }, { status: 404 });
    }
    // QT18 (managerId referencing a soft-deleted Manager) is an unresolved Open QA
    // Question. Excluding soft-deleted Managers is this implementation's concrete
    // choice, not a silent resolution — flagged in the Gate 2 report.
    const manager = await User.findOne({ _id: payload.managerId, role: "Manager", deletedAt: null });
    if (!manager) {
      return NextResponse.json({ error: "manager_not_found" }, { status: 404 });
    }
    managerId = manager._id;
  }

  const passwordHash = await hashPassword(payload.password as string);

  try {
    const user = await User.create({
      username: payload.username,
      passwordHash,
      role: targetRole,
      dateOfJoining: new Date(payload.dateOfJoining as string),
      managerId,
    });

    return NextResponse.json(
      {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        dateOfJoining: (payload.dateOfJoining as string),
        managerId: managerId ? managerId.toString() : null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000) {
      return NextResponse.json({ error: "username_exists" }, { status: 409 });
    }
    throw error;
  }
}
