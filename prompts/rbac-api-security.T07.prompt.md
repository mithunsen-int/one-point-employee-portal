# Task: rbac-api-security.T07

**Implements:** `rbac-api-security.T07` — wire `findUserForLogin` (`src/services/auth/userLookup.ts`) to the real `Users` collection.

**Acceptance:** `rbac-api-security.AC10`, `AC11`, `AC12`. Same ACs `T02` already covers — this task completes `T02`'s own scope, it doesn't add new behavior.

**Origin:** found via a project-wide test-coverage audit. `userLookup.ts` was a deliberate stub, blocked on `user-management-console.T01` (the real `Users` schema). That schema Merged 2026-09-18; the stub was never revisited despite being explicitly tracked in `status.md` twice. As shipped, `POST /auth/login` throws on every real request — `login/route.test.ts` only passes because it mocks `userLookup` entirely.

**Scope — build only this:**
- Implement `findUserForLogin(username)` against the real `User` Mongoose model (`src/services/users/User.ts`): look up by `username`, return `{ userId, username, passwordHash, role, deletedAt }` (mapping `deletedAt` to an ISO string or `null`), or `null` if no match.
- A new, real (unmocked) test file, `src/services/auth/userLookup.test.ts`, exercising the actual `Users` collection via `mongoServer` test utils — proving this function works for real, not just against a mock.

**Do not touch:**
- `login/route.ts` or `login/route.test.ts` — that route's own tests correctly mock this function to test route logic in isolation; that pattern is fine and stays as-is. This task only fixes what the mock was standing in for.
- `rateLimiter.ts`, `jwt.ts`, or any other already-Merged file in this spec.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for rbac-api-security.T07` has produced Red tests for it, confirmed failing for the right reason.
