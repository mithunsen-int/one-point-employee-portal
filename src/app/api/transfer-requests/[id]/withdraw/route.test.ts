import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { User } from "@/services/users/User";
import { Department } from "@/services/org-structure/Department";
import { JobRole } from "@/services/org-structure/JobRole";
import { TransferRequest, TransferRequestStatus } from "@/services/workflow/TransferRequest";
import { AuditLog } from "@/services/audit/AuditLog";

const ORIGINAL_ENV = process.env;

beforeAll(async () => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
  await startTestDatabase();
  await User.init();
  await Department.init();
  await JobRole.init();
  await TransferRequest.init();
  await AuditLog.init();
}, 60000);

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
  process.env = ORIGINAL_ENV;
});

function tokenFor(userId: string, role: string): string {
  return signToken({ userId, role });
}

async function createRequest(status: TransferRequestStatus = "Pending: Manager") {
  const manager = await User.create({
    username: `manager-${Date.now()}-${Math.random()}`,
    passwordHash: "hash",
    role: "Manager",
    dateOfJoining: new Date(),
  });
  const employee = await User.create({
    username: `employee-${Date.now()}-${Math.random()}`,
    passwordHash: "hash",
    role: "Employee",
    dateOfJoining: new Date(),
    managerId: manager._id,
  });
  const department = await Department.create({ name: `Dept-${Date.now()}-${Math.random()}` });
  const jobRole = await JobRole.create({ title: `Role-${Date.now()}-${Math.random()}` });

  const transferRequest = await TransferRequest.create({
    employeeId: employee._id,
    departmentId: department._id,
    jobRoleId: jobRole._id,
    location: "Location A",
    effectiveDate: new Date("2026-06-01"),
    status,
    assignedManagerId: manager._id,
    submittedAt: new Date(),
  });

  return { transferRequest, employee, manager };
}

async function callWithdraw(id: string, callerUserId: string | null, callerRole: string | null) {
  const { POST } = await import("@/app/api/transfer-requests/[id]/withdraw/route");
  const headers = new Headers();
  if (callerUserId !== null && callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerUserId, callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/transfer-requests/${id}/withdraw`, { method: "POST", headers });
  const response = await POST(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST .../withdraw — AC16/UT16: Employee withdraws a Pending: Manager request", () => {
  it("moves status to Withdrawn and responds 200", async () => {
    const { transferRequest, employee } = await createRequest();
    const { status, json } = await callWithdraw(transferRequest._id.toString(), employee._id.toString(), "Employee");
    expect(status).toBe(200);
    expect(json).toEqual({ id: transferRequest._id.toString(), status: "Withdrawn" });

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.status).toBe("Withdrawn");
  });
});

describe("POST .../withdraw — AC17/UT17/QT23: any status other than Pending: Manager is 409", () => {
  it.each([
    "Pending: HR",
    "Pending: Payroll, IT, Facilities",
    "Rejected",
    "Withdrawn",
    "Completed",
  ] as TransferRequestStatus[])("responds 409 when status is %s", async (status) => {
    const { transferRequest, employee } = await createRequest(status);
    const { status: httpStatus } = await callWithdraw(transferRequest._id.toString(), employee._id.toString(), "Employee");
    expect(httpStatus).toBe(409);
  });
});

describe("POST .../withdraw — 403: only the requesting Employee", () => {
  it("a different Employee is 403", async () => {
    const { transferRequest } = await createRequest();
    const { status, json } = await callWithdraw(transferRequest._id.toString(), "a-different-employee", "Employee");
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("the assigned Manager is 403", async () => {
    const { transferRequest, manager } = await createRequest();
    const { status } = await callWithdraw(transferRequest._id.toString(), manager._id.toString(), "Manager");
    expect(status).toBe(403);
  });
});

describe("POST .../withdraw — not found and authentication", () => {
  it("a non-existent request id responds 404", async () => {
    const { status } = await callWithdraw(new Types.ObjectId().toString(), "some-employee", "Employee");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const { transferRequest } = await createRequest();
    const { status } = await callWithdraw(transferRequest._id.toString(), null, null);
    expect(status).toBe(401);
  });
});

describe("POST .../withdraw — internal-transfer-workflow.T09: audit-trail integration", () => {
  it("appends an entry with action 'withdrawn' on success", async () => {
    const { transferRequest, employee } = await createRequest();
    await callWithdraw(transferRequest._id.toString(), employee._id.toString(), "Employee");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("withdrawn");
    expect(entries[0].actorId.toString()).toBe(employee._id.toString());
  });

  it("does not append an entry when blocked (403, non-owner)", async () => {
    const { transferRequest } = await createRequest();
    await callWithdraw(transferRequest._id.toString(), "a-different-employee", "Employee");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(0);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT22 (withdraw racing a near-simultaneous Manager approval) is an Open
//   QA Question — no locking/race-condition behavior is specified anywhere,
//   and this task's own prompt file explicitly says not to invent one.