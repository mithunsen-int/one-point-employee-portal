import { NextResponse } from "next/server";
import { withAuthorization } from "@/services/auth/withAuthorization";
import { TransferRequest } from "@/services/workflow/TransferRequest";

// No filtering/search parameters accepted — the spec's explicit decision.
// Pagination is not stated anywhere (test_cases.md's QT06 Open Question); not
// invented here — returns the full unfiltered result set as literally
// described.
export const GET = withAuthorization("admin.transferMonitoring", async () => {
  const requests = await TransferRequest.find();

  return NextResponse.json(
    requests.map((request) => ({
      id: request._id.toString(),
      status: request.status,
      employeeId: request.employeeId.toString(),
      submittedAt: request.submittedAt.toISOString(),
    })),
    { status: 200 },
  );
});
