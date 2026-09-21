# Task: org-structure-management.T03

**Implements:** `org-structure-management.T03` — relax `GET /departments` and `GET /job-roles` from Admin-only to any authenticated role.

**Acceptance:** `org-structure-management.AC6`, `AC12`. Neither AC ever required Admin-only reads — `AC2`/`AC8` are the only ACs restricting anything to Admin, and they name only create/edit/delete, never list view.

**Origin:** found while scoping `stakeholder-panel-ui.T04` (the Submit Request form). An Employee submitting a transfer request must supply a `departmentId` and `jobRoleId` (`internal-transfer-workflow.API01`), but both list endpoints were implemented — not specified — as Admin-only via `withAuthorization("admin.departmentRoleManagement", ...)`, the same action gating the actual mutations. No non-Admin role had any way to read either list at all.

**Scope — build only this:**
- Change `GET /departments` and `GET /job-roles` from `withAuthorization("admin.departmentRoleManagement", ...)` to a plain `authenticateRequest` check — any authenticated session (401 without one), no role restriction.
- Update both routes' existing test files: the current "responds 403 for a non-Admin caller" test is corrected to a full 6-role sweep asserting 200, since that 403 encoded a stricter-than-specified assumption, not a real requirement.

**Do not touch:**
- `POST`/`PATCH`/`DELETE` on either resource — these remain Admin-only (`AC2`/`AC8`), unchanged.
- Anything in `stakeholder-panel-ui` or `admin-panel-ui` — this task only fixes the backend read permission those specs' forms depend on.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for org-structure-management.T03` has produced Red tests for it, confirmed failing for the right reason.
