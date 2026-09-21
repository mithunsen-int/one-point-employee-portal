# Task: rbac-api-security.T01

**Implements:** `rbac-api-security.T01` — JWT signing/verification utility + environment-variable-based secret configuration.

**Acceptance:** `rbac-api-security.AC10`. Full text in `.ai-context/specs/rbac-api-security.spec.md`. Implementation detail: `.ai-context/plans/rbac-api-security.plan.md`, Sequencing step 1.

**Scope — build only this:**
- A JWT sign/verify utility in the Auth/RBAC Service, per `ADR-0001-jwt-authentication.md`.
- Reads the JWT signing secret from an environment variable — never hardcoded, never logged (constitution.md Security Posture).

**Do not touch:**
- No other task in `.ai-context/tasks/rbac-api-security.tasks.md` — none are `Merged` yet.
- No route handlers (`POST /auth/login` is `T02`; the authorization middleware is `T04`) — this task is the signing/verification utility only.
- No files or modules outside the Auth/RBAC Service.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for rbac-api-security.T01` has produced Red tests for it, confirmed failing for the right reason.
