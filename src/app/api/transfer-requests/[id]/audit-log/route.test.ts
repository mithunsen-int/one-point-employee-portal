import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { AuditLog } from "@/services/audit/AuditLog";
import { User } from "@/services/users/User";

// `findTransferRequestById` doesn't exist as a real datastore-backed function
// yet — internal-transfer-workflow.T01 (the TransferRequests schema) hasn't
// been built. Mocked here via a path relative to this file (not the `@/`
// alias) with `virtual: true`, the same workaround already established for
// rbac-api-security.T02's userLookup mock — moduleNameMapper tries to resolve
// `@/...` specifiers before honoring `virtual: true`, which throws for a
// module that doesn't exist yet.
jest.mock(
  "../../../../../services/audit/transferRequestLookup",
  () => ({
    __esModule: true,
    findTransferRequestById: jest.fn(),
  }),
  { virtual: true },
);

const ORIGINAL_ENV = process.env;

beforeAll(async () => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
  await startTestDatabase();
  await AuditLog.init();
  await User.init();
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

async function mockTransferRequest(result: { id: string; employeeId: string } | null) {
  const { findTransferRequestById } = await import(
    "../../../../../services/audit/transferRequestLookup"
  );
  (findTransferRequestById as jest.Mock).mockResolvedValue(result);
}

async function callAuditLog(id: string, callerUserId: string | null, callerRole: string | null) {
  const { GET } = await import("@/app/api/transfer-requests/[id]/audit-log/route");
  const headers = new Headers();
  if (callerUserId !== null && callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerUserId, callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/transfer-requests/${id}/audit-log`, { method: "GET", headers });
  const response = await GET(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("GET /transfer-requests/{id}/audit-log — AC3/UT04: requesting Employee reads their own log", () => {
  it("returns all entries for that request", async () => {
    const requestId = new Types.ObjectId().toString();
    await mockTransferRequest({ id: requestId, employeeId: "employee-1" });
    await AuditLog.create({
      transferRequestId: requestId,
      actorId: new Types.ObjectId(),
      actorRole: "Employee",
      action: "submitted",
      timestamp: new Date(),
    });

    const { status, json } = await callAuditLog(requestId, "employee-1", "Employee");
    expect(status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0]).toEqual(
      expect.objectContaining({ actor: expect.any(String), action: "submitted", timestamp: expect.any(String) }),
    );
  });
});

describe("GET /transfer-requests/{id}/audit-log — actor field resolves to a username", () => {
  it("resolves actorId to the actor's username, not a raw id", async () => {
    const requestId = new Types.ObjectId().toString();
    await mockTransferRequest({ id: requestId, employeeId: "employee-1" });
    const actor = await User.create({
      username: "jane.doe",
      passwordHash: "hash",
      role: "Manager",
      dateOfJoining: new Date(),
    });
    await AuditLog.create({
      transferRequestId: requestId,
      actorId: actor._id,
      actorRole: "Manager",
      action: "manager_approved",
      timestamp: new Date(),
    });

    const { json } = await callAuditLog(requestId, "employee-1", "Employee");
    expect(json[0].actor).toBe("jane.doe");
  });

  it("falls back to the raw actorId if no matching User record exists (data-integrity edge case)", async () => {
    const requestId = new Types.ObjectId().toString();
    await mockTransferRequest({ id: requestId, employeeId: "employee-1" });
    const orphanActorId = new Types.ObjectId();
    await AuditLog.create({
      transferRequestId: requestId,
      actorId: orphanActorId,
      actorRole: "Employee",
      action: "submitted",
      timestamp: new Date(),
    });

    const { json } = await callAuditLog(requestId, "employee-1", "Employee");
    expect(json[0].actor).toBe(orphanActorId.toString());
  });

  it("still resolves a username even if the actor's User record has since been soft-deleted (audit history is not reinterpreted)", async () => {
    const requestId = new Types.ObjectId().toString();
    await mockTransferRequest({ id: requestId, employeeId: "employee-1" });
    const actor = await User.create({
      username: "left.the.company",
      passwordHash: "hash",
      role: "HR",
      dateOfJoining: new Date(),
      deletedAt: new Date(),
    });
    await AuditLog.create({
      transferRequestId: requestId,
      actorId: actor._id,
      actorRole: "HR",
      action: "hr_approved",
      timestamp: new Date(),
    });

    const { json } = await callAuditLog(requestId, "employee-1", "Employee");
    expect(json[0].actor).toBe("left.the.company");
  });
});

describe("GET /transfer-requests/{id}/audit-log — AC4/UT05: Admin reads any request's log", () => {
  it("returns all entries for a request that isn't the Admin's own", async () => {
    const requestId = new Types.ObjectId().toString();
    await mockTransferRequest({ id: requestId, employeeId: "employee-1" });
    await AuditLog.create({
      transferRequestId: requestId,
      actorId: new Types.ObjectId(),
      actorRole: "Employee",
      action: "submitted",
      timestamp: new Date(),
    });

    const { status, json } = await callAuditLog(requestId, "admin-1", "Admin");
    expect(status).toBe(200);
    expect(json).toHaveLength(1);
  });
});

describe("GET /transfer-requests/{id}/audit-log — AC5/UT06/QT04/QT05: blocked for anyone else", () => {
  it("a different Employee (not the requester) is 403 (UT06)", async () => {
    const requestId = new Types.ObjectId().toString();
    await mockTransferRequest({ id: requestId, employeeId: "employee-1" });

    const { status, json } = await callAuditLog(requestId, "employee-2", "Employee");
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it.each(["Manager", "HR", "Payroll", "IT", "Facilities"])("%s is 403, even if they acted on the request (QT04/QT05)", async (role) => {
    const requestId = new Types.ObjectId().toString();
    await mockTransferRequest({ id: requestId, employeeId: "employee-1" });

    const { status } = await callAuditLog(requestId, "actor-1", role);
    expect(status).toBe(403);
  });
});

describe("GET /transfer-requests/{id}/audit-log — AC6/UT07/QT06: not found", () => {
  it("a non-existent request id responds 404 (UT07)", async () => {
    const requestId = new Types.ObjectId().toString();
    await mockTransferRequest(null);

    const { status, json } = await callAuditLog(requestId, "admin-1", "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });

  it("a syntactically malformed id responds 404, consistent with every other [id] route in this project (QT06)", async () => {
    const { status, json } = await callAuditLog("not-a-valid-object-id", "admin-1", "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });
});

describe("GET /transfer-requests/{id}/audit-log — authentication", () => {
  it("responds 401 with no bearer token", async () => {
    const requestId = new Types.ObjectId().toString();
    const { status } = await callAuditLog(requestId, null, null);
    expect(status).toBe(401);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT07 (whether entries are returned in chronological order) is an Open QA
//   Question — this task's own prompt file explicitly says not to invent a
//   sort order not stated anywhere, so no test asserts one.