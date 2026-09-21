# Task: rbac-api-security.T04

**Implements:** `rbac-api-security.T04` — Cross-cutting authorization middleware: bearer-token verification (`rbac-api-security.API01`).

**Acceptance:** `rbac-api-security.AC1`. API Contract: `rbac-api-security.API01`. Full text in `.ai-context/specs/rbac-api-security.spec.md`. Implementation detail: `.ai-context/plans/rbac-api-security.plan.md`, Sequencing step 4.

**Scope — build only this:**
- Middleware that verifies an `Authorization: Bearer <token>` header is present, well-formed, and not expired — using `T01`'s verification utility (do not reimplement JWT verification here).
- On failure (missing/malformed/expired token): responds 401 with `{ "error": { "code": "UNAUTHENTICATED", "message": ... } }`, per `rbac-api-security.API01`.
- On success: attaches the decoded identity/role to the request context for downstream use (by `T05`'s role check and by every other spec's endpoints).

**Do not touch:**
- Role-permission decisions (403 logic) — that is `T05`, not this task. This task only establishes *who* the caller is, not *what* they're allowed to do.
- Wiring this middleware onto specific routes, and the `user-management-console.API06` exclusion — that is `T06`, not this task. This task builds the middleware function itself, not its application to routes.
- `T01`'s signing/verification utility internals (only call it).

**Test-first:** Do not write this task's implementation until `@generate-tests.md for rbac-api-security.T04` has produced Red tests for it, confirmed failing for the right reason.
