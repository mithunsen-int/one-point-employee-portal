import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/services/auth/authenticate";
import { TransferRequest } from "@/services/workflow/TransferRequest";

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

  let requests;
  switch (role) {
    case "Employee":
      requests = await TransferRequest.find({ employeeId: userId });
      break;
    case "Manager":
      requests = await TransferRequest.find({ assignedManagerId: userId, status: "Pending: Manager" });
      break;
    case "HR":
      // AC22 (amended 2026-09-20, AC25): the second branch is now just
      // Pending: Transfer directly, set atomically once all 3 parallel
      // tasks complete — no longer re-checked via the three task fields here.
      requests = await TransferRequest.find({
        $or: [{ status: "Pending: HR" }, { status: "Pending: Transfer" }],
      });
      break;
    case "Payroll":
      requests = await TransferRequest.find({
        status: "Pending: Payroll, IT, Facilities",
        payrollTaskStatus: "Pending",
      });
      break;
    case "IT":
      requests = await TransferRequest.find({
        status: "Pending: Payroll, IT, Facilities",
        itTaskStatus: "Pending",
      });
      break;
    case "Facilities":
      requests = await TransferRequest.find({
        status: "Pending: Payroll, IT, Facilities",
        facilitiesTaskStatus: "Pending",
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
