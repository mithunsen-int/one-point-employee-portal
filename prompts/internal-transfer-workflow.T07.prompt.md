# Task: internal-transfer-workflow.T07

**Implements:** `internal-transfer-workflow.T07` — `POST /transfer-requests/{id}/hr-final-mapping` (`API08`): gated on all 3 parallel tasks `Completed`.

**Acceptance:** `internal-transfer-workflow.AC13`, `AC14`, `AC15`. API Contract: `internal-transfer-workflow.API08`. Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Sequencing step 7.

**Scope — build only this:**
- 403 unless caller role is HR (any HR user, per `T05`'s same non-routing rule).
- 409 unless **all three** of `payrollTaskStatus`/`itTaskStatus`/`facilitiesTaskStatus` are `Completed` — check each independently; do not assume completion order.
- On success: sets `newManagerId` from the payload, `status: "Completed"`, `completedAt` timestamp. This is what makes the in-app confirmation (`AC15`) available — `T03`'s `GET` view surfaces it, this task doesn't build separate notification delivery.

**Do not touch:**
- `T06`'s three task-completion handlers — only reads their resulting status fields.
- Any notification/messaging mechanism — out of scope per the spec; `AC15` is satisfied by the status becoming visible via `API02`, nothing more.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T07` has produced Red tests for it, confirmed failing for the right reason.
