import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signToken, DEFAULT_EXPIRES_IN_SECONDS } from "@/services/auth/jwt";
import { findUserForLogin } from "@/services/auth/userLookup";
import { isRateLimited, recordFailedAttempt, RATE_LIMIT_RETRY_AFTER_SECONDS } from "@/services/auth/rateLimiter";

interface LoginPayload {
  username?: unknown;
  password?: unknown;
}

export async function POST(request: NextRequest) {
  let payload: LoginPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "validation_error", fields: ["username", "password"] },
      { status: 400 },
    );
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

  const username = payload.username as string;
  const password = payload.password as string;

  if (isRateLimited(username)) {
    return NextResponse.json(
      { error: "rate_limited", retry_after: RATE_LIMIT_RETRY_AFTER_SECONDS },
      { status: 429 },
    );
  }

  const user = await findUserForLogin(username);
  if (!user || user.deletedAt) {
    recordFailedAttempt(username);
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    recordFailedAttempt(username);
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const accessToken = signToken(
    { userId: user.userId, role: user.role },
    { expiresInSeconds: DEFAULT_EXPIRES_IN_SECONDS },
  );

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: DEFAULT_EXPIRES_IN_SECONDS,
    },
    { status: 200 },
  );
}
