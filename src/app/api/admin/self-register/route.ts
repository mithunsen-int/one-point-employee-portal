import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/services/users/passwordHashing";
import { User } from "@/services/users/User";
import {
  isRateLimited,
  recordRequest,
  SELF_REGISTER_RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/services/users/selfRegisterRateLimiter";

interface SelfRegisterPayload {
  username?: unknown;
  password?: unknown;
}

function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

// Deliberately unauthenticated — this is the one bootstrap endpoint that must
// work before any user exists. Excluding it from the RBAC middleware is
// rbac-api-security.T06's job on the wiring side; this file simply never calls
// authenticateRequest, correctly.
export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "rate_limited", retry_after: SELF_REGISTER_RATE_LIMIT_RETRY_AFTER_SECONDS },
      { status: 429 },
    );
  }
  recordRequest(ip);

  let payload: SelfRegisterPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation_error", fields: ["username", "password"] }, { status: 400 });
  }

  const fields: string[] = [];
  if (typeof payload.username !== "string" || payload.username.length === 0) {
    fields.push("username");
  }
  if (typeof payload.password !== "string" || payload.password.length === 0) {
    fields.push("password");
  }
  if (fields.length > 0) {
    return NextResponse.json({ error: "validation_error", fields }, { status: 400 });
  }

  const passwordHash = await hashPassword(payload.password as string);

  try {
    const admin = await User.create({
      username: payload.username,
      passwordHash,
      role: "Admin",
      // API06's request payload doesn't collect dateOfJoining, but T01's schema
      // requires it for every role regardless. Defaulting to registration time
      // — a minimal, reasonable choice for a bootstrap Admin, flagged here
      // rather than left as an unexplained default.
      dateOfJoining: new Date(),
    });

    return NextResponse.json(
      { id: admin._id.toString(), username: admin.username, role: admin.role },
      { status: 201 },
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000) {
      return NextResponse.json({ error: "admin_already_exists" }, { status: 409 });
    }
    throw error;
  }
}
