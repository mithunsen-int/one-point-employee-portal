# Task: rbac-api-security.T02

**Implements:** `rbac-api-security.T02` — `POST /auth/login` (`rbac-api-security.API02`): payload validation, credential lookup/verification (including the `deletedAt` check), JWT issuance or rejection.

**Acceptance:** `rbac-api-security.AC10`, `rbac-api-security.AC11`, `rbac-api-security.AC12`. API Contract: `rbac-api-security.API02`. Full text in `.ai-context/specs/rbac-api-security.spec.md`. Implementation detail: `.ai-context/plans/rbac-api-security.plan.md`, Sequencing step 2 and Data Model (the minimal `Users` read-contract: `username`, `passwordHash`, `role`, `deletedAt`).

**Scope — build only this:**
- The `POST /auth/login` route handler: request-shape validation (400 on malformed payload), `Users` lookup by `username` (typed single-field query, never a spread of raw body content into a filter), password verification against `passwordHash`, `deletedAt`-must-be-absent check (rejected with the same 401 as a wrong password — no distinct error code, per the plan's explicit anti-leak decision), JWT issuance on success.
- Consumes the `T01` signing utility — do not reimplement signing logic here.

**Do not touch:**
- `T01`'s signing/verification utility internals (only call it).
- Rate-limiting (`T03`), the authorization middleware (`T04`/`T06`), or the role-permission matrix (`T05`) — none of that logic belongs in this handler.
- The `Users` collection's schema itself — owned by `user-management-console`, not this task; only read from it here.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for rbac-api-security.T02` has produced Red tests for it, confirmed failing for the right reason.
