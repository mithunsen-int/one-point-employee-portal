# Task: internal-transfer-workflow.T03

**Implements:** `internal-transfer-workflow.T03` — `GET /transfer-requests/{id}` (`API02`): status/history/pending-stakeholders view, scoped to the requesting Employee.

**Acceptance:** `internal-transfer-workflow.AC18`, `AC19`. API Contract: `internal-transfer-workflow.API02`. Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Sequencing step 3.

**Scope — build only this:**
- The `GET /transfer-requests/{id}` handler: 403 unless the caller is the requesting Employee (`AC19`) — note this excludes Admin too; Admin uses `transfer-admin-oversight.API03` instead, a separate endpoint this task does not build.
- Renders `status` exactly per `AC18`'s vocabulary.
- `actionHistory` is sourced from `transfer-audit-trail` (direct query against `AuditLogs`, per that spec's own design) — do not build a separate logging mechanism here.
- `pendingStakeholders` — derive from current `status` (e.g. `Pending: Manager` → `["Manager"]`).

**Do not touch:**
- Any write/mutation logic — this is a read-only endpoint.
- `transfer-admin-oversight.API03` — a separate, Admin-only detail endpoint; do not merge its logic here or add an Admin bypass to this one.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T03` has produced Red tests for it, confirmed failing for the right reason.
