# Task: internal-transfer-workflow.T04

**Implements:** `internal-transfer-workflow.T04` — `POST /transfer-requests/{id}/manager-decision` (`API03`): approve/reject, conditional-required reason.

**Acceptance:** `internal-transfer-workflow.AC4`, `AC5`, `AC6`, `AC9` (the `Rejected`-closes-permanently half). API Contract: `internal-transfer-workflow.API03`. Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Sequencing step 4 and the Data Model's conditional-required-field note.

**Scope — build only this:**
- 409 unless `status: "Pending: Manager"`.
- 403 unless the caller is `assignedManagerId` (per `T02`'s snapshot) — not just "any Manager."
- `decision: "approve"` → `status: "Pending: HR"`. `decision: "reject"` → requires `reason` (400 if absent or empty string), sets `status: "Rejected"` permanently (no further transitions accepted on this request by any endpoint — enforced by each endpoint's own state check, not centrally here).

**Do not touch:**
- `T01`'s schema, `T02`'s submission logic.
- HR decision (`T05`) or any later stage.
- Audit logging (`T09`'s job).

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T04` has produced Red tests for it, confirmed failing for the right reason.
