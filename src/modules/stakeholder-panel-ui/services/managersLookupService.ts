import { authenticatedFetch } from "@/shared/auth/authenticatedFetch";

export interface ManagerOption {
  id: string;
  username: string;
  role: string;
}

// Read-only, kept local to this module — not shared with admin-panel-ui's
// usersService.ts, same boundary already applied to orgStructureLookupService.ts.
// Calls user-management-console.API04's role=Manager carve-out
// (user-management-console.T07), opened specifically for this selector.
export async function fetchManagers(): Promise<ManagerOption[]> {
  const response = await authenticatedFetch("/api/users?role=Manager");
  if (!response.ok) {
    throw new Error("Failed to fetch managers.");
  }
  return response.json();
}
