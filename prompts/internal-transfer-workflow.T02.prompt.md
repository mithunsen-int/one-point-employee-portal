# Task: internal-transfer-workflow.T02

**Implements:** `internal-transfer-workflow.T02` — `POST /transfer-requests` (`API01`): submission, `departmentId`/`jobRoleId`/`location` validation, `assignedManagerId` snapshot.

**Acceptance:** `internal-transfer-workflow.AC1`, `AC2`, `AC3`. API Contract: `internal-transfer-workflow.API01`. Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Sequencing step 2.

**Scope — build only this:**
- The `POST /transfer-requests` handler: validates `departmentId`/`jobRoleId`/`location`/`effectiveDate` present (400 on missing, per field), validates `departmentId`/`jobRoleId` exist via a direct Mongoose query against `Departments`/`JobRoles` (404 if not), validates `location` against `application-constants-management`'s backend module (direct import, not an API call) — 400 if not a configured value.
- Snapshots the requesting Employee's `managerId` (read from `Users`) onto `assignedManagerId` at creation time — per the plan's explicit decision, this is not looked up live afterward.
- Sets initial `status: "Pending: Manager"`.

**Do not touch:**
- `T01`'s schema (only use it).
- Any other endpoint (`T03`–`T09`).
- Audit logging — that's `T09`'s shared helper; do not call `transfer-audit-trail` directly from this handler.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T02` has produced Red tests for it, confirmed failing for the right reason.
