# Task: transfer-admin-oversight.T02

**Implements:** `transfer-admin-oversight.T02` — `GET /admin/transfer-requests` (`API02`): unfiltered monitoring list.

**Acceptance:** `transfer-admin-oversight.AC4`, `AC5`. API Contract: `transfer-admin-oversight.API02`. Implementation detail: `.ai-context/plans/transfer-admin-oversight.plan.md`, Sequencing step 2.

**Scope — build only this:**
- 403 unless caller is Admin.
- Returns every `TransferRequests` document (`id`, `status`, `employeeId`, `submittedAt`) — **no filtering, no search parameters accepted**, per the spec's explicit decision.
- Pagination is not stated anywhere (see `test_cases/transfer-admin-oversight.test_cases.md`'s QT06 Open Question) — do not invent a page size or cursor scheme; return the full unfiltered result set as the spec literally describes, and flag to the reviewer if this proves impractical rather than silently adding undocumented pagination.

**Do not touch:**
- `T01`/`T03`.
- Any sort/filter parameter handling — none is defined.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for transfer-admin-oversight.T02` has produced Red tests for it, confirmed failing for the right reason.
