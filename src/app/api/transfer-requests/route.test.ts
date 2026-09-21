import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { User } from "@/services/users/User";
import { Department } from "@/services/org-structure/Department";
import { JobRole } from "@/services/org-structure/JobRole";
import { TransferRequest } from "@/services/workflow/TransferRequest";
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

async function createEmployeeWithManager() {
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
  return { employee, manager };
}

async function createDeptAndRole() {
  const department = await Department.create({ name: `Dept-${Date.now()}-${Math.random()}` });
  const jobRole = await JobRole.create({ title: `Role-${Date.now()}-${Math.random()}` });
  return { department, jobRole };
}

function validPayload(departmentId: string, jobRoleId: string, overrides: Record<string, unknown> = {}) {
  return {
    departmentId,
    jobRoleId,
    location: "Location A",
    effectiveDate: "2026-06-01",
    reason: "Career growth",
    ...overrides,
  };
}

async function callSubmit(body: unknown, callerUserId: string | null, callerRole: string | null) {
  const { POST } = await import("@/app/api/transfer-requests/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerUserId !== null && callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerUserId, callerRole)}`);
  }
  const request = new NextRequest("http://localhost/api/transfer-requests", { method: "POST", headers, body: JSON.stringify(body) });
  const response = await POST(request);
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST /transfer-requests — AC1/UT01: Employee submits a valid request", () => {
  it("creates the request, status Pending: Manager, assignedManagerId snapshotted from the employee's managerId", async () => {
    const { employee, manager } = await createEmployeeWithManager();
    const { department, jobRole } = await createDeptAndRole();

    const { status, json } = await callSubmit(
      validPayload(department._id.toString(), jobRole._id.toString()),
      employee._id.toString(),
      "Employee",
    );

    expect(status).toBe(201);
    expect(json).toEqual({ id: expect.any(String), status: "Pending: Manager", submittedAt: expect.any(String) });

    const stored = await TransferRequest.findById(json.id);
    expect(stored?.assignedManagerId.toString()).toBe(manager._id.toString());
    expect(stored?.employeeId.toString()).toBe(employee._id.toString());
  });

  it("succeeds with the optional reason field omitted (QT01)", async () => {
    const { employee } = await createEmployeeWithManager();
    const { department, jobRole } = await createDeptAndRole();
    const payload = validPayload(department._id.toString(), jobRole._id.toString()) as Record<string, unknown>;
    delete payload.reason;

    const { status } = await callSubmit(payload, employee._id.toString(), "Employee");
    expect(status).toBe(201);
  });
});

describe("POST /transfer-requests — AC2/UT02/QT05-QT07: validation", () => {
  it.each(["departmentId", "jobRoleId", "location", "effectiveDate"])("missing %s responds 400 naming it", async (field) => {
    const { employee } = await createEmployeeWithManager();
    const { department, jobRole } = await createDeptAndRole();
    const payload = validPayload(department._id.toString(), jobRole._id.toString()) as Record<string, unknown>;
    delete payload[field];

    const { status, json } = await callSubmit(payload, employee._id.toString(), "Employee");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining([field]));
  });
});

describe("POST /transfer-requests — AC1/QT03: location not in the configured set", () => {
  it("responds 400 naming location, distinct from a 404", async () => {
    const { employee } = await createEmployeeWithManager();
    const { department, jobRole } = await createDeptAndRole();

    const { status, json } = await callSubmit(
      validPayload(department._id.toString(), jobRole._id.toString(), { location: "Not A Real Location" }),
      employee._id.toString(),
      "Employee",
    );
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["location"]));
  });
});

describe("POST /transfer-requests — 404 for a nonexistent departmentId/jobRoleId", () => {
  it("nonexistent departmentId responds 404 naming departmentId", async () => {
    const { employee } = await createEmployeeWithManager();
    const { jobRole } = await createDeptAndRole();

    const { status, json } = await callSubmit(
      validPayload(new Types.ObjectId().toString(), jobRole._id.toString()),
      employee._id.toString(),
      "Employee",
    );
    expect(status).toBe(404);
    expect(json.field).toBe("departmentId");
  });

  it("nonexistent jobRoleId (departmentId valid) responds 404 naming jobRoleId", async () => {
    const { employee } = await createEmployeeWithManager();
    const { department } = await createDeptAndRole();

    const { status, json } = await callSubmit(
      validPayload(department._id.toString(), new Types.ObjectId().toString()),
      employee._id.toString(),
      "Employee",
    );
    expect(status).toBe(404);
    expect(json.field).toBe("jobRoleId");
  });

  it("both departmentId and jobRoleId nonexistent names at least one invalid field (QT04)", async () => {
    const { employee } = await createEmployeeWithManager();

    const { status, json } = await callSubmit(
      validPayload(new Types.ObjectId().toString(), new Types.ObjectId().toString()),
      employee._id.toString(),
      "Employee",
    );
    expect(status).toBe(404);
    expect(["departmentId", "jobRoleId"]).toContain(json.field);
  });
});

describe("POST /transfer-requests — AC3/UT03/QT08: non-Employee blocked", () => {
  it.each(["Manager", "HR", "Payroll", "IT", "Facilities", "Admin"])("%s attempting to submit is 403", async (role) => {
    const { department, jobRole } = await createDeptAndRole();

    const { status, json } = await callSubmit(
      validPayload(department._id.toString(), jobRole._id.toString()),
      "some-user-id",
      role,
    );
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("POST /transfer-requests — authentication", () => {
  it("responds 401 with no bearer token", async () => {
    const { department, jobRole } = await createDeptAndRole();
    const { status } = await callSubmit(validPayload(department._id.toString(), jobRole._id.toString()), null, null);
    expect(status).toBe(401);
  });
});

describe("POST /transfer-requests — internal-transfer-workflow.T09: audit-trail integration", () => {
  it("appends an AuditLog entry with action 'submitted' on a successful submission", async () => {
    const { employee } = await createEmployeeWithManager();
    const { department, jobRole } = await createDeptAndRole();

    const { json } = await callSubmit(
      validPayload(department._id.toString(), jobRole._id.toString()),
      employee._id.toString(),
      "Employee",
    );

    const entries = await AuditLog.find({ transferRequestId: json.id });
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("submitted");
    expect(entries[0].actorId.toString()).toBe(employee._id.toString());
    expect(entries[0].actorRole).toBe("Employee");
  });

  it("does not append an entry when the submission is rejected (403), per transfer-audit-trail's QT02", async () => {
    const { department, jobRole } = await createDeptAndRole();
    await callSubmit(validPayload(department._id.toString(), jobRole._id.toString()), "some-user-id", "Manager");

    const entries = await AuditLog.find({});
    expect(entries).toHaveLength(0);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT02 (effectiveDate in the past) is an Open QA Question — not tested,
//   per Do-not #3.