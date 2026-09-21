import { NextRequest } from "next/server";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { User } from "@/services/users/User";
import { Department } from "@/services/org-structure/Department";
import { JobRole } from "@/services/org-structure/JobRole";
import { TransferRequest, TransferRequestStatus } from "@/services/workflow/TransferRequest";

const ORIGINAL_ENV = process.env;

beforeAll(async () => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
  await startTestDatabase();
  await User.init();
  await Department.init();
  await JobRole.init();
  await TransferRequest.init();
}, 60000);

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
  process.env = ORIGINAL_ENV;
});

function tokenFor(role: string): string {
  return signToken({ userId: "caller-1", role });
}

async function callDashboard(callerRole: string | null) {
  const { GET } = await import("@/app/api/admin/dashboard/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest("http://localhost/api/admin/dashboard", { method: "GET", headers });
  const response = await GET(request);
  const json = await response.json();
  return { status: response.status, json };
}

async function createUsers(role: string, count: number, overrides: Record<string, unknown> = {}) {
  const needsManager = role === "Employee" && overrides.managerId === undefined;
  const managerId = needsManager
    ? (
        await User.create({
          username: `auto-manager-${Date.now()}-${Math.random()}`,
          passwordHash: "hash",
          role: "Manager",
          dateOfJoining: new Date(),
        })
      )._id
    : undefined;

  for (let i = 0; i < count; i++) {
    await User.create({
      username: `${role}-${Date.now()}-${Math.random()}-${i}`,
      passwordHash: "hash",
      role,
      dateOfJoining: new Date(),
      ...(managerId ? { managerId } : {}),
      ...overrides,
    });
  }
}

async function createTransferRequest(status: TransferRequestStatus) {
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

  return TransferRequest.create({
    employeeId: employee._id,
    departmentId: department._id,
    jobRoleId: jobRole._id,
    location: "Location A",
    effectiveDate: new Date("2026-06-01"),
    status,
    assignedManagerId: manager._id,
    submittedAt: new Date(),
  });
}

describe("GET /admin/dashboard — AC1/UT01/QT01/QT02: userCounts", () => {
  it("returns counts matching registered users across all 6 roles, zero-count roles still present (QT01)", async () => {
    // One shared Manager for the Employees' required managerId, plus one more
    // standalone Manager — total Manager count is 2, not inflated by an
    // auto-created manager per Employee.
    const sharedManager = await User.create({
      username: `shared-manager-${Date.now()}`,
      passwordHash: "hash",
      role: "Manager",
      dateOfJoining: new Date(),
    });
    await createUsers("Employee", 3, { managerId: sharedManager._id });
    await createUsers("HR", 1);
    await createUsers("Manager", 1);
    // Payroll, IT, Facilities: zero registered

    const { status, json } = await callDashboard("Admin");
    expect(status).toBe(200);
    expect(json.userCounts).toEqual({
      Employee: 3,
      HR: 1,
      Manager: 2,
      Payroll: 0,
      IT: 0,
      Facilities: 0,
    });
  });

  it("excludes the Admin account and soft-deleted users from userCounts (QT02)", async () => {
    await createUsers("Admin", 1);
    await createUsers("Employee", 1);
    await createUsers("Employee", 1, { deletedAt: new Date() });

    const { json } = await callDashboard("Admin");
    expect(json.userCounts.Employee).toBe(1);
    expect(Object.keys(json.userCounts)).not.toContain("Admin");
  });
});

describe("GET /admin/dashboard — AC2/UT02/QT03/QT04: totalTransferRequests and statusBreakdown", () => {
  it("totals and per-status breakdown match, zero-count statuses still present (QT03)", async () => {
    await createTransferRequest("Pending: Manager");
    await createTransferRequest("Pending: Manager");
    await createTransferRequest("Completed");
    // No Withdrawn requests

    const { status, json } = await callDashboard("Admin");
    expect(status).toBe(200);
    expect(json.statusBreakdown["Pending: Manager"]).toBe(2);
    expect(json.statusBreakdown["Completed"]).toBe(1);
    expect(json.statusBreakdown["Withdrawn"]).toBe(0);
    expect(json.totalTransferRequests).toBe(3);
  });

  it("total includes terminal statuses (Rejected/Withdrawn/Completed), not just in-flight ones (QT04)", async () => {
    await createTransferRequest("Rejected");
    await createTransferRequest("Withdrawn");
    await createTransferRequest("Completed");
    await createTransferRequest("Pending: HR");

    const { json } = await callDashboard("Admin");
    expect(json.totalTransferRequests).toBe(4);
  });
});

describe("GET /admin/dashboard — AC3/UT03/QT05: non-Admin blocked", () => {
  it.each(["Employee", "Manager", "HR", "Payroll", "IT", "Facilities"])("%s is 403", async (role) => {
    const { status, json } = await callDashboard(role);
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /admin/dashboard — authentication", () => {
  it("responds 401 with no bearer token", async () => {
    const { status } = await callDashboard(null);
    expect(status).toBe(401);
  });
});