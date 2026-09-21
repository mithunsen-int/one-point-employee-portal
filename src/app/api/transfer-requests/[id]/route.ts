import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/services/auth/authenticate";
import { TransferRequest, TransferRequestStatus } from "@/services/workflow/TransferRequest";
import { AuditLog } from "@/services/audit/AuditLog";
import { User } from "@/services/users/User";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function pendingStakeholdersFor(status: TransferRequestStatus): string[] {
  switch (status) {
    case "Pending: Manager":
      return ["Manager"];
    case "Pending: HR":
      return ["HR"];
    case "Pending: Payroll, IT, Facilities":
      return ["Payroll", "IT", "Facilities"];
    case "Pending: Transfer":
      return ["HR"];
    default:
      return [];
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const transferRequest = await TransferRequest.findById(id);
  if (!transferRequest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // No Admin carve-out here by design (AC19/QT26) — Admin uses
  // transfer-admin-oversight.API03, a separate endpoint this task doesn't
  // build.
  const isOwningEmployee = transferRequest.employeeId.toString() === authResult.identity.userId;
  // internal-transfer-workflow.T11 (AC19, amended 2026-09-20): the assigned
  // Manager may also view a request while it's theirs to decide on, reusing
  // AC21's exact eligibility rule. HR/Payroll/IT/Facilities get the same
  // treatment (AC22/AC23's rules) when their own consuming task needs it —
  // not added speculatively here.
  const isAssignedManagerOnPendingRequest =
    authResult.identity.role === "Manager" &&
    transferRequest.assignedManagerId.toString() === authResult.identity.userId &&
    transferRequest.status === "Pending: Manager";
  // internal-transfer-workflow.T12 (AC19, same amendment as T11): HR and
  // Payroll/IT/Facilities carve-outs, reusing AC22/AC23's exact eligibility
  // rules. Not person-specific — any user with the role, matching the
  // decision/task-completion endpoints' own existing non-routing rule.
  // AC22's second branch (amended 2026-09-20, AC25) is now just the
  // Pending: Transfer status directly — the three task fields are no longer
  // re-checked here, since that status is the authoritative signal.
  const isEligibleHr =
    authResult.identity.role === "HR" &&
    (transferRequest.status === "Pending: HR" || transferRequest.status === "Pending: Transfer");
  const isEligiblePayroll =
    authResult.identity.role === "Payroll" &&
    transferRequest.status === "Pending: Payroll, IT, Facilities" &&
    transferRequest.payrollTaskStatus === "Pending";
  const isEligibleIt =
    authResult.identity.role === "IT" &&
    transferRequest.status === "Pending: Payroll, IT, Facilities" &&
    transferRequest.itTaskStatus === "Pending";
  const isEligibleFacilities =
    authResult.identity.role === "Facilities" &&
    transferRequest.status === "Pending: Payroll, IT, Facilities" &&
    transferRequest.facilitiesTaskStatus === "Pending";
  // HOTFIX-2026-0921-stakeholder-lost-view-after-action (AC19, amended a
  // third time): every check above only ever covers "can I currently act" —
  // the moment a stakeholder acts, status moves on and they lose all view
  // access to a request they were legitimately involved in. This carve-out
  // is read-only and scoped to the specific person via the audit trail (not
  // their whole role) — it never grants or implies any action eligibility,
  // which stays exactly as each action endpoint already independently
  // enforces. Guarded by Types.ObjectId.isValid: a malformed/placeholder
  // userId (never possible for a real authenticated caller, but exercised
  // by several existing tests' negative-case fixtures) must not crash the
  // query — it simply can't have a real audit entry.
  const isHistoricalActor =
    ["Manager", "HR", "Payroll", "IT", "Facilities"].includes(authResult.identity.role) &&
    Types.ObjectId.isValid(authResult.identity.userId) &&
    (await AuditLog.exists({ transferRequestId: id, actorId: authResult.identity.userId })) !== null;
  const isEligibleViewer =
    isOwningEmployee ||
    isAssignedManagerOnPendingRequest ||
    isEligibleHr ||
    isEligiblePayroll ||
    isEligibleIt ||
    isEligibleFacilities ||
    isHistoricalActor;
  if (!isEligibleViewer) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You may only view your own transfer request." } },
      { status: 403 },
    );
  }

  // Same underlying data as transfer-audit-trail.API02, embedded inline per
  // that spec's own design note. The actor-to-username resolution logic is
  // intentionally duplicated here rather than extracted into a shared
  // helper — it's currently used in exactly one other place, and extracting
  // an abstraction for a single future consumer isn't warranted yet.
  const entries = await AuditLog.find({ transferRequestId: id });
  const actorIds = [...new Set(entries.map((entry) => entry.actorId.toString()))];
  const users = await User.find({ _id: { $in: actorIds } });
  const usernameByActorId = new Map(users.map((user) => [user._id.toString(), user.username]));

  return NextResponse.json(
    {
      id: transferRequest._id.toString(),
      status: transferRequest.status,
      actionHistory: entries.map((entry) => ({
        actor: usernameByActorId.get(entry.actorId.toString()) ?? entry.actorId.toString(),
        action: entry.action,
        timestamp: entry.timestamp.toISOString(),
      })),
      pendingStakeholders: pendingStakeholdersFor(transferRequest.status),
    },
    { status: 200 },
  );
}
