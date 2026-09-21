# Task: internal-transfer-workflow.T06

**Implements:** `internal-transfer-workflow.T06` — `POST .../payroll-task`, `.../it-task`, `.../facilities-task` (`API05`–`API07`): three independent task-completion endpoints.

**Acceptance:** `internal-transfer-workflow.AC10`, `AC11`, `AC12`. API Contract: `internal-transfer-workflow.API05`, `API06`, `API07`. Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Sequencing step 6 and the Constitution Check's parallel-independence rule.

**Scope — build only this:**
- Three separate handlers, each: 403 unless caller role matches (Payroll/IT/Facilities respectively); 409 unless `status: "Pending: Payroll, IT, Facilities"` AND that specific task's status is still `Pending` (already-`Completed` → 409, idempotency).
- Each handler updates **only its own** status field (`payrollTaskStatus`/`itTaskStatus`/`facilitiesTaskStatus`) — never reads or reasons about the other two tasks' state. This is what makes `AC10`–`AC12`'s independence real, not just documented.
- Payroll's `action: "no_action_needed"` is a valid alternative to `"update"` — both mark its task `Completed`.

**Do not touch:**
- The other two tasks' logic when implementing one of the three handlers — no cross-task coordination code belongs in any of these three handlers.
- `T07`'s final-mapping gate — that reads all three statuses, but this task doesn't implement that check.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T06` has produced Red tests for it, confirmed failing for the right reason.
