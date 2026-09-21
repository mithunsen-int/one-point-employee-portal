import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  role: string;
}

export interface VerifiedTokenPayload extends TokenPayload {
  iat: number;
  exp: number;
}

export interface SignTokenOptions {
  expiresInSeconds?: number;
}

export const DEFAULT_EXPIRES_IN_SECONDS = 900;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return secret;
}

export function signToken(payload: TokenPayload, options: SignTokenOptions = {}): string {
  const secret = getSecret();
  const expiresInSeconds = options.expiresInSeconds ?? DEFAULT_EXPIRES_IN_SECONDS;
  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds });
}

export function verifyToken(token: string): VerifiedTokenPayload {
  const secret = getSecret();
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string") {
    throw new Error("Unexpected string payload from JWT verification.");
  }
  return decoded as VerifiedTokenPayload;
}
