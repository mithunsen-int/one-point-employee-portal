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

async function callList(callerRole: string | null) {
  const { GET } = await import("@/app/api/admin/transfer-requests/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest("http://localhost/api/admin/transfer-requests", { method: "GET", headers });
  const response = await GET(request);
  const json = await response.json();
  return { status: response.status, json };
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

describe("GET /admin/transfer-requests — AC4/UT04: Admin sees every request, unfiltered", () => {
  it("returns every request with id/status/employeeId/submittedAt", async () => {
    const requestA = await createTransferRequest("Pending: Manager");
    const requestB = await createTransferRequest("Completed");

    const { status, json } = await callList("Admin");
    expect(status).toBe(200);
    expect(json).toHaveLength(2);
    expect(json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: requestA._id.toString(),
          status: "Pending: Manager",
          employeeId: requestA.employeeId.toString(),
          submittedAt: expect.any(String),
        }),
        expect.objectContaining({ id: requestB._id.toString(), status: "Completed" }),
      ]),
    );
  });

  it("returns an empty array when no requests exist", async () => {
    const { status, json } = await callList("Admin");
    expect(status).toBe(200);
    expect(json).toEqual([]);
  });
});

describe("GET /admin/transfer-requests — AC5/UT05/QT07: non-Admin blocked", () => {
  it.each(["Employee", "Manager", "HR", "Payroll", "IT", "Facilities"])("%s is 403", async (role) => {
    const { status, json } = await callList(role);
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /admin/transfer-requests — authentication", () => {
  it("responds 401 with no bearer token", async () => {
    const { status } = await callList(null);
    expect(status).toBe(401);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT06 (behavior at scale — hundreds of requests, pagination) is an Open
//   QA Question — this task's own prompt file explicitly says not to invent
//   a page size/cursor scheme; the endpoint returns the full unfiltered
//   result set as the spec literally describes.