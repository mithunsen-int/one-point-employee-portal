import { User } from "@/services/users/User";

export interface LoginLookupUser {
  userId: string;
  username: string;
  passwordHash: string;
  role: string;
  deletedAt: string | null;
}

// Implements rbac-api-security.T07 — wires this read-contract (fixed since
// rbac-api-security.plan.md's Data Model section) to the real Users
// collection, closing the stub rbac-api-security.T02 deliberately left open
// pending user-management-console.T01.
export async function findUserForLogin(username: string): Promise<LoginLookupUser | null> {
  const user = await User.findOne({ username });
  if (!user) {
    return null;
  }

  return {
    userId: user._id.toString(),
    username: user.username,
    passwordHash: user.passwordHash,
    role: user.role,
    deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
  };
}
