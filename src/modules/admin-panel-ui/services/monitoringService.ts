import { authenticatedFetch } from "@/shared/auth/authenticatedFetch";

export interface TransferRequestListItem {
  id: string;
  status: string;
  employeeId: string;
  submittedAt: string;
}

export async function fetchTransferRequestsList(): Promise<TransferRequestListItem[]> {
  const response = await authenticatedFetch("/api/admin/transfer-requests");
  if (!response.ok) {
    throw new Error("Failed to fetch the transfer request monitoring list.");
  }
  return response.json();
}

export interface TransferRequestActionHistoryEntry {
  actor: string;
  action: string;
  timestamp: string;
}

export interface TransferRequestDetailData {
  id: string;
  status: string;
  departmentId: string;
  location: string;
  jobRoleId: string;
  effectiveDate: string;
  reason?: string;
  assignedManagerId: string;
  submittedAt: string;
  actionHistory: TransferRequestActionHistoryEntry[];
}

// Returns null specifically for a 404 (malformed or missing id both produce
// an identical 404 server-side, per this project's standing convention) so
// the component can render a distinct not-found state; throws for any other
// failure.
export async function fetchTransferRequestDetail(id: string): Promise<TransferRequestDetailData | null> {
  const response = await authenticatedFetch(`/api/admin/transfer-requests/${id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch the transfer request detail.");
  }
  return response.json();
}
