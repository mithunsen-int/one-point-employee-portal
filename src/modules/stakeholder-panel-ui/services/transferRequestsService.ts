import { authenticatedFetch } from "@/shared/auth/authenticatedFetch";

export interface MyRequestsListItem {
  id: string;
  status: string;
  employeeId: string;
  submittedAt: string;
  payrollTaskStatus: "Pending" | "Completed";
  itTaskStatus: "Pending" | "Completed";
  facilitiesTaskStatus: "Pending" | "Completed";
}

// No client-supplied filter — API10 already role-filters server-side
// (stakeholder-panel-ui.AC2c). This screen renders exactly what it returns.
export async function fetchMyRequests(): Promise<MyRequestsListItem[]> {
  const response = await authenticatedFetch("/api/transfer-requests/mine");
  if (!response.ok) {
    throw new Error("Failed to fetch your requests.");
  }
  return response.json();
}

export interface SubmitRequestPayload {
  departmentId: string;
  location: string;
  jobRoleId: string;
  effectiveDate: string;
  reason?: string;
}

export interface SubmitRequestResponse {
  id: string;
  status: string;
  submittedAt: string;
}

// Same error-body-parsing convention as admin-panel-ui's services — this
// project's error shapes vary ({ error: "code_string" } vs { error: { message } }).
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

export async function submitRequest(payload: SubmitRequestPayload): Promise<SubmitRequestResponse> {
  const response = await authenticatedFetch("/api/transfer-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export interface RequestActionHistoryEntry {
  actor: string;
  action: string;
  timestamp: string;
}

export interface RequestDetailData {
  id: string;
  status: string;
  actionHistory: RequestActionHistoryEntry[];
  pendingStakeholders: string[];
}

export async function fetchRequestDetail(id: string): Promise<RequestDetailData> {
  const response = await authenticatedFetch(`/api/transfer-requests/${id}`);
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export interface WithdrawResponse {
  id: string;
  status: string;
}

export async function withdrawRequest(id: string): Promise<WithdrawResponse> {
  const response = await authenticatedFetch(`/api/transfer-requests/${id}/withdraw`, { method: "POST" });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export interface ManagerDecisionPayload {
  decision: "approve" | "reject";
  reason?: string;
}

export interface ManagerDecisionResponse {
  id: string;
  status: string;
}

export async function submitManagerDecision(
  id: string,
  payload: ManagerDecisionPayload,
): Promise<ManagerDecisionResponse> {
  const response = await authenticatedFetch(`/api/transfer-requests/${id}/manager-decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export interface HrDecisionPayload {
  decision: "approve" | "reject";
  reason?: string;
}

export interface HrDecisionResponse {
  id: string;
  status: string;
}

export async function submitHrDecision(id: string, payload: HrDecisionPayload): Promise<HrDecisionResponse> {
  const response = await authenticatedFetch(`/api/transfer-requests/${id}/hr-decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export type PayrollTaskPayload =
  | { action: "no_action_needed" }
  | { action: "update"; salary: string; compensation: string; tax: string; costCenter: string };

export interface PayrollTaskResponse {
  id: string;
  payrollTaskStatus: string;
}

export async function submitPayrollTask(id: string, payload: PayrollTaskPayload): Promise<PayrollTaskResponse> {
  const response = await authenticatedFetch(`/api/transfer-requests/${id}/payroll-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export interface ItTaskPayload {
  systemsAccess: string[];
  permissions: string[];
  devices: string[];
}

export interface ItTaskResponse {
  id: string;
  itTaskStatus: string;
}

export async function submitItTask(id: string, payload: ItTaskPayload): Promise<ItTaskResponse> {
  const response = await authenticatedFetch(`/api/transfer-requests/${id}/it-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export interface FacilitiesTaskPayload {
  workspace: string;
  officeLogistics: string;
  locationSetup: string;
}

export interface FacilitiesTaskResponse {
  id: string;
  facilitiesTaskStatus: string;
}

export async function submitFacilitiesTask(
  id: string,
  payload: FacilitiesTaskPayload,
): Promise<FacilitiesTaskResponse> {
  const response = await authenticatedFetch(`/api/transfer-requests/${id}/facilities-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}

export interface HrFinalMappingPayload {
  newManagerId: string;
}

export interface HrFinalMappingResponse {
  id: string;
  status: string;
}

export async function submitHrFinalMapping(
  id: string,
  payload: HrFinalMappingPayload,
): Promise<HrFinalMappingResponse> {
  const response = await authenticatedFetch(`/api/transfer-requests/${id}/hr-final-mapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.json();
}
