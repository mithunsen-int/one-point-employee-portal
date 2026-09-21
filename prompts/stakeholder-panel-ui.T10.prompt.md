# Task: stakeholder-panel-ui.T10

**Implements:** `stakeholder-panel-ui.T10` — the Facilities task-completion panel on the adaptive request detail/action screen (`T05`'s base).

**Acceptance:** `stakeholder-panel-ui.AC8` (this AC covers Payroll, IT, and Facilities together in the spec; this task builds only the Facilities portion — see `T08`/`T09` for Payroll/IT). API Contract consumed: `internal-transfer-workflow.API07`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 7 (split into `T08`/`T09`/`T10`, one per role, since each has a structurally distinct payload).

**Scope — build only this:**
- Extend `transferRequestsService.ts` with a call to `POST /transfer-requests/{id}/facilities-task`.
- `useFacilitiesTask` mutation hook, invalidating `useRequestDetail`/`useMyRequests` on success.
- The Facilities task-completion form: `workspace`/`officeLogistics`/`locationSetup` fields (Formik + Yup), per `API07`'s own contract. Shown when the request is `Pending: Payroll, IT, Facilities` and the viewer's role is Facilities. No "No Action Needed" option.

**Do not touch:**
- `T08`'s Payroll panel or `T09`'s IT panel.
- `T05`'s Employee-facing content, `T06`/`T07`'s panels.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T10` has produced Red tests for it, confirmed failing for the right reason.
