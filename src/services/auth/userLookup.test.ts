import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { User } from "@/services/users/User";
import { findUserForLogin } from "@/services/auth/userLookup";

beforeAll(async () => {
  await startTestDatabase();
  await User.init();
}, 60000);

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
});

describe("findUserForLogin — rbac-api-security.AC10/AC11/AC12 support: real Users lookup, no longer stubbed", () => {
  it("returns the matching user's login fields when the username exists", async () => {
    const created = await User.create({
      username: "jdoe",
      passwordHash: "hashed-value",
      role: "HR",
      dateOfJoining: new Date(),
    });

    const result = await findUserForLogin("jdoe");

    expect(result).toEqual({
      userId: created._id.toString(),
      username: "jdoe",
      passwordHash: "hashed-value",
      role: "HR",
      deletedAt: null,
    });
  });

  it("returns deletedAt as a non-null value for a soft-deleted user, so route.ts's deletedAt check still rejects them", async () => {
    await User.create({
      username: "gone",
      passwordHash: "hashed-value",
      role: "HR",
      dateOfJoining: new Date(),
      deletedAt: new Date("2026-01-01"),
    });

    const result = await findUserForLogin("gone");

    expect(result?.deletedAt).not.toBeNull();
  });

  it("returns null when no user with that username exists", async () => {
    const result = await findUserForLogin("does-not-exist");

    expect(result).toBeNull();
  });
});
