import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { AuditLog } from "@/services/audit/AuditLog";

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

function entryData() {
  return {
    transferRequestId: new Types.ObjectId(),
    actorId: new Types.ObjectId(),
    actorRole: "Employee",
    action: "submitted",
    timestamp: new Date(),
  };
}

// Positive control — confirms the append-only guards (below) don't
// accidentally block the one operation that must keep working.
describe("AuditLog — append still works (baseline, not itself an AC)", () => {
  it("creates a new entry successfully", async () => {
    const entry = await AuditLog.create(entryData());
    expect(entry._id).toBeDefined();
  });
});

describe("AuditLog — required fields (plan Data Model)", () => {
  it("requires transferRequestId, actorId, actorRole, action, and timestamp", async () => {
    const doc = new AuditLog({});
    await expect(doc.validate()).rejects.toThrow();
  });
});

describe("AuditLog — append-only (transfer-audit-trail.AC2/UT03/QT03)", () => {
  it("throws on Model.findOneAndUpdate", async () => {
    const entry = await AuditLog.create(entryData());
    await expect(
      AuditLog.findOneAndUpdate({ _id: entry._id }, { action: "tampered" }),
    ).rejects.toThrow();
  });

  it("throws on Model.findOneAndDelete", async () => {
    const entry = await AuditLog.create(entryData());
    await expect(AuditLog.findOneAndDelete({ _id: entry._id })).rejects.toThrow();
  });

  it("throws on Model.deleteOne (query-style)", async () => {
    const entry = await AuditLog.create(entryData());
    await expect(AuditLog.deleteOne({ _id: entry._id })).rejects.toThrow();
  });

  it("throws on Model.deleteMany", async () => {
    await AuditLog.create(entryData());
    await expect(AuditLog.deleteMany({})).rejects.toThrow();
  });

  it("throws on a fetched document's own .deleteOne() (document-style)", async () => {
    const entry = await AuditLog.create(entryData());
    const fetched = await AuditLog.findById(entry._id);
    await expect(fetched!.deleteOne()).rejects.toThrow();
  });

  it("the blocked entry is still present afterward — a rejected mutation attempt leaves no trace of success", async () => {
    const entry = await AuditLog.create(entryData());
    await expect(AuditLog.deleteOne({ _id: entry._id })).rejects.toThrow();

    const stillThere = await AuditLog.findById(entry._id);
    expect(stillThere).not.toBeNull();
  });
});
