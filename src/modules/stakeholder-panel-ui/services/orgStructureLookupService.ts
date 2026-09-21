import { authenticatedFetch } from "@/shared/auth/authenticatedFetch";

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface JobRoleOption {
  id: string;
  title: string;
}

// Read-only, kept local to this module rather than reusing admin-panel-ui's
// orgStructureService.ts — that module's CRUD concerns are Admin-only and a
// different boundary; this is a one-off read, same treatment already
// applied to managersLookupService.ts (stakeholder-panel-ui.plan.md).
// Both endpoints were Admin-only until org-structure-management.T03 opened
// them to any authenticated role specifically so this form could exist.
export async function fetchDepartments(): Promise<DepartmentOption[]> {
  const response = await authenticatedFetch("/api/departments");
  if (!response.ok) {
    throw new Error("Failed to fetch departments.");
  }
  return response.json();
}

export async function fetchJobRoles(): Promise<JobRoleOption[]> {
  const response = await authenticatedFetch("/api/job-roles");
  if (!response.ok) {
    throw new Error("Failed to fetch job roles.");
  }
  return response.json();
}
