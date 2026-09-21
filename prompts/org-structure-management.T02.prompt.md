# Task: org-structure-management.T02

**Implements:** `org-structure-management.T02` — `JobRoles` Mongoose schema (unique `title`) + full CRUD (`API06` create, `API07` edit, `API08` delete, `API09` list).

**Acceptance:** `org-structure-management.AC7`, `AC8`, `AC9`, `AC10`, `AC11`, `AC12`, `AC13`. Full text in `.ai-context/specs/org-structure-management.spec.md`. Implementation detail: `.ai-context/plans/org-structure-management.plan.md`, Sequencing step 2.

**Scope — build only this:**
- `JobRoles` collection: `title` (unique index).
- `POST /job-roles`, `PATCH /job-roles/{id}`, `DELETE /job-roles/{id}`, `GET /job-roles` — structurally identical pattern to `T01`'s Departments endpoints, substituting `title` for `name`. Admin-only, 400 on missing/empty `title`, 409 on duplicate.
- Deleting a Job Role only removes it from the list view (`AC11`) — same explicit non-resolution of referential integrity as `T01`.

**Do not touch:**
- `Departments` (`T01`) — a separate collection, separate task.
- `API10` (detailed view) — not built by this plan at all.
- **This is NOT the system access-control role** (Employee/HR/Manager/Payroll/IT/Facilities/Admin, owned by `rbac-api-security`/`user-management-console`) — "Job Role" here always means an organizational job title/position. Do not touch anything related to authentication roles.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for org-structure-management.T02` has produced Red tests for it, confirmed failing for the right reason.
