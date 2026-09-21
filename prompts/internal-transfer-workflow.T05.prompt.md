# Task: internal-transfer-workflow.T05

**Implements:** `internal-transfer-workflow.T05` — `POST /transfer-requests/{id}/hr-decision` (`API04`): ≥90-day eligibility check, approve/reject, spawns 3 parallel tasks.

**Acceptance:** `internal-transfer-workflow.AC7`, `AC8`, `AC9`. API Contract: `internal-transfer-workflow.API04`. Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Sequencing step 5.

**Scope — build only this:**
- 409 unless `status: "Pending: HR"`. 403 unless caller role is HR (any HR user — no specific-reviewer routing, per the spec's Explicitly Out of Scope).
- Eligibility: read the employee's `dateOfJoining` (direct query against `Users`), 409 if fewer than 90 days have elapsed (inclusive — exactly 90 days qualifies, per `AC7`'s "at least 90 days" wording).
- `decision: "approve"` (and eligible) → `status: "Pending: Payroll, IT, Facilities"`, initializes `payrollTaskStatus`/`itTaskStatus`/`facilitiesTaskStatus` all to `Pending`.
- `decision: "reject"` → requires `reason` (400 if absent/empty), `status: "Rejected"` permanently.

**Do not touch:**
- `T04`'s manager-decision logic.
- The three parallel-task completion endpoints (`T06`) — this task only creates their initial `Pending` state, doesn't implement their completion.
- `dateOfJoining`'s schema/ownership — read-only here, owned by `user-management-console`.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T05` has produced Red tests for it, confirmed failing for the right reason.
