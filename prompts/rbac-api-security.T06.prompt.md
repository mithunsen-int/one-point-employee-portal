# Task: rbac-api-security.T06

**Implements:** `rbac-api-security.T06` — Wire the authorization middleware (`T04`) and role-permission matrix (`T05`) into every protected endpoint, explicitly excluding `user-management-console.API06`.

**Acceptance:** `rbac-api-security.AC1`, `rbac-api-security.AC2`. Full text in `.ai-context/specs/rbac-api-security.spec.md`. Implementation detail: `.ai-context/plans/rbac-api-security.plan.md`, Sequencing step 6 and the Data Model's "Exception to the middleware's blanket coverage" note.

**Scope — build only this:**
- Apply `T04`'s bearer-verification middleware and `T05`'s role-check to every existing protected Next.js API route.
- **Explicitly exclude `user-management-console.API06`** (`POST /admin/self-register`) from this wiring — that endpoint is deliberately unauthenticated by its own spec's design, to bootstrap the system's single Admin account. Do not apply the middleware there.

**Do not touch:**
- `T04`'s middleware logic or `T05`'s matrix logic themselves — only their application to routes.
- `user-management-console.API06`'s own implementation (its rate limit, its single-Admin database constraint) — out of scope for this task entirely; this task's only relationship to it is *not* wiring the middleware onto it.
- Any endpoint's own business logic — this task only adds the authorization gate in front of existing/future routes, it does not modify what they do once authorized.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for rbac-api-security.T06` has produced Red tests for it, confirmed failing for the right reason.
