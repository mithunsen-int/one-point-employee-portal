import { Types } from "mongoose";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { User } from "@/services/users/User";
import { Department } from "@/services/org-structure/Department";
import { JobRole } from "@/services/org-structure/JobRole";
import { TransferRequest } from "@/services/workflow/TransferRequest";
import { findTransferRequestById } from "@/services/audit/transferRequestLookup";

beforeAll(async () => {
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
});

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
    status: "Pending: Manager",
    assignedManagerId: manager._id,
    submittedAt: new Date(),
  });
}

describe("findTransferRequestById — transfer-audit-trail.AC3-AC6 support: real TransferRequests lookup, no longer stubbed", () => {
  it("returns id and employeeId for an existing transfer request", async () => {
    const transferRequest = await createTransferRequest();

    const result = await findTransferRequestById(transferRequest._id.toString());

    expect(result).toEqual({
      id: transferRequest._id.toString(),
      employeeId: transferRequest.employeeId.toString(),
    });
  });

  it("returns null for a well-formed id that doesn't exist", async () => {
    const result = await findTransferRequestById(new Types.ObjectId().toString());

    expect(result).toBeNull();
  });

  it("returns null, not a thrown CastError, for a syntactically malformed id", async () => {
    await expect(findTransferRequestById("not-a-valid-object-id")).resolves.toBeNull();
  });
});
