# Task: internal-transfer-workflow.T08

**Implements:** `internal-transfer-workflow.T08` — `POST /transfer-requests/{id}/withdraw` (`API09`).

**Acceptance:** `internal-transfer-workflow.AC16`, `AC17`. API Contract: `internal-transfer-workflow.API09`. Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Sequencing step 8.

**Scope — build only this:**
- 403 unless the caller is the requesting Employee (same ownership check as `T03`).
- 409 unless `status: "Pending: Manager"` exactly — every other status (including `Pending: HR` and beyond) is rejected, per `AC17`.
- On success: `status: "Withdrawn"`.

**Do not touch:**
- Any other status transition — withdrawal is the only thing this task builds.
- Race-condition handling between a withdraw and a near-simultaneous manager-decision — not addressed anywhere in the spec/plan; do not invent locking behavior here (see `test_cases/internal-transfer-workflow.test_cases.md`'s QT22 Open Question).

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T08` has produced Red tests for it, confirmed failing for the right reason.
