# Task: transfer-audit-trail.T03

**Implements:** `transfer-audit-trail.T03` — `GET /transfer-requests/{id}/audit-log` (`API02`).

**Acceptance:** `transfer-audit-trail.AC3`, `AC4`, `AC5`, `AC6`. API Contract: `transfer-audit-trail.API02`. Implementation detail: `.ai-context/plans/transfer-audit-trail.plan.md`, Sequencing step 3.

**Scope — build only this:**
- 403 unless the caller is the requesting Employee (direct query against `TransferRequests.employeeId`, owned by `internal-transfer-workflow`) or Admin.
- 404 if `id` doesn't match an existing transfer request.
- Returns all `AuditLogs` entries for that `transferRequestId` — per `test_cases/transfer-audit-trail.test_cases.md`'s QT07, ordering is not guaranteed/specified; do not invent a sort order not stated anywhere.

**Do not touch:**
- `T01`/`T02` (only read from what they create).
- Any Manager/HR-reviewer access — explicitly out of scope; this endpoint's authorization is exactly Employee-owns-request-or-Admin, nothing broader.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for transfer-audit-trail.T03` has produced Red tests for it, confirmed failing for the right reason.
