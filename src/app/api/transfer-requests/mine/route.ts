import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { AuditLog } from "@/services/audit/AuditLog";

const HISTORICAL_ACTOR_ROLES = ["Manager", "HR", "Payroll", "IT", "Facilities"];

// HOTFIX-2026-0921-stakeholder-lost-view-after-action (AC21–AC23, amended):
// this list is AC2c's only navigation path into the detail screen, so
// API02's historical-actor carve-out (AC19) was reachable in theory but
// undiscoverable in practice once a stakeholder's own request left their
// role's "currently actionable" window. Scoped to the specific person via
// the audit trail, same as AC19 — not a role-wide grant. Guarded by
// Types.ObjectId.isValid for the same reason as API02: a malformed userId
// must not crash the query.
async function auditedRequestIds(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return [];
  }
  const entries = await AuditLog.find({ actorId: userId }, { transferRequestId: 1 });
  return entries.map((entry) => entry.transferRequestId);
}

// No client-supplied filter — the caller's role (from the authenticated
// identity) alone determines which requests are "relevant to them" (AC20-24).
// Admin is explicitly excluded: transfer-admin-oversight.API02/API03 already
// serve Admin's unfiltered view, this endpoint isn't a second copy of that.
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { role, userId } = authResult.identity;
  const historicalRequestIds = HISTORICAL_ACTOR_ROLES.includes(role) ? await auditedRequestIds(userId) : [];

  let requests;
  switch (role) {
    case "Employee":
      requests = await TransferRequest.find({ employeeId: userId });
      break;
    case "Manager":
      requests = await TransferRequest.find({
        $or: [
          { assignedManagerId: userId, status: "Pending: Manager" },
          { _id: { $in: historicalRequestIds } },
        ],
      });
      break;
    case "HR":
      // AC22 (amended 2026-09-20, AC25): the second branch is now just
      // Pending: Transfer directly, set atomically once all 3 parallel
      // tasks complete — no longer re-checked via the three task fields here.
      requests = await TransferRequest.find({
        $or: [
          { status: "Pending: HR" },
          { status: "Pending: Transfer" },
          { _id: { $in: historicalRequestIds } },
        ],
      });
      break;
    case "Payroll":
      requests = await TransferRequest.find({
        $or: [
          { status: "Pending: Payroll, IT, Facilities", payrollTaskStatus: "Pending" },
          { _id: { $in: historicalRequestIds } },
        ],
      });
      break;
    case "IT":
      requests = await TransferRequest.find({
        $or: [
          { status: "Pending: Payroll, IT, Facilities", itTaskStatus: "Pending" },
          { _id: { $in: historicalRequestIds } },
        ],
      });
      break;
    case "Facilities":
      requests = await TransferRequest.find({
        $or: [
          { status: "Pending: Payroll, IT, Facilities", facilitiesTaskStatus: "Pending" },
          { _id: { $in: historicalRequestIds } },
        ],
      });
      break;
    default:
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "This endpoint has no view for your role." } },
        { status: 403 },
      );
  }

  return NextResponse.json(
    requests.map((r) => ({
      id: r._id.toString(),
      status: r.status,
      employeeId: r.employeeId.toString(),
      submittedAt: r.submittedAt.toISOString(),
      payrollTaskStatus: r.payrollTaskStatus,
      itTaskStatus: r.itTaskStatus,
      facilitiesTaskStatus: r.facilitiesTaskStatus,
    })),
    { status: 200 },
  );
}
