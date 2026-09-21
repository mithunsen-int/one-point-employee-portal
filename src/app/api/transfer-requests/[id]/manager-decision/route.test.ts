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

async function callDecision(id: string, body: unknown, callerUserId: string | null, callerRole: string | null) {
  const { POST } = await import("@/app/api/transfer-requests/[id]/manager-decision/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerUserId !== null && callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerUserId, callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/transfer-requests/${id}/manager-decision`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const response = await POST(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST .../manager-decision — AC4/UT04: assigned Manager approves", () => {
  it("moves status to Pending: HR and responds 200", async () => {
    const { transferRequest, manager } = await createRequest();
    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "approve" },
      manager._id.toString(),
      "Manager",
    );
    expect(status).toBe(200);
    expect(json).toEqual({ id: transferRequest._id.toString(), status: "Pending: HR" });

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.status).toBe("Pending: HR");
  });
});

describe("POST .../manager-decision — AC5/UT05: assigned Manager rejects with a reason", () => {
  it("moves status to Rejected, stores the reason, responds 200", async () => {
    const { transferRequest, manager } = await createRequest();
    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "reject", reason: "Not a good fit at this time" },
      manager._id.toString(),
      "Manager",
    );
    expect(status).toBe(200);
    expect(json).toEqual({ id: transferRequest._id.toString(), status: "Rejected" });

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.status).toBe("Rejected");
    expect(updated?.managerDecisionReason).toBe("Not a good fit at this time");
  });
});

describe("POST .../manager-decision — AC6/UT06/QT10: reject requires a reason", () => {
  it("missing reason responds 400", async () => {
    const { transferRequest, manager } = await createRequest();
    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "reject" },
      manager._id.toString(),
      "Manager",
    );
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["reason"]));
  });

  it("empty-string reason responds 400, same as missing (QT10)", async () => {
    const { transferRequest, manager } = await createRequest();
    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "reject", reason: "" },
      manager._id.toString(),
      "Manager",
    );
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["reason"]));
  });
});

describe("POST .../manager-decision — 403: only the assigned Manager, not just any Manager", () => {
  it("a different Manager (not assignedManagerId) is 403 — QT09 resolved 2026-09-19", async () => {
    const { transferRequest } = await createRequest();
    const otherManager = await User.create({
      username: `other-manager-${Date.now()}`,
      passwordHash: "hash",
      role: "Manager",
      dateOfJoining: new Date(),
    });

    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "approve" },
      otherManager._id.toString(),
      "Manager",
    );
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("a non-Manager role is 403", async () => {
    const { transferRequest } = await createRequest();
    const { status } = await callDecision(transferRequest._id.toString(), { decision: "approve" }, "some-user", "Employee");
    expect(status).toBe(403);
  });
});

describe("POST .../manager-decision — 409: request not in Pending: Manager (AC9)", () => {
  it.each([
    "Pending: HR",
    "Pending: Payroll, IT, Facilities",
    "Rejected",
    "Withdrawn",
    "Completed",
  ] as TransferRequestStatus[])("responds 409 when status is %s", async (status) => {
    const { transferRequest, manager } = await createRequest(status);
    const { status: httpStatus } = await callDecision(
      transferRequest._id.toString(),
      { decision: "approve" },
      manager._id.toString(),
      "Manager",
    );
    expect(httpStatus).toBe(409);
  });
});

describe("POST .../manager-decision — validation and not-found/authentication", () => {
  it("an invalid decision value responds 400", async () => {
    const { transferRequest, manager } = await createRequest();
    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "maybe" },
      manager._id.toString(),
      "Manager",
    );
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["decision"]));
  });

  it("a non-existent request id responds 404", async () => {
    const { status } = await callDecision(new Types.ObjectId().toString(), { decision: "approve" }, "some-user", "Manager");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const { transferRequest } = await createRequest();
    const { status } = await callDecision(transferRequest._id.toString(), { decision: "approve" }, null, null);
    expect(status).toBe(401);
  });
});

describe("POST .../manager-decision — internal-transfer-workflow.T09: audit-trail integration", () => {
  it("appends an entry with action 'manager_approved' on approve", async () => {
    const { transferRequest, manager } = await createRequest();
    await callDecision(transferRequest._id.toString(), { decision: "approve" }, manager._id.toString(), "Manager");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("manager_approved");
    expect(entries[0].actorId.toString()).toBe(manager._id.toString());
  });

  it("appends an entry with action 'manager_rejected' on reject", async () => {
    const { transferRequest, manager } = await createRequest();
    await callDecision(
      transferRequest._id.toString(),
      { decision: "reject", reason: "Not a good fit" },
      manager._id.toString(),
      "Manager",
    );

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("manager_rejected");
  });

  it("does not append an entry when the decision is rejected (409, wrong status)", async () => {
    const { transferRequest, manager } = await createRequest("Pending: HR");
    await callDecision(transferRequest._id.toString(), { decision: "approve" }, manager._id.toString(), "Manager");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(0);
  });
});

