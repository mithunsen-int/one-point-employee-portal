import { NextRequest } from "next/server";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { User } from "@/services/users/User";
import { Department } from "@/services/org-structure/Department";
import { JobRole } from "@/services/org-structure/JobRole";
import { TransferRequest, TransferRequestStatus } from "@/services/workflow/TransferRequest";
import { Types } from "mongoose";

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

function tokenFor(role: string, userId: string): string {
  return signToken({ userId, role });
}

async function callMine(role: string, userId: string) {
  const { GET } = await import("@/app/api/transfer-requests/mine/route");
  const headers = new Headers();
  headers.set("authorization", `Bearer ${tokenFor(role, userId)}`);
  const request = new NextRequest("http://localhost/api/transfer-requests/mine", { method: "GET", headers });
  const response = await GET(request);
  const json = await response.json();
  return { status: response.status, json };
}

async function createRequest(overrides: {
  employeeId: string;
  assignedManagerId: string;
  status: TransferRequestStatus;
  payrollTaskStatus?: "Pending" | "Completed";
  itTaskStatus?: "Pending" | "Completed";
  facilitiesTaskStatus?: "Pending" | "Completed";
}) {
  const department = await Department.create({ name: `Dept-${Date.now()}-${Math.random()}` });
  const jobRole = await JobRole.create({ title: `Role-${Date.now()}-${Math.random()}` });

  return TransferRequest.create({
    employeeId: overrides.employeeId,
    departmentId: department._id,
    jobRoleId: jobRole._id,
    location: "Location A",
    effectiveDate: new Date("2026-06-01"),
    status: overrides.status,
    assignedManagerId: overrides.assignedManagerId,
    payrollTaskStatus: overrides.payrollTaskStatus,
    itTaskStatus: overrides.itTaskStatus,
    facilitiesTaskStatus: overrides.facilitiesTaskStatus,
    submittedAt: new Date(),
  });
}

describe("GET /transfer-requests/mine — AC20/UT20: Employee sees every request they submitted", () => {
  it("returns both a Completed and a Pending: Manager request belonging to the caller", async () => {
    const employeeId = new Types.ObjectId().toString();
    const otherEmployeeId = new Types.ObjectId().toString();
    const managerId = new Types.ObjectId().toString();
    const requestA = await createRequest({ employeeId, assignedManagerId: managerId, status: "Completed" });
    const requestB = await createRequest({ employeeId, assignedManagerId: managerId, status: "Pending: Manager" });
    await createRequest({ employeeId: otherEmployeeId, assignedManagerId: managerId, status: "Pending: Manager" });

    const { status, json } = await callMine("Employee", employeeId);

    expect(status).toBe(200);
    expect(json.map((r: { id: string }) => r.id).sort()).toEqual(
      [requestA._id.toString(), requestB._id.toString()].sort(),
    );
  });
});

describe("GET /transfer-requests/mine — AC21/UT21: Manager sees only their own assigned, Pending: Manager requests", () => {
  it("returns only the request assigned to the calling Manager", async () => {
    const managerId = new Types.ObjectId().toString();
    const otherManagerId = new Types.ObjectId().toString();
    const assigned = await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: Manager",
    });
    await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: otherManagerId,
      status: "Pending: Manager",
    });

    const { status, json } = await callMine("Manager", managerId);

    expect(status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe(assigned._id.toString());
  });

  it("excludes a request assigned to the caller that isn't Pending: Manager", async () => {
    const managerId = new Types.ObjectId().toString();
    await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: HR",
    });

    const { json } = await callMine("Manager", managerId);

    expect(json).toEqual([]);
  });
});

describe("GET /transfer-requests/mine — AC22/UT22: HR sees Pending: HR plus Pending: Transfer requests ready for mapping", () => {
  it("returns a Pending: HR request and a Pending: Transfer request, excluding one still Pending: Payroll, IT, Facilities (amended 2026-09-20 for AC25)", async () => {
    const managerId = new Types.ObjectId().toString();
    const pendingHr = await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: HR",
    });
    const readyForMapping = await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: Transfer",
      payrollTaskStatus: "Completed",
      itTaskStatus: "Completed",
      facilitiesTaskStatus: "Completed",
    });
    await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: Payroll, IT, Facilities",
      payrollTaskStatus: "Completed",
      itTaskStatus: "Pending",
      facilitiesTaskStatus: "Completed",
    });

    const { status, json } = await callMine("HR", new Types.ObjectId().toString());

    expect(status).toBe(200);
    expect(json.map((r: { id: string }) => r.id).sort()).toEqual(
      [pendingHr._id.toString(), readyForMapping._id.toString()].sort(),
    );
  });
});

describe("GET /transfer-requests/mine — AC23/UT23: Payroll/IT/Facilities see only requests where their own task is still Pending", () => {
  it("Payroll sees only the request whose payrollTaskStatus is Pending", async () => {
    const managerId = new Types.ObjectId().toString();
    const pending = await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: Payroll, IT, Facilities",
      payrollTaskStatus: "Pending",
      itTaskStatus: "Pending",
      facilitiesTaskStatus: "Pending",
    });
    await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: Payroll, IT, Facilities",
      payrollTaskStatus: "Completed",
      itTaskStatus: "Pending",
      facilitiesTaskStatus: "Pending",
    });

    const { status, json } = await callMine("Payroll", new Types.ObjectId().toString());

    expect(status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe(pending._id.toString());
  });

  it("IT sees only the request whose itTaskStatus is Pending", async () => {
    const managerId = new Types.ObjectId().toString();
    const pending = await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: Payroll, IT, Facilities",
      payrollTaskStatus: "Completed",
      itTaskStatus: "Pending",
      facilitiesTaskStatus: "Completed",
    });

    const { json } = await callMine("IT", new Types.ObjectId().toString());

    expect(json).toHaveLength(1);
    expect(json[0].id).toBe(pending._id.toString());
  });

  it("Facilities sees only the request whose facilitiesTaskStatus is Pending", async () => {
    const managerId = new Types.ObjectId().toString();
    const pending = await createRequest({
      employeeId: new Types.ObjectId().toString(),
      assignedManagerId: managerId,
      status: "Pending: Payroll, IT, Facilities",
      payrollTaskStatus: "Completed",
      itTaskStatus: "Completed",
      facilitiesTaskStatus: "Pending",
    });

    const { json } = await callMine("Facilities", new Types.ObjectId().toString());

    expect(json).toHaveLength(1);
    expect(json[0].id).toBe(pending._id.toString());
  });
});

describe("GET /transfer-requests/mine — AC24/UT24: Admin rejected", () => {
  it("responds 403 for Admin", async () => {
    const { status, json } = await callMine("Admin", new Types.ObjectId().toString());
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /transfer-requests/mine — authentication", () => {
  it("responds 401 with no bearer token", async () => {
    const { GET } = await import("@/app/api/transfer-requests/mine/route");
    const request = new NextRequest("http://localhost/api/transfer-requests/mine", { method: "GET" });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
