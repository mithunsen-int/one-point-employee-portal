import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { TransferRequest } from "@/services/workflow/TransferRequest";

beforeAll(async () => {
  await startTestDatabase();
  await TransferRequest.init();
}, 60000);

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
});

function validRequestData() {
  return {
    employeeId: new Types.ObjectId(),
    departmentId: new Types.ObjectId(),
    jobRoleId: new Types.ObjectId(),
    location: "Location A",
    effectiveDate: new Date("2026-06-01"),
    status: "Pending: Manager",
    assignedManagerId: new Types.ObjectId(),
    submittedAt: new Date(),
  };
}

describe("TransferRequest — creation (positive control)", () => {
  it("creates a valid request successfully", async () => {
    const request = await TransferRequest.create(validRequestData());
    expect(request._id).toBeDefined();
  });
});

describe("TransferRequest — required fields (plan Data Model)", () => {
  it.each(["employeeId", "departmentId", "jobRoleId", "location", "effectiveDate", "status", "assignedManagerId", "submittedAt"])(
    "requires %s",
    async (field) => {
      const data = validRequestData() as Record<string, unknown>;
      delete data[field];
      const doc = new TransferRequest(data);
      await expect(doc.validate()).rejects.toThrow();
    },
  );

  it("does not require reason, managerDecisionReason, hrDecisionReason, or newManagerId (optional fields)", async () => {
    const doc = new TransferRequest(validRequestData());
    await expect(doc.validate()).resolves.toBeUndefined();
  });
});

describe("TransferRequest — status enum matches AC18's exact vocabulary", () => {
  it.each([
    "Pending: Manager",
    "Pending: HR",
    "Pending: Payroll, IT, Facilities",
    "Pending: Transfer",
    "Rejected",
    "Withdrawn",
    "Completed",
  ])("accepts status %s", async (status) => {
    const doc = new TransferRequest({ ...validRequestData(), status });
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it("rejects a status value outside the seven defined ones", async () => {
    const doc = new TransferRequest({ ...validRequestData(), status: "In Progress" });
    await expect(doc.validate()).rejects.toThrow();
  });
});

describe("TransferRequest — task-status enums (AC10-AC12, independently completable)", () => {
  it.each(["payrollTaskStatus", "itTaskStatus", "facilitiesTaskStatus"] as const)(
    "%s defaults to Pending on creation",
    async (field) => {
      const request = await TransferRequest.create(validRequestData());
      expect(request[field]).toBe("Pending");
    },
  );

  it.each(["payrollTaskStatus", "itTaskStatus", "facilitiesTaskStatus"] as const)(
    "%s accepts Completed",
    async (field) => {
      const doc = new TransferRequest({ ...validRequestData(), [field]: "Completed" });
      await expect(doc.validate()).resolves.toBeUndefined();
    },
  );

  it.each(["payrollTaskStatus", "itTaskStatus", "facilitiesTaskStatus"] as const)(
    "%s rejects a value outside Pending/Completed",
    async (field) => {
      const doc = new TransferRequest({ ...validRequestData(), [field]: "InProgress" });
      await expect(doc.validate()).rejects.toThrow();
    },
  );

  it("each of the three task statuses is independently settable, not linked to the others", async () => {
    const request = await TransferRequest.create({ ...validRequestData(), payrollTaskStatus: "Completed" });
    expect(request.payrollTaskStatus).toBe("Completed");
    expect(request.itTaskStatus).toBe("Pending");
    expect(request.facilitiesTaskStatus).toBe("Pending");
  });
});
