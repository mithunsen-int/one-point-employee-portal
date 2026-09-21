export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// No authenticatedFetch here — there's no session yet to attach.
export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.error === "string" ? body.error : "Login failed.");
  }

  return response.json();
}
