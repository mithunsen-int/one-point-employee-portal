# Task: transfer-admin-oversight.T01

**Implements:** `transfer-admin-oversight.T01` — `GET /admin/dashboard` (`API01`): `userCounts`, `totalTransferRequests`, `statusBreakdown`.

**Acceptance:** `transfer-admin-oversight.AC1`, `AC2`, `AC3`. API Contract: `transfer-admin-oversight.API01`. Implementation detail: `.ai-context/plans/transfer-admin-oversight.plan.md`, Sequencing step 1 and its two plan-level decisions (excludes soft-deleted users; totals count every request regardless of terminal status).

**Scope — build only this:**
- 403 unless caller is Admin.
- `userCounts`: aggregate `Users` grouped by `role`, for exactly the six roles named in `AC1` (Employee, HR, Manager, Payroll, IT, Facilities) — **excludes Admin and excludes soft-deleted (`deletedAt` set) users**. A role with zero users still appears with `0`, not omitted.
- `totalTransferRequests`/`statusBreakdown`: aggregate `TransferRequests` grouped by `status`, covering all six status values including terminal ones (`Rejected`/`Withdrawn`/`Completed`). A status with zero requests still appears with `0`.

**Do not touch:**
- `T02`/`T03` — this task is the dashboard only.
- No new collection, no writes — pure aggregation reads against `Users` (owned by `user-management-console`) and `TransferRequests` (owned by `internal-transfer-workflow`).

**Test-first:** Do not write this task's implementation until `@generate-tests.md for transfer-admin-oversight.T01` has produced Red tests for it, confirmed failing for the right reason.
