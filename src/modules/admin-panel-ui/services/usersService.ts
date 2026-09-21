import { authenticatedFetch } from "@/shared/auth/authenticatedFetch";

export interface UserListItem {
  id: string;
  username: string;
  role: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: string;
  dateOfJoining: string;
  managerId?: string;
}

// Extracts a human-readable message from this project's varying error-body
// shapes ({ error: "code_string" } or { error: { code, message } } or
// { error: "validation_error", fields: [...] }), so a 4xx is always
// surfaced on the form, not silently dropped (admin-panel-ui.AC5).
async function throwForErrorResponse(response: Response): Promise<never> {
  const body = await response.json().catch(() => null);
  if (body && typeof body.error === "string") {
    throw new Error(body.fields ? `${body.error}: ${body.fields.join(", ")}` : body.error);
  }
  if (body && body.error && typeof body.error.message === "string") {
    throw new Error(body.error.message);
  }
  throw new Error("Request failed.");
}

export async function fetchUsers(): Promise<UserListItem[]> {
  const response = await authenticatedFetch("/api/users");
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function createUser(payload: CreateUserPayload): Promise<UserListItem> {
  const response = await authenticatedFetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function editUserRole(id: string, role: string): Promise<UserListItem> {
  const response = await authenticatedFetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function deleteUser(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/users/${id}`, { method: "DELETE" });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
}
