import { NextResponse } from "next/server";
import { verifyToken } from "@/services/auth/jwt";

export interface AuthenticatedIdentity {
  userId: string;
  role: string;
}

export type AuthenticationResult =
  | { authenticated: true; identity: AuthenticatedIdentity }
  | { authenticated: false; response: NextResponse };

const BEARER_PREFIX = "Bearer ";

function unauthenticated(message: string): AuthenticationResult {
  return {
    authenticated: false,
    response: NextResponse.json({ error: { code: "UNAUTHENTICATED", message } }, { status: 401 }),
  };
}

export function authenticateRequest(request: Request): AuthenticationResult {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    return unauthenticated("Missing or malformed Authorization header.");
  }

  const token = header.slice(BEARER_PREFIX.length);
  if (token.length === 0) {
    return unauthenticated("Missing or malformed Authorization header.");
  }

  try {
    const payload = verifyToken(token);
    return { authenticated: true, identity: { userId: payload.userId, role: payload.role } };
  } catch {
    return unauthenticated("Invalid or expired token.");
  }
}
