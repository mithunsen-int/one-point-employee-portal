# Task: stakeholder-panel-ui.T11

**Implements:** `stakeholder-panel-ui.T11` — the HR Final Mapping panel on the adaptive request detail/action screen (`T05`'s base).

**Acceptance:** `stakeholder-panel-ui.AC9`. API Contract consumed: `internal-transfer-workflow.API08`, `user-management-console.API04` (read-only, filtered). Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 8.

**Scope — build only this:**
- Extend `transferRequestsService.ts` with a call to `POST /transfer-requests/{id}/hr-final-mapping`.
- `managersLookupService.ts`: a single read-only call to `GET /users` filtered to `role: "Manager"` — kept local to this module, not shared with `admin-panel-ui`'s `usersService.ts` (per this plan's Architecture Approach).
- `useHrFinalMapping` mutation hook (invalidating `useRequestDetail`/`useMyRequests` on success) and `useManagersList` query hook.
- The HR Final Mapping panel: a Manager selector populated from `useManagersList`, submit calling `useHrFinalMapping` with the chosen `newManagerId`. Shown when the request is `Pending: Payroll, IT, Facilities` with all three tasks `Completed` and the viewer's role is HR.

**Do not touch:**
- `admin-panel-ui`'s own `usersService.ts` — do not import from it or extend it; this task's Manager lookup is its own local, read-only service file.
- `T05`'s Employee-facing content, `T06`–`T10`'s panels.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T11` has produced Red tests for it, confirmed failing for the right reason.
