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

async function createRequest(status: TransferRequestStatus, overrides: Record<string, unknown> = {}) {
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

  return { transferRequest, employee, manager };
}

async function callGet(id: string, callerUserId: string | null, callerRole: string | null) {
  const { GET } = await import("@/app/api/transfer-requests/[id]/route");
  const headers = new Headers();
  if (callerUserId !== null && callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerUserId, callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/transfer-requests/${id}`, { method: "GET", headers });
  const response = await GET(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("GET /transfer-requests/{id} — AC19: requesting Employee views their own request", () => {
  it("returns 200 with id/status/actionHistory/pendingStakeholders", async () => {
    const { transferRequest, employee } = await createRequest("Pending: Manager");

    const { status, json } = await callGet(transferRequest._id.toString(), employee._id.toString(), "Employee");
    expect(status).toBe(200);
    expect(json.id).toBe(transferRequest._id.toString());
    expect(json.status).toBe("Pending: Manager");
    expect(Array.isArray(json.actionHistory)).toBe(true);
    expect(json.pendingStakeholders).toEqual(["Manager"]);
  });

  it("includes actionHistory entries sourced from AuditLogs, actor resolved to username", async () => {
    const { transferRequest, employee } = await createRequest("Pending: Manager");
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: employee._id,
      actorRole: "Employee",
      action: "submitted",
      timestamp: new Date(),
    });

    const { json } = await callGet(transferRequest._id.toString(), employee._id.toString(), "Employee");
    expect(json.actionHistory).toHaveLength(1);
    expect(json.actionHistory[0]).toEqual(
      expect.objectContaining({ actor: employee.username, action: "submitted", timestamp: expect.any(String) }),
    );
  });
});

describe("GET /transfer-requests/{id} — AC18/QT24: status rendered exactly, pendingStakeholders derived", () => {
  it.each([
    ["Pending: Manager", ["Manager"]],
    ["Pending: HR", ["HR"]],
    ["Pending: Payroll, IT, Facilities", ["Payroll", "IT", "Facilities"]],
    ["Pending: Transfer", ["HR"]],
    ["Rejected", []],
    ["Withdrawn", []],
    ["Completed", []],
  ] as [TransferRequestStatus, string[]][])("status %s renders exactly, pendingStakeholders %j", async (status, expected) => {
    const { transferRequest, employee } = await createRequest(status);

    const { json } = await callGet(transferRequest._id.toString(), employee._id.toString(), "Employee");
    expect(json.status).toBe(status);
    expect(json.pendingStakeholders).toEqual(expected);
  });
});

describe("GET /transfer-requests/{id} — AC19/UT19/QT25/QT26: blocked for anyone else, no Admin bypass", () => {
  it("an unrelated Manager (not assigned to this request, not the requester) is 403 (UT19)", async () => {
    const { transferRequest } = await createRequest("Pending: Manager");
    const unrelatedManager = await User.create({
      username: `other-manager-${Date.now()}-${Math.random()}`,
      passwordHash: "hash",
      role: "Manager",
      dateOfJoining: new Date(),
    });
    const { status, json } = await callGet(
      transferRequest._id.toString(),
      unrelatedManager._id.toString(),
      "Manager",
    );
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it.each(["HR", "Payroll", "IT", "Facilities"])("%s is 403 (QT25)", async (role) => {
    const { transferRequest } = await createRequest("Pending: Manager");
    const { status } = await callGet(transferRequest._id.toString(), "some-user-id", role);
    expect(status).toBe(403);
  });

  it("Admin has no carve-out on this endpoint (QT26)", async () => {
    const { transferRequest } = await createRequest("Pending: Manager");
    const { status } = await callGet(transferRequest._id.toString(), "admin-1", "Admin");
    expect(status).toBe(403);
  });

  it("a different Employee (not the requester) is 403", async () => {
    const { transferRequest } = await createRequest("Pending: Manager");
    const { status } = await callGet(transferRequest._id.toString(), "different-employee-id", "Employee");
    expect(status).toBe(403);
  });
});

describe("GET /transfer-requests/{id} — internal-transfer-workflow.T11/AC19 carve-out: assigned Manager", () => {
  it("the assigned Manager gets 200 with full detail while status is Pending: Manager (UT19a)", async () => {
    const { transferRequest, manager } = await createRequest("Pending: Manager");

    const { status, json } = await callGet(transferRequest._id.toString(), manager._id.toString(), "Manager");
    expect(status).toBe(200);
    expect(json.id).toBe(transferRequest._id.toString());
    expect(json.status).toBe("Pending: Manager");
    expect(json.pendingStakeholders).toEqual(["Manager"]);
  });

  it("the assigned Manager is 403 once the request has moved past Pending: Manager", async () => {
    const { transferRequest, manager } = await createRequest("Pending: HR");

    const { status } = await callGet(transferRequest._id.toString(), manager._id.toString(), "Manager");
    expect(status).toBe(403);
  });
});

describe("GET /transfer-requests/{id} — internal-transfer-workflow.T12/AC19 carve-out: HR", () => {
  it("HR gets 200 while status is Pending: HR (AC22 branch 1)", async () => {
    const { transferRequest } = await createRequest("Pending: HR");

    const { status, json } = await callGet(transferRequest._id.toString(), "hr-1", "HR");
    expect(status).toBe(200);
    expect(json.status).toBe("Pending: HR");
  });

  it("HR gets 403 on a Pending: Manager request (not yet HR's turn)", async () => {
    const { transferRequest } = await createRequest("Pending: Manager");

    const { status } = await callGet(transferRequest._id.toString(), "hr-1", "HR");
    expect(status).toBe(403);
  });

  it("HR gets 200 on a Pending: Transfer request (AC22 branch 2, amended 2026-09-20 for AC25)", async () => {
    const { transferRequest } = await createRequest("Pending: Transfer", {
      payrollTaskStatus: "Completed",
      itTaskStatus: "Completed",
      facilitiesTaskStatus: "Completed",
    });

    const { status } = await callGet(transferRequest._id.toString(), "hr-1", "HR");
    expect(status).toBe(200);
  });

  it("HR gets 403 while status is still Pending: Payroll, IT, Facilities, even if all 3 task fields happen to be Completed (status is now authoritative, not the task fields)", async () => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities", {
      payrollTaskStatus: "Completed",
      itTaskStatus: "Completed",
      facilitiesTaskStatus: "Completed",
    });

    const { status } = await callGet(transferRequest._id.toString(), "hr-1", "HR");
    expect(status).toBe(403);
  });
});

describe("GET /transfer-requests/{id} — internal-transfer-workflow.T12/AC19 carve-out: Payroll/IT/Facilities", () => {
  it.each([
    ["Payroll", "payrollTaskStatus"],
    ["IT", "itTaskStatus"],
    ["Facilities", "facilitiesTaskStatus"],
  ] as const)("%s gets 200 while status is Pending: Payroll, IT, Facilities and its own task is Pending", async (role, taskField) => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities", { [taskField]: "Pending" });

    const { status } = await callGet(transferRequest._id.toString(), `${role.toLowerCase()}-1`, role);
    expect(status).toBe(200);
  });

  it.each([
    ["Payroll", "payrollTaskStatus"],
    ["IT", "itTaskStatus"],
    ["Facilities", "facilitiesTaskStatus"],
  ] as const)("%s gets 403 once its own task is already Completed", async (role, taskField) => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities", { [taskField]: "Completed" });

    const { status } = await callGet(transferRequest._id.toString(), `${role.toLowerCase()}-1`, role);
    expect(status).toBe(403);
  });

  it("Payroll gets 403 on a Pending: HR request (not yet their stage)", async () => {
    const { transferRequest } = await createRequest("Pending: HR");

    const { status } = await callGet(transferRequest._id.toString(), "payroll-1", "Payroll");
    expect(status).toBe(403);
  });
});

describe("GET /transfer-requests/{id} — HOTFIX-2026-0921-stakeholder-lost-view-after-action/AC19 (3rd amendment): historical-actor carve-out", () => {
  it("a Manager who already approved (audit entry exists) can still view the request after status moved on", async () => {
    const { transferRequest, manager } = await createRequest("Pending: HR");
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: manager._id,
      actorRole: "Manager",
      action: "manager_approved",
      timestamp: new Date(),
    });

    const { status, json } = await callGet(transferRequest._id.toString(), manager._id.toString(), "Manager");
    expect(status).toBe(200);
    expect(json.status).toBe("Pending: HR");
  });

  it("an HR user who already approved can still view the request once it's Pending: Payroll, IT, Facilities", async () => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities");
    const hrUserId = new Types.ObjectId();
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: hrUserId,
      actorRole: "HR",
      action: "hr_approved",
      timestamp: new Date(),
    });

    const { status } = await callGet(transferRequest._id.toString(), hrUserId.toString(), "HR");
    expect(status).toBe(200);
  });

  it("a Payroll user who already completed their task can still view the request once it's Pending: Transfer", async () => {
    const { transferRequest } = await createRequest("Pending: Transfer", {
      payrollTaskStatus: "Completed",
      itTaskStatus: "Completed",
      facilitiesTaskStatus: "Completed",
    });
    const payrollUserId = new Types.ObjectId();
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: payrollUserId,
      actorRole: "Payroll",
      action: "payroll_task_completed",
      timestamp: new Date(),
    });

    const { status } = await callGet(transferRequest._id.toString(), payrollUserId.toString(), "Payroll");
    expect(status).toBe(200);
  });

  it("a different HR user with no audit entry on this request still gets 403 (person-specific, not role-blanket)", async () => {
    const { transferRequest } = await createRequest("Pending: Payroll, IT, Facilities");
    const actingHrUserId = new Types.ObjectId();
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: actingHrUserId,
      actorRole: "HR",
      action: "hr_approved",
      timestamp: new Date(),
    });

    const { status } = await callGet(transferRequest._id.toString(), new Types.ObjectId().toString(), "HR");
    expect(status).toBe(403);
  });

  it("a Manager who already approved can still view the request once it has reached the terminal Completed status", async () => {
    const { transferRequest, manager } = await createRequest("Completed", {
      payrollTaskStatus: "Completed",
      itTaskStatus: "Completed",
      facilitiesTaskStatus: "Completed",
    });
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: manager._id,
      actorRole: "Manager",
      action: "manager_approved",
      timestamp: new Date(),
    });

    const { status, json } = await callGet(transferRequest._id.toString(), manager._id.toString(), "Manager");
    expect(status).toBe(200);
    expect(json.status).toBe("Completed");
  });

  it("the HR user who performed the final mapping (the action that sets Completed) can still view the request afterward", async () => {
    const { transferRequest } = await createRequest("Completed", {
      payrollTaskStatus: "Completed",
      itTaskStatus: "Completed",
      facilitiesTaskStatus: "Completed",
    });
    const hrUserId = new Types.ObjectId();
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: hrUserId,
      actorRole: "HR",
      action: "hr_final_mapping",
      timestamp: new Date(),
    });

    const { status } = await callGet(transferRequest._id.toString(), hrUserId.toString(), "HR");
    expect(status).toBe(200);
  });
});

describe("GET /transfer-requests/{id} — not found and authentication", () => {
  it("a non-existent id responds 404", async () => {
    const { status, json } = await callGet(new Types.ObjectId().toString(), "employee-1", "Employee");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });

  it("responds 401 with no bearer token", async () => {
    const { transferRequest } = await createRequest("Pending: Manager");
    const { status } = await callGet(transferRequest._id.toString(), null, null);
    expect(status).toBe(401);
  });
});