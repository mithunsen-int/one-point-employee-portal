# Task: user-management-console.T06

**Implements:** `user-management-console.T06` — `POST /admin/self-register` (`API06`): unauthenticated bootstrap endpoint, its own rate limit, single-Admin invariant enforced by `T01`'s database index.

**Acceptance:** `user-management-console.AC14`, `user-management-console.AC15`. API Contract: `user-management-console.API06`. Full text in `.ai-context/specs/user-management-console.spec.md`. Implementation detail: `.ai-context/plans/user-management-console.plan.md`, Sequencing step 6 and its dedicated rate-limit decision (5 requests/IP/hour — distinct from the "none, deferred" blanket applied to `T03`–`T05`).

**Scope — build only this:**
- `POST /admin/self-register`: creates the one Admin account, `role: "Admin"`, using `T02`'s hashing utility. Relies on `T01`'s `{ role: "Admin", deletedAt: null }` partial unique index to enforce `AC15` (409 on a second attempt) — do not add a redundant application-level "count Admins" check as the *only* guard; the database index is the actual enforcement.
- Its own rate limit: 5 requests per IP per hour, separate from any other endpoint's limit.
- **Must be excluded from the RBAC authorization middleware** — this is the one deliberately unauthenticated endpoint in the system (per `rbac-api-security.T06`, which is responsible for that exclusion on the middleware-wiring side — this task builds the endpoint itself, correctly *not* requiring auth, but does not touch the middleware wiring).

**Do not touch:**
- `rbac-api-security.T06`'s middleware-wiring logic — coordinate with it (this endpoint must not require auth) but don't implement that exclusion here; that's the other task's job.
- Any other registration path (`T03`) — this is a separate, one-time-only flow, not a variant of normal registration.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for user-management-console.T06` has produced Red tests for it, confirmed failing for the right reason.
