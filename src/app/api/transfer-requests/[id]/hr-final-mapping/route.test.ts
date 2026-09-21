import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { User } from "@/services/users/User";
import { Department } from "@/services/org-structure/Department";
import { JobRole } from "@/services/org-structure/JobRole";
import { TransferRequest, TaskStatus } from "@/services/workflow/TransferRequest";
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
  taskStatuses: { payroll: TaskStatus; it: TaskStatus; facilities: TaskStatus },
  status: string = "Pending: Payroll, IT, Facilities",
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
    payrollTaskStatus: taskStatuses.payroll,
    itTaskStatus: taskStatuses.it,
    facilitiesTaskStatus: taskStatuses.facilities,
  });

  return { transferRequest, employee };
}

async function callFinalMapping(id: string, body: unknown, callerUserId: string | null, callerRole: string | null) {
  const { POST } = await import("@/app/api/transfer-requests/[id]/hr-final-mapping/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerUserId !== null && callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerUserId, callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/transfer-requests/${id}/hr-final-mapping`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const response = await POST(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST .../hr-final-mapping — AC13/UT13: request in Pending: Transfer", () => {
  it("sets status Completed, newManagerId, and completedAt", async () => {
    const { transferRequest } = await createRequest(
      { payroll: "Completed", it: "Completed", facilities: "Completed" },
      "Pending: Transfer",
    );
    const newManager = await User.create({
      username: `new-manager-${Date.now()}`,
      passwordHash: "hash",
      role: "Manager",
      dateOfJoining: new Date(),
    });

    const { status, json } = await callFinalMapping(
      transferRequest._id.toString(),
      { newManagerId: newManager._id.toString() },
      new Types.ObjectId().toString(),
      "HR",
    );
    expect(status).toBe(200);
    expect(json).toEqual({ id: transferRequest._id.toString(), status: "Completed" });

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.status).toBe("Completed");
    expect(updated?.newManagerId?.toString()).toBe(newManager._id.toString());
    expect(updated?.completedAt).toBeInstanceOf(Date);
  });

  it("actually updates the employee's own User.managerId, not just the request's record (AC13, confirmed 2026-09-19)", async () => {
    const { transferRequest, employee } = await createRequest(
      { payroll: "Completed", it: "Completed", facilities: "Completed" },
      "Pending: Transfer",
    );
    const newManager = await User.create({
      username: `new-manager-${Date.now()}`,
      passwordHash: "hash",
      role: "Manager",
      dateOfJoining: new Date(),
    });

    await callFinalMapping(
      transferRequest._id.toString(),
      { newManagerId: newManager._id.toString() },
      new Types.ObjectId().toString(),
      "HR",
    );

    const updatedEmployee = await User.findById(employee._id);
    expect(updatedEmployee?.managerId?.toString()).toBe(newManager._id.toString());
  });

  it("a different HR user than the one who approved at API04 is still permitted (QT20 — no per-request HR routing)", async () => {
    const { transferRequest } = await createRequest(
      { payroll: "Completed", it: "Completed", facilities: "Completed" },
      "Pending: Transfer",
    );
    const { status } = await callFinalMapping(
      transferRequest._id.toString(),
      { newManagerId: new Types.ObjectId().toString() },
      new Types.ObjectId().toString(),
      "HR",
    );
    expect(status).toBe(200);
  });
});

