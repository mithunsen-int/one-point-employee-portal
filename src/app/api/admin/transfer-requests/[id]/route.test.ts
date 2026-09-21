import { NextRequest } from "next/server";
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

function tokenFor(role: string, userId = "caller-1"): string {
  return signToken({ userId, role });
}

async function callDetail(id: string, callerRole: string | null) {
  const { GET } = await import("@/app/api/admin/transfer-requests/[id]/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/admin/transfer-requests/${id}`, { method: "GET", headers });
  const response = await GET(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

async function createTransferRequest() {
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
    reason: "Relocation",
    status: "Pending: HR",
    assignedManagerId: manager._id,
    submittedAt: new Date(),
  });
}

describe("GET /admin/transfer-requests/{id} — AC6/UT06/QT08: full detail + action history", () => {
  it("returns the full request field set — API01's submitted fields plus assignedManagerId, submittedAt, and actionHistory — not a partial projection", async () => {
    const transferRequest = await createTransferRequest();
    const hrUser = await User.create({
      username: "hr-approver",
      passwordHash: "hash",
      role: "HR",
      dateOfJoining: new Date(),
    });
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: hrUser._id,
      actorRole: "HR",
      action: "submitted",
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
    });

    const { status, json } = await callDetail(transferRequest._id.toString(), "Admin");

    expect(status).toBe(200);
    expect(json).toEqual({
      id: transferRequest._id.toString(),
      status: "Pending: HR",
      departmentId: transferRequest.departmentId.toString(),
      location: "Location A",
      jobRoleId: transferRequest.jobRoleId.toString(),
      effectiveDate: transferRequest.effectiveDate.toISOString(),
      reason: "Relocation",
      assignedManagerId: transferRequest.assignedManagerId.toString(),
      submittedAt: transferRequest.submittedAt.toISOString(),
      actionHistory: [
        {
          actor: "hr-approver",
          action: "submitted",
          timestamp: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
  });

  it("returns an empty actionHistory array, not an omitted field, when no audit entries exist yet", async () => {
    const transferRequest = await createTransferRequest();

    const { status, json } = await callDetail(transferRequest._id.toString(), "Admin");

    expect(status).toBe(200);
    expect(json.actionHistory).toEqual([]);
  });

  it("resolves the actor to a username, falling back to the raw actorId when no matching user exists", async () => {
    const transferRequest = await createTransferRequest();
    const { Types } = await import("mongoose");
    const orphanActorId = new Types.ObjectId();
    await AuditLog.create({
      transferRequestId: transferRequest._id,
      actorId: orphanActorId,
      actorRole: "HR",
      action: "hr_approved",
      timestamp: new Date("2026-01-02T00:00:00.000Z"),
    });

    const { json } = await callDetail(transferRequest._id.toString(), "Admin");

    expect(json.actionHistory).toEqual([
      {
        actor: orphanActorId.toString(),
        action: "hr_approved",
        timestamp: "2026-01-02T00:00:00.000Z",
      },
    ]);
  });
});

describe("GET /admin/transfer-requests/{id} — AC7/UT07/QT09: non-Admin blocked, no ownership exception", () => {
  it.each(["Employee", "Manager", "HR", "Payroll", "IT", "Facilities"])("%s is 403, even the request's own employee", async (role) => {
    const transferRequest = await createTransferRequest();

    const { status, json } = await callDetail(transferRequest._id.toString(), role);

    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /admin/transfer-requests/{id} — AC8/UT08/QT10: not found", () => {
  it("responds 404 for a well-formed id that doesn't exist", async () => {
    const { Types } = await import("mongoose");
    const missingId = new Types.ObjectId().toString();

    const { status, json } = await callDetail(missingId, "Admin");

    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });

  it("responds 404 for a syntactically malformed id", async () => {
    const { status, json } = await callDetail("not-a-valid-object-id", "Admin");

    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });
});

describe("GET /admin/transfer-requests/{id} — authentication", () => {
  it("responds 401 with no bearer token", async () => {
    const transferRequest = await createTransferRequest();
    const { status } = await callDetail(transferRequest._id.toString(), null);
    expect(status).toBe(401);
  });
});

// Not covered above, and deliberately not re-litigated here:
//
// - QT10's 404-vs-400 question for a malformed id is the same Open QA
//   Question already tracked in transfer-audit-trail.test_cases.md's QT06 —
//   this task's own prompt file explicitly defers to that existing answer
//   (404, via the project-wide Types.ObjectId.isValid() convention) rather
//   than re-opening it.
