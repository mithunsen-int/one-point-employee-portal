import { authenticatedFetch } from "@/shared/auth/authenticatedFetch";

export interface DashboardSummary {
  userCounts: Record<string, number>;
  totalTransferRequests: number;
  statusBreakdown: Record<string, number>;
}

export async function fetchDashboard(): Promise<DashboardSummary> {
  const response = await authenticatedFetch("/api/admin/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data.");
  }
  return response.json();
}
