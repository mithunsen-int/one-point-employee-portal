# Task: stakeholder-panel-ui.T07

**Implements:** `stakeholder-panel-ui.T07` — the HR Decision panel on the adaptive request detail/action screen (`T05`'s base).

**Acceptance:** `stakeholder-panel-ui.AC7`. API Contract consumed: `internal-transfer-workflow.API04`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 6.

**Scope — build only this:**
- Extend `transferRequestsService.ts` with a call to `POST /transfer-requests/{id}/hr-decision`.
- `useHrDecision` mutation hook, invalidating `useRequestDetail`/`useMyRequests` on success.
- The HR Decision panel: Approve/Reject actions, shown when the request is `Pending: HR` and the viewer's role is HR. Same required-reason-on-reject pattern as `T06`'s Manager panel (Yup validation before submit).

**Do not touch:**
- `T05`'s Employee-facing content, `T06`'s Manager panel, or `T08`–`T11`'s panels.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T07` has produced Red tests for it, confirmed failing for the right reason.
