const TOKEN_KEY = "stakeholder-panel-ui.session.token";
const EXPIRES_AT_KEY = "stakeholder-panel-ui.session.expiresAt";

export interface Session {
  token: string;
  role: string;
  expiresAt: number;
}

// Client-side decode only, no signature verification — a pure UX read used
// for routing/guard decisions. Real authorization is enforced server-side
// (constitution.md's Security Posture); this must never be treated as a
// trust boundary. Returns null (never throws) for a token that isn't
// well-formed — corrupted localStorage must degrade to "no session," not
// crash the guard that calls this (admin-panel-ui.QT17/QT19,
// stakeholder-panel-ui.QT22).
function decodeRole(token: string): string | null {
  try {
    const payloadSegment = token.split(".")[1];
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function persistSession(token: string, expiresInSeconds: number): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
}

export function readSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAtRaw = localStorage.getItem(EXPIRES_AT_KEY);
  if (!token || !expiresAtRaw) {
    return null;
  }

  const role = decodeRole(token);
  const expiresAt = Number(expiresAtRaw);
  if (role === null || Number.isNaN(expiresAt)) {
    return null;
  }

  return { token, role, expiresAt };
}

export function isSessionExpired(): boolean {
  const session = readSession();
  if (!session) {
    return true;
  }
  return Date.now() > session.expiresAt;
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}
