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
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

async function createRequest(daysSinceJoining: number, status: TransferRequestStatus = "Pending: HR") {
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
    dateOfJoining: new Date(Date.now() - daysSinceJoining * MS_PER_DAY),
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
  const { POST } = await import("@/app/api/transfer-requests/[id]/hr-decision/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerUserId !== null && callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerUserId, callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/transfer-requests/${id}/hr-decision`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const response = await POST(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST .../hr-decision — AC7/UT07: HR approves an eligible request", () => {
  it("at exactly 90 days (inclusive boundary, QT11) moves to Pending: Payroll, IT, Facilities and initializes all 3 task statuses", async () => {
    const { transferRequest } = await createRequest(90);
    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "approve" },
      new Types.ObjectId().toString(),
      "HR",
    );
    expect(status).toBe(200);
    expect(json).toEqual({ id: transferRequest._id.toString(), status: "Pending: Payroll, IT, Facilities" });

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.status).toBe("Pending: Payroll, IT, Facilities");
    expect(updated?.payrollTaskStatus).toBe("Pending");
    expect(updated?.itTaskStatus).toBe("Pending");
    expect(updated?.facilitiesTaskStatus).toBe("Pending");
  });
});

describe("POST .../hr-decision — AC7/QT12: not yet eligible", () => {
  it("at 89 days responds 409, status unchanged", async () => {
    const { transferRequest } = await createRequest(89);
    const { status } = await callDecision(transferRequest._id.toString(), { decision: "approve" }, "hr-user", "HR");
    expect(status).toBe(409);

    const unchanged = await TransferRequest.findById(transferRequest._id);
    expect(unchanged?.status).toBe("Pending: HR");
  });
});

describe("POST .../hr-decision — AC8/UT08: HR rejects with a reason", () => {
  it("moves status to Rejected, stores the reason, responds 200", async () => {
    const { transferRequest } = await createRequest(90);
    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "reject", reason: "Not eligible for other reasons" },
      new Types.ObjectId().toString(),
      "HR",
    );
    expect(status).toBe(200);
    expect(json).toEqual({ id: transferRequest._id.toString(), status: "Rejected" });

    const updated = await TransferRequest.findById(transferRequest._id);
    expect(updated?.hrDecisionReason).toBe("Not eligible for other reasons");
  });

  it("rejection is not blocked by the 90-day eligibility rule — only approval requires it (AC7 vs AC8)", async () => {
    const { transferRequest } = await createRequest(10);
    const { status } = await callDecision(
      transferRequest._id.toString(),
      { decision: "reject", reason: "Business reasons" },
      new Types.ObjectId().toString(),
      "HR",
    );
    expect(status).toBe(200);
  });
});

describe("POST .../hr-decision — AC8/QT13: reject requires a reason", () => {
  it("missing reason responds 400", async () => {
    const { transferRequest } = await createRequest(90);
    const { status, json } = await callDecision(transferRequest._id.toString(), { decision: "reject" }, "hr-user", "HR");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["reason"]));
  });

  it("empty-string reason responds 400", async () => {
    const { transferRequest } = await createRequest(90);
    const { status, json } = await callDecision(
      transferRequest._id.toString(),
      { decision: "reject", reason: "" },
      "hr-user",
      "HR",
    );
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["reason"]));
  });
});

describe("POST .../hr-decision — 403: non-HR blocked", () => {
  it.each(["Employee", "Manager", "Payroll", "IT", "Facilities", "Admin"])("%s is 403", async (role) => {
    const { transferRequest } = await createRequest(90);
    const { status, json } = await callDecision(transferRequest._id.toString(), { decision: "approve" }, "some-user", role);
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("POST .../hr-decision — 409: request not in Pending: HR", () => {
  it.each([
    "Pending: Manager",
    "Pending: Payroll, IT, Facilities",
    "Rejected",
    "Withdrawn",
    "Completed",
  ] as TransferRequestStatus[])("responds 409 when status is %s", async (status) => {
    const { transferRequest } = await createRequest(90, status);
    const { status: httpStatus } = await callDecision(transferRequest._id.toString(), { decision: "approve" }, "hr-user", "HR");
    expect(httpStatus).toBe(409);
  });
});

describe("POST .../hr-decision — validation and not-found/authentication", () => {
  it("an invalid decision value responds 400", async () => {
    const { transferRequest } = await createRequest(90);
    const { status, json } = await callDecision(transferRequest._id.toString(), { decision: "maybe" }, "hr-user", "HR");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["decision"]));
  });

  it("a non-existent request id responds 404", async () => {
    const { status } = await callDecision(new Types.ObjectId().toString(), { decision: "approve" }, "hr-user", "HR");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const { transferRequest } = await createRequest(90);
    const { status } = await callDecision(transferRequest._id.toString(), { decision: "approve" }, null, null);
    expect(status).toBe(401);
  });
});

describe("POST .../hr-decision — internal-transfer-workflow.T09: audit-trail integration", () => {
  it("appends an entry with action 'hr_approved' on approve", async () => {
    const { transferRequest } = await createRequest(90);
    const hrUserId = new Types.ObjectId().toString();
    await callDecision(transferRequest._id.toString(), { decision: "approve" }, hrUserId, "HR");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("hr_approved");
    expect(entries[0].actorId.toString()).toBe(hrUserId);
  });

  it("appends an entry with action 'hr_rejected' on reject", async () => {
    const { transferRequest } = await createRequest(90);
    await callDecision(
      transferRequest._id.toString(),
      { decision: "reject", reason: "Business reasons" },
      new Types.ObjectId().toString(),
      "HR",
    );

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("hr_rejected");
  });

  it("does not append an entry when approval is blocked by ineligibility (409)", async () => {
    const { transferRequest } = await createRequest(89);
    await callDecision(transferRequest._id.toString(), { decision: "approve" }, new Types.ObjectId().toString(), "HR");

    const entries = await AuditLog.find({ transferRequestId: transferRequest._id });
    expect(entries).toHaveLength(0);
  });
});