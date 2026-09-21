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

async function createRequest(
  status: TransferRequestStatus = "Pending: Payroll, IT, Facilities",
  overrides: Record<string, unknown> = {},
) {
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
    ...overrides,
  });

  return { transferRequest };
}

async function callPayrollTask(id: string, body: unknown, callerUserId: string | null, callerRole: string | null) {
  const { POST } = await import("@/app/api/transfer-requests/[id]/payroll-task/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerUserId !== null && callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerUserId, callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/transfer-requests/${id}/payroll-task`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const response = await POST(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST .../payroll-task — AC10/UT10: Payroll completes its task independently", () => {
  it("marks only payrollTaskStatus Completed, leaving IT/Facilities unaffected, with an update action", async () => {
    const { transferRequest } = await createRequest();
    const { status, json } = await callPayrollTask(
      transferRequest._id.toString(),
      { action: "update", salary: "80000", compensation: "10000", tax: "TX-1", costCenter: "CC-1" },
      new Types.ObjectId().toString(),
      "Payroll",
    );
    expect(status).toBe(200);
    expect(json).toEqual({ id: transferRequest._id.toString(), payrollTaskStatus: "Completed" });

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.payrollTaskStatus).toBe("Completed");
    expect(updated?.itTaskStatus).toBe("Pending");
    expect(updated?.facilitiesTaskStatus).toBe("Pending");
  });

  it("no_action_needed is a valid alternative to update, also marking the task Completed", async () => {
    const { transferRequest } = await createRequest();
    const { status, json } = await callPayrollTask(
      transferRequest._id.toString(),
      { action: "no_action_needed" },
      new Types.ObjectId().toString(),
      "Payroll",
    );
    expect(status).toBe(200);
    expect(json.payrollTaskStatus).toBe("Completed");
  });
});

describe("POST .../payroll-task — 403: non-Payroll blocked", () => {
  it.each(["Employee", "Manager", "HR", "IT", "Facilities", "Admin"])("%s is 403", async (role) => {
    const { transferRequest } = await createRequest();
    const { status, json } = await callPayrollTask(
      transferRequest._id.toString(),
      { action: "no_action_needed" },
      "some-user",
      role,
    );
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("POST .../payroll-task — 409/QT16: parallel tasks don't exist yet", () => {
  it.each(["Pending: Manager", "Pending: HR"] as TransferRequestStatus[])("responds 409 when status is %s", async (status) => {
    const { transferRequest } = await createRequest(status);
    const { status: httpStatus } = await callPayrollTask(
      transferRequest._id.toString(),
      { action: "no_action_needed" },
      "payroll-user",
      "Payroll",
    );
    expect(httpStatus).toBe(409);
  });
});

describe("POST .../payroll-task — 409/QT17: already Completed (idempotency)", () => {
  it("a second completion attempt responds 409", async () => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities", { payrollTaskStatus: "Completed" });
    const { status } = await callPayrollTask(
      transferRequest._id.toString(),
      { action: "no_action_needed" },
      "payroll-user",
      "Payroll",
    );
    expect(status).toBe(409);
  });
});

describe("POST .../payroll-task — AC25: transitions to Pending: Transfer only when it's genuinely the last of the 3", () => {
  it("stays Pending: Payroll, IT, Facilities when IT/Facilities are still Pending", async () => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities", {
      itTaskStatus: "Pending",
      facilitiesTaskStatus: "Pending",
    });
    await callPayrollTask(
      transferRequest._id.toString(),
      { action: "no_action_needed" },
      new Types.ObjectId().toString(),
      "Payroll",
    );

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.status).toBe("Pending: Payroll, IT, Facilities");
  });

  it("transitions to Pending: Transfer when Payroll is the last of the 3 to complete (UT25)", async () => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities", {
      itTaskStatus: "Completed",
      facilitiesTaskStatus: "Completed",
    });
    await callPayrollTask(
      transferRequest._id.toString(),
      { action: "no_action_needed" },
      new Types.ObjectId().toString(),
      "Payroll",
    );

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.status).toBe("Pending: Transfer");
  });
});

describe("POST .../payroll-task — not found and authentication", () => {
  it("a non-existent request id responds 404", async () => {
    const { status } = await callPayrollTask(new Types.ObjectId().toString(), { action: "no_action_needed" }, "payroll-user", "Payroll");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const { transferRequest } = await createRequest();
    const { status } = await callPayrollTask(transferRequest._id.toString(), { action: "no_action_needed" }, null, null);
    expect(status).toBe(401);
  });
});

describe("POST .../payroll-task — internal-transfer-workflow.T09: audit-trail integration", () => {
  it("appends an entry with action 'payroll_task_completed' on success", async () => {
    const { transferRequest } = await createRequest();
    const payrollUserId = new Types.ObjectId().toString();
    await callPayrollTask(transferRequest._id.toString(), { action: "no_action_needed" }, payrollUserId, "Payroll");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("payroll_task_completed");
    expect(entries[0].actorId.toString()).toBe(payrollUserId);
  });

  it("does not append an entry when blocked (409, already Completed)", async () => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities", { payrollTaskStatus: "Completed" });
    await callPayrollTask(transferRequest._id.toString(), { action: "no_action_needed" }, new Types.ObjectId().toString(), "Payroll");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(0);
  });
});