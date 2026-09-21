import { authenticatedFetch } from "@/shared/auth/authenticatedFetch";

export interface DepartmentListItem {
  id: string;
  name: string;
}

// Same error-body-parsing convention as usersService.ts — this project's
// error shapes vary ({ error: "code_string" } vs { error: { message } }).
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

export async function fetchDepartments(): Promise<DepartmentListItem[]> {
  const response = await authenticatedFetch("/api/departments");
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function createDepartment(payload: { name: string }): Promise<DepartmentListItem> {
  const response = await authenticatedFetch("/api/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function editDepartment(id: string, name: string): Promise<DepartmentListItem> {
  const response = await authenticatedFetch(`/api/departments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function deleteDepartment(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/departments/${id}`, { method: "DELETE" });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
}

export interface JobRoleListItem {
  id: string;
  title: string;
}

export async function fetchJobRoles(): Promise<JobRoleListItem[]> {
  const response = await authenticatedFetch("/api/job-roles");
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function createJobRole(payload: { title: string }): Promise<JobRoleListItem> {
  const response = await authenticatedFetch("/api/job-roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function editJobRole(id: string, title: string): Promise<JobRoleListItem> {
  const response = await authenticatedFetch(`/api/job-roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export async function deleteJobRole(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/job-roles/${id}`, { method: "DELETE" });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
}
