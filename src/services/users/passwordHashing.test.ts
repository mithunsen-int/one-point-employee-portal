import bcrypt from "bcrypt";
import { hashPassword } from "@/services/users/passwordHashing";

// AC1/AC14 describe the full registration flow (record created, 201) — that's
// T03/T06's scope, not this task's. This utility's own real deliverable is the
// hash itself, backed by the plan's explicit bcrypt/12-rounds decision (Sequencing
// step 2), cited representatively against AC1/AC14 the same way T01's schema was.
describe("hashPassword (user-management-console.AC1/AC14, bcrypt 12 rounds)", () => {
  it("produces a hash different from the raw password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
  });

  it("hashes at 12 salt rounds, per the plan's explicit decision", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(bcrypt.getRounds(hash)).toBe(12);
  });

  it("produces a different hash each time, even for the same password (unique salt per call)", async () => {
    const hash1 = await hashPassword("correct horse battery staple");
    const hash2 = await hashPassword("correct horse battery staple");
    expect(hash1).not.toBe(hash2);
  });

  // Verification itself is rbac-api-security.T02's scope (it already calls
  // bcrypt.compare directly against passwordHash) — this only confirms the hash
  // this utility produces is actually compatible with that existing call site,
  // not a new verification feature built here.
  it("produces a hash that bcrypt.compare validates against the original password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(bcrypt.compare("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("produces a hash that bcrypt.compare rejects for a different password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(bcrypt.compare("wrong password", hash)).resolves.toBe(false);
  });
});
