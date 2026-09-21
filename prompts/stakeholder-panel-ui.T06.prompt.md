# Task: stakeholder-panel-ui.T06

**Implements:** `stakeholder-panel-ui.T06` — the Manager Decision panel on the adaptive request detail/action screen (`T05`'s base).

**Acceptance:** `stakeholder-panel-ui.AC6`. API Contract consumed: `internal-transfer-workflow.API03`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 5.

**Scope — build only this:**
- Extend `transferRequestsService.ts` with a call to `POST /transfer-requests/{id}/manager-decision`.
- `useManagerDecision` mutation hook, invalidating `useRequestDetail`/`useMyRequests` on success.
- The Manager Decision panel: Approve/Reject actions, shown when the viewer is the assigned Manager. Reject requires a reason (Yup validation) before the client will submit — mirroring `API03`'s own required-reason contract, not a replacement for its 400.

**Do not touch:**
- `T05`'s Employee-facing content, or `T07`–`T11`'s panels.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T06` has produced Red tests for it, confirmed failing for the right reason.
