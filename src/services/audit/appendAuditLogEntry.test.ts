import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { AuditLog } from "@/services/audit/AuditLog";
import { appendAuditLogEntry } from "@/services/audit/appendAuditLogEntry";

beforeAll(async () => {
  await startTestDatabase();
  await AuditLog.init();
}, 60000);

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
});

describe("appendAuditLogEntry (transfer-audit-trail.AC1)", () => {
  it("creates an entry recording the actor, the action, and a server-set timestamp (UT01)", async () => {
    const transferRequestId = new Types.ObjectId();
    const actorId = new Types.ObjectId();
    const before = Date.now();

    await appendAuditLogEntry(transferRequestId, { id: actorId, role: "Employee" }, "submitted");

    const entries = await AuditLog.find({ transferRequestId });
    expect(entries).toHaveLength(1);
    expect(entries[0].actorId.toString()).toBe(actorId.toString());
    expect(entries[0].actorRole).toBe("Employee");
    expect(entries[0].action).toBe("submitted");
    expect(entries[0].timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(entries[0].timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("records the actor's role exactly as given — snapshotted, not re-derived (plan Data Model decision)", async () => {
    const transferRequestId = new Types.ObjectId();
    await appendAuditLogEntry(transferRequestId, { id: new Types.ObjectId(), role: "Manager" }, "manager_approved");

    const [entry] = await AuditLog.find({ transferRequestId });
    expect(entry.actorRole).toBe("Manager");
  });

  it("each call appends a new, independent entry rather than overwriting a prior one", async () => {
    const transferRequestId = new Types.ObjectId();
    const actorId = new Types.ObjectId();

    await appendAuditLogEntry(transferRequestId, { id: actorId, role: "Employee" }, "submitted");
    await appendAuditLogEntry(transferRequestId, { id: actorId, role: "Employee" }, "withdrawn");

    const entries = await AuditLog.find({ transferRequestId }).sort({ timestamp: 1 });
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.action)).toEqual(["submitted", "withdrawn"]);
  });

  it("does not accept a caller-supplied timestamp — the function signature has no such parameter", () => {
    // Structural check, not a runtime one: appendAuditLogEntry's own type
    // signature (transferRequestId, actor, action) has no timestamp
    // parameter at all, so a caller cannot supply one even if it wanted to —
    // this is what "server-set, not client-supplied" (AC1) means at the
    // function-signature level, distinct from the previous test's runtime
    // confirmation that a real Date is actually written.
    expect(appendAuditLogEntry.length).toBe(3);
  });
});

// Not covered by this task, and deliberately not written as concrete
// assertions:
//
// - QT01 (all ten transition types, one correctly-labeled entry each) and
//   QT02 (a failed/rejected action produces no entry) both depend on
//   internal-transfer-workflow.T09's own call-site logic — which action
//   string to pass, and whether to call this function at all — not on
//   anything this generic append function itself decides. This task's own
//   prompt file explicitly excludes that call-site logic from its scope.