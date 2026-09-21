# Task: internal-transfer-workflow.T13

**Implements:** `internal-transfer-workflow.T13` — new `Pending: Transfer` status, set automatically once all 3 parallel tasks complete.

**Acceptance:** `internal-transfer-workflow.AC13`, `AC14`, `AC18`, `AC22` (all amended 2026-09-20), `AC25` (added 2026-09-20).

**Origin:** added at explicit user direction during `stakeholder-panel-ui.T11`'s Gate 2 review. The reviewer identified that `API02`'s response has no field indicating individual task-completion progress, so the frontend's HR Final Mapping panel had no direct way to know "all 3 tasks are done, it's my turn" — it relied instead on `internal-transfer-workflow.T12`'s carve-out only ever letting the fetch succeed once that's true, a correct but indirect signal. This task makes that state a first-class, directly observable part of the request itself.

**Scope — build only this:**
- `src/services/workflow/TransferRequest.ts`: add `"Pending: Transfer"` to `TransferRequestStatus` and `TRANSFER_REQUEST_STATUSES`, positioned after `"Pending: Payroll, IT, Facilities"`.
- New shared helper (e.g. `src/services/workflow/allParallelTasksCompleted.ts`): `allParallelTasksCompleted(transferRequest)` returning true iff `payrollTaskStatus`/`itTaskStatus`/`facilitiesTaskStatus` are all `"Completed"`. Reused by all three task-completion handlers below rather than tripling the same check.
- `payroll-task`/`it-task`/`facilities-task` routes: after setting the handler's own task field to `"Completed"` (in memory, before `save()`), call the new helper; if true, also set `transferRequest.status = "Pending: Transfer"` in the same save.
- `hr-final-mapping` route: change its 409 precondition from checking all three task fields directly to checking `transferRequest.status !== "Pending: Transfer"`.
- `GET /transfer-requests/{id}` route: add a `"Pending: Transfer"` case to `pendingStakeholdersFor`, returning `["HR"]`. Simplify the existing HR eligibility check (`isEligibleHr`) to `role === "HR" && (status === "Pending: HR" || status === "Pending: Transfer")`, removing the now-redundant `allTasksCompleted` computation.
- `GET /transfer-requests/mine` route: simplify the HR branch's query to `{ $or: [{ status: "Pending: HR" }, { status: "Pending: Transfer" }] }`, removing the three-field check.

**Do not touch:**
- Payroll/IT/Facilities's own eligibility conditions in either `API02`'s carve-out or `API10`'s query — unaffected, still `status === "Pending: Payroll, IT, Facilities"` plus that role's own task field being `"Pending"`.
- Anything about `Manager`'s carve-out or `AC19`'s Manager-specific behavior.
- `transfer-admin-oversight`'s own endpoints — the dashboard's `statusBreakdown` derives from `TRANSFER_REQUEST_STATUSES` dynamically, so the new status appears there automatically; no code change needed or expected in that spec's files.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T13` has produced Red tests for it, confirmed failing for the right reason. At minimum: the schema accepts `"Pending: Transfer"` (and the existing "rejects an invalid status" test still passes); each of the three task-completion endpoints transitions status to `"Pending: Transfer"` only when it is genuinely the *last* of the three to complete (not when it's the first or second); `hr-final-mapping` now succeeds on a `"Pending: Transfer"` request and 409s on a `"Pending: Payroll, IT, Facilities"` one regardless of the individual task fields' values; `GET /transfer-requests/{id}` returns 200 for HR on a `"Pending: Transfer"` request and 403 on a `"Pending: Payroll, IT, Facilities"` one even if the task fields happen to all be `"Completed"` (proving status, not the fields, is now authoritative); `GET /transfer-requests/mine` returns a `"Pending: Transfer"` request to HR. Existing tests across all of these files that construct a request already in the old all-completed-but-not-yet-transitioned state will need their fixtures updated to reflect the new invariant — update them deliberately, don't leave them silently broken.
