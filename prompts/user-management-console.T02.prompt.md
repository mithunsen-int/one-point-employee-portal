# Task: user-management-console.T02

**Implements:** `user-management-console.T02` — Password hashing utility (bcrypt, 12 salt rounds), wired into every write path that sets `passwordHash`.

**Acceptance:** `user-management-console.AC1`, `user-management-console.AC14`. Full text in `.ai-context/specs/user-management-console.spec.md`. Implementation detail: `.ai-context/plans/user-management-console.plan.md`, Sequencing step 2 and its bcrypt/12-rounds decision (this decision was deferred here *by* `rbac-api-security.plan.md`, which owns the read side of this same field).

**Scope — build only this:**
- A hashing utility using bcrypt at 12 salt rounds, taking a raw password and returning a `passwordHash`.
- Used by both `T03` (`POST /users`) and `T06` (`POST /admin/self-register`) — this task builds the utility itself, not its call sites.

**Do not touch:**
- The `Users` schema (`T01`) — only consumes the `passwordHash` field, doesn't define it.
- The registration endpoints themselves (`T03`, `T06`) — this task provides the utility function they call, not the route handlers.
- Password verification (comparing a login attempt's password against the stored hash) — that's `rbac-api-security.T02`'s responsibility, not this task's.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for user-management-console.T02` has produced Red tests for it, confirmed failing for the right reason.
