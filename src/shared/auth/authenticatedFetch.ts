import { readSession, isSessionExpired, clearSession } from "@/shared/auth/session";
import { redirectToLogin } from "@/shared/auth/redirectToLogin";

// Consumed by every screen's service-layer fetch wrapper (admin-panel-ui.AC10,
// stakeholder-panel-ui.AC2b) — checks expiry before sending, and treats a 401
// response as a fallback trigger for the same force-logout, since no
// revocation/refresh mechanism exists (ADR-0001).
function forceLogout(): void {
  clearSession();
  redirectToLogin();
}

export async function authenticatedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (isSessionExpired()) {
    forceLogout();
    throw new Error("Session expired or not present — force-logout triggered.");
  }

  const session = readSession();
  const response = await fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
  });

  if (response.status === 401) {
    forceLogout();
  }

  return response;
}
