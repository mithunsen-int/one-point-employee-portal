# Task: stakeholder-panel-ui.T08

**Implements:** `stakeholder-panel-ui.T08` — the Payroll task-completion panel on the adaptive request detail/action screen (`T05`'s base).

**Acceptance:** `stakeholder-panel-ui.AC8` (this AC covers Payroll, IT, and Facilities together in the spec; this task builds only the Payroll portion — see `T09`/`T10` for IT/Facilities). API Contract consumed: `internal-transfer-workflow.API05`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 7 (split into `T08`/`T09`/`T10`, one per role, since each has a structurally distinct payload).

**Scope — build only this:**
- Extend `transferRequestsService.ts` with a call to `POST /transfer-requests/{id}/payroll-task`.
- `usePayrollTask` mutation hook, invalidating `useRequestDetail`/`useMyRequests` on success.
- The Payroll task-completion form: `salary`/`compensation`/`tax`/`costCenter` fields (Formik + Yup) plus a "No Action Needed" option, per `API05`'s own contract. Shown when the request is `Pending: Payroll, IT, Facilities` and the viewer's role is Payroll.

**Do not touch:**
- `T09`'s IT panel or `T10`'s Facilities panel — structurally different forms, separate tasks even though they render in the same screen area.
- `T05`'s Employee-facing content, `T06`/`T07`'s panels.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T08` has produced Red tests for it, confirmed failing for the right reason.
