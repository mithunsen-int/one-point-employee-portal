# Task: transfer-admin-oversight.T03

**Implements:** `transfer-admin-oversight.T03` — `GET /admin/transfer-requests/{id}` (`API03`): detail + audit history.

**Acceptance:** `transfer-admin-oversight.AC6`, `AC7`, `AC8`. API Contract: `transfer-admin-oversight.API03`. Implementation detail: `.ai-context/plans/transfer-admin-oversight.plan.md`, Sequencing step 3.

**Scope — build only this:**
- 403 unless caller is Admin (distinct from `internal-transfer-workflow.API02`'s Employee-owns-request rule — this endpoint has no owns-request exception, Admin-only, full stop).
- 404 if `id` doesn't match an existing request.
- Returns the request's full field set (per `internal-transfer-workflow.API01`'s payload shape) plus `actionHistory` — sourced via a **direct query against `AuditLogs`** (owned by `transfer-audit-trail`), not an internal call to `transfer-audit-trail.API02`'s HTTP route, per the plan's explicit architecture decision.

**Do not touch:**
- `T01`/`T02`.
- `transfer-audit-trail.API02`'s own authorization logic — do not call that route internally; query `AuditLogs` directly instead, as the plan specifies.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for transfer-admin-oversight.T03` has produced Red tests for it, confirmed failing for the right reason.
