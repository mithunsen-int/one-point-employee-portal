# Task: stakeholder-panel-ui.T04

**Implements:** `stakeholder-panel-ui.T04` — Submit Request screen: Employee-only Formik/Yup form.

**Acceptance:** `stakeholder-panel-ui.AC3`. API Contract consumed: `internal-transfer-workflow.API01`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 3.

**Scope — build only this:**
- Extend `transferRequestsService.ts` with a call to `POST /transfer-requests`.
- `useSubmitRequest` mutation hook, invalidating `useMyRequests`' query key on success.
- The Submit Request form (departmentId, location, jobRoleId, effectiveDate, optional reason), Formik + Yup, per `int-standards.nextjs.md` #11.
- A 400/403/404 response from the API is displayed on the form, not silently dropped.

**Do not touch:**
- `T03`'s list screen, or any other screen.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T04` has produced Red tests for it, confirmed failing for the right reason.