describe("POST .../hr-final-mapping — AC14/UT14/QT19: any single task still pending blocks it", () => {
  it("IT still pending responds 409 (spec's own example)", async () => {
    const { transferRequest } = await createRequest({ payroll: "Completed", it: "Pending", facilities: "Completed" });
    const { status } = await callFinalMapping(transferRequest._id.toString(), { newManagerId: new Types.ObjectId().toString() }, "hr-user", "HR");
    expect(status).toBe(409);
  });

  it("Payroll still pending responds 409 (QT19 variant)", async () => {
    const { transferRequest } = await createRequest({ payroll: "Pending", it: "Completed", facilities: "Completed" });
    const { status } = await callFinalMapping(transferRequest._id.toString(), { newManagerId: new Types.ObjectId().toString() }, "hr-user", "HR");
    expect(status).toBe(409);
  });

  it("Facilities still pending responds 409 (QT19 variant)", async () => {
    const { transferRequest } = await createRequest({ payroll: "Completed", it: "Completed", facilities: "Pending" });
    const { status } = await callFinalMapping(transferRequest._id.toString(), { newManagerId: new Types.ObjectId().toString() }, "hr-user", "HR");
    expect(status).toBe(409);
  });

  it("status alone is now authoritative (AC13/AC14 amended 2026-09-20): all 3 task fields Completed but status not yet Pending: Transfer still 409s", async () => {
    const { transferRequest } = await createRequest({ payroll: "Completed", it: "Completed", facilities: "Completed" });
    const { status } = await callFinalMapping(transferRequest._id.toString(), { newManagerId: new Types.ObjectId().toString() }, "hr-user", "HR");
    expect(status).toBe(409);
  });

  it("request is unchanged after a blocked attempt", async () => {
    const { transferRequest } = await createRequest({ payroll: "Completed", it: "Pending", facilities: "Completed" });
    await callFinalMapping(transferRequest._id.toString(), { newManagerId: new Types.ObjectId().toString() }, "hr-user", "HR");

    const unchanged = await TransferRequest.findById(transferRequest._id);
    expect(unchanged?.status).toBe("Pending: Payroll, IT, Facilities");
    expect(unchanged?.newManagerId).toBeUndefined();
  });
});

describe("POST .../hr-final-mapping — 403: non-HR blocked", () => {
  it.each(["Employee", "Manager", "Payroll", "IT", "Facilities", "Admin"])("%s is 403", async (role) => {
    const { transferRequest } = await createRequest({ payroll: "Completed", it: "Completed", facilities: "Completed" });
    const { status, json } = await callFinalMapping(
      transferRequest._id.toString(),
      { newManagerId: new Types.ObjectId().toString() },
      "some-user",
      role,
    );
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("POST .../hr-final-mapping — not found and authentication", () => {
  it("a non-existent request id responds 404", async () => {
    const { status } = await callFinalMapping(new Types.ObjectId().toString(), { newManagerId: new Types.ObjectId().toString() }, "hr-user", "HR");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const { transferRequest } = await createRequest({ payroll: "Completed", it: "Completed", facilities: "Completed" });
    const { status } = await callFinalMapping(transferRequest._id.toString(), { newManagerId: new Types.ObjectId().toString() }, null, null);
    expect(status).toBe(401);
  });
});

describe("POST .../hr-final-mapping — internal-transfer-workflow.T09: audit-trail integration", () => {
  it("appends an entry with action 'hr_final_mapping' on success", async () => {
    const { transferRequest } = await createRequest(
      { payroll: "Completed", it: "Completed", facilities: "Completed" },
      "Pending: Transfer",
    );
    const hrUserId = new Types.ObjectId().toString();
    await callFinalMapping(transferRequest._id.toString(), { newManagerId: new Types.ObjectId().toString() }, hrUserId, "HR");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("hr_final_mapping");
    expect(entries[0].actorId.toString()).toBe(hrUserId);
  });

  it("does not append an entry when blocked (409, a task still pending)", async () => {
    const { transferRequest } = await createRequest({ payroll: "Completed", it: "Pending", facilities: "Completed" });
    await callFinalMapping(
      transferRequest._id.toString(),
      { newManagerId: new Types.ObjectId().toString() },
      new Types.ObjectId().toString(),
      "HR",
    );

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(0);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT21 (the exact data shape of the "in-app confirmation") is an Open QA
//   Question — this task builds no distinct confirmation mechanism at all,
//   per its own scope note (AC15 is satisfied by T03's GET view surfacing
//   status: "Completed", nothing more).