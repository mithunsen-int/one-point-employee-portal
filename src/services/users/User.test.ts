import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { User } from "@/services/users/User";

beforeAll(async () => {
  await startTestDatabase();
  await User.init(); // Mongoose builds indexes asynchronously; wait so uniqueness is actually enforced below.
}, 60000);

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
});

describe("Users schema — required fields (plan Data Model)", () => {
  it("requires dateOfJoining", async () => {
    const user = new User({ username: "jane.doe", passwordHash: "hash", role: "HR" });
    await expect(user.validate()).rejects.toThrow();
  });

  it("requires managerId when role is Employee", async () => {
    const user = new User({
      username: "jane.doe",
      passwordHash: "hash",
      role: "Employee",
      dateOfJoining: new Date(),
    });
    await expect(user.validate()).rejects.toThrow();
  });

  it("does not require managerId for a non-Employee role", async () => {
    const user = new User({
      username: "jane.doe",
      passwordHash: "hash",
      role: "HR",
      dateOfJoining: new Date(),
    });
    await expect(user.validate()).resolves.toBeUndefined();
  });

  it("rejects a role outside the 7 known values", async () => {
    const user = new User({
      username: "jane.doe",
      passwordHash: "hash",
      role: "SuperAdmin",
      dateOfJoining: new Date(),
    });
    await expect(user.validate()).rejects.toThrow();
  });
});

describe("Users schema — username uniqueness (user-management-console.AC5/UT06)", () => {
  it("rejects a second user with a duplicate username at the database level", async () => {
    await User.create({ username: "jane.doe", passwordHash: "hash1", role: "HR", dateOfJoining: new Date() });

    await expect(
      User.create({ username: "jane.doe", passwordHash: "hash2", role: "IT", dateOfJoining: new Date() }),
    ).rejects.toThrow();
  });
});

describe("Users schema — at-most-one-Admin partial unique index (user-management-console.AC15/UT18)", () => {
  it("rejects creating a second active Admin while one already exists", async () => {
    await User.create({ username: "admin1", passwordHash: "hash1", role: "Admin", dateOfJoining: new Date() });

    await expect(
      User.create({ username: "admin2", passwordHash: "hash2", role: "Admin", dateOfJoining: new Date() }),
    ).rejects.toThrow();
  });

  // Not a distinct spec/QA row — this is the direct, necessary consequence of the
  // plan's own Data Model decision to use a *partial* unique index (scoped to
  // deletedAt: null), not a full one: a full unique index would make Admin
  // re-registration permanently impossible after the one Admin is ever deleted.
  it("allows creating a new active Admin once the previous Admin is soft-deleted", async () => {
    await User.create({
      username: "admin1",
      passwordHash: "hash1",
      role: "Admin",
      dateOfJoining: new Date(),
      deletedAt: new Date(),
    });

    await expect(
      User.create({ username: "admin2", passwordHash: "hash2", role: "Admin", dateOfJoining: new Date() }),
    ).resolves.toBeDefined();
  });
});
