import { NextResponse } from "next/server";
import { withAuthorization } from "@/services/auth/withAuthorization";
import { User } from "@/services/users/User";
import { TransferRequest, TRANSFER_REQUEST_STATUSES } from "@/services/workflow/TransferRequest";

// Exactly the six roles AC1 names — excludes Admin (there is exactly one,
// and it isn't a headcount to track) and excludes soft-deleted users
// (deletedAt: null), per the plan's explicit decision.
const DASHBOARD_ROLES = ["Employee", "HR", "Manager", "Payroll", "IT", "Facilities"] as const;

export const GET = withAuthorization("admin.transferMonitoring", async () => {
  const userCounts: Record<string, number> = {};
  for (const role of DASHBOARD_ROLES) {
    userCounts[role] = await User.countDocuments({ role, deletedAt: null });
  }

  const statusBreakdown: Record<string, number> = {};
  let totalTransferRequests = 0;
  for (const status of TRANSFER_REQUEST_STATUSES) {
    const count = await TransferRequest.countDocuments({ status });
    statusBreakdown[status] = count;
    totalTransferRequests += count;
  }

  return NextResponse.json({ userCounts, totalTransferRequests, statusBreakdown }, { status: 200 });
});
