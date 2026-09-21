# Task: rbac-api-security.T05

**Implements:** `rbac-api-security.T05` — Role-permission matrix (code/config) covering all six roles + Admin.

**Acceptance:** `rbac-api-security.AC2`, `rbac-api-security.AC3`, `rbac-api-security.AC4`, `rbac-api-security.AC5`, `rbac-api-security.AC6`, `rbac-api-security.AC7`, `rbac-api-security.AC8`, `rbac-api-security.AC9`. Full text (the exact permitted-action boundary per role) in `.ai-context/specs/rbac-api-security.spec.md`. Implementation detail: `.ai-context/plans/rbac-api-security.plan.md`, Sequencing step 5 and Data Model (the matrix is code/config-defined, never database-defined — do not introduce a collection for this).

**Scope — build only this:**
- A code/config-defined mapping of each of the seven roles (Employee, Manager, HR, Payroll, IT, Facilities, Admin) to its permitted action set, exactly as `AC3`–`AC9` define them — including the Employee-registration carve-out in `AC9` (Admin or HR only).
- A check function the authorization middleware (`T04`/`T06`) calls with `(role, action)` to get an allow/deny decision, surfaced as 403 per `AC2` when denied.

**Do not touch:**
- Bearer-token verification (`T04`) — this task assumes an already-authenticated identity/role is available; it does not verify tokens itself.
- Wiring into specific routes (`T06`) — this task builds the matrix and the check function, not their application.
- Any database schema or collection — the matrix is explicitly code/config, per the plan's Data Model decision.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for rbac-api-security.T05` has produced Red tests for it, confirmed failing for the right reason.
