import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { AuditLog } from "@/services/audit/AuditLog";
import { recordTransitionAudit } from "@/services/workflow/recordTransitionAudit";

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

describe("recordTransitionAudit", () => {
  it("appends an AuditLog entry recording the actor, action, and a server-set timestamp", async () => {
    const transferRequestId = new Types.ObjectId();
    const actorId = new Types.ObjectId().toString();
    const before = Date.now();

    await recordTransitionAudit(transferRequestId, { id: actorId, role: "Employee" }, "submitted");

    const entries = await AuditLog.find({ transferRequestId });
    expect(entries).toHaveLength(1);
    expect(entries[0].actorId.toString()).toBe(actorId);
    expect(entries[0].actorRole).toBe("Employee");
    expect(entries[0].action).toBe("submitted");
    expect(entries[0].timestamp.getTime()).toBeGreaterThanOrEqual(before);
  });
});
