# Task: admin-panel-ui.T08

**Implements:** `admin-panel-ui.T08` — Job Role Management screen: list plus Formik/Yup create/edit forms and a delete action, over `org-structure-management.API06`–`API09`. No detail view — matching the API layer.

**Acceptance:** `admin-panel-ui.AC7`. API Contract consumed: `org-structure-management.API06`–`API09`. Implementation detail: `.ai-context/plans/admin-panel-ui.plan.md`, Sequencing step 7.

**Scope — build only this:**
- `orgStructureService.ts` (Job Role portion): thin fetch wrappers for `POST /job-roles`, `PATCH /job-roles/{id}`, `DELETE /job-roles/{id}`, `GET /job-roles`.
- `useJobRoles` query hook plus create/edit/delete mutation hooks, each invalidating `useJobRoles`' query key on success.
- The Job Role Management page/component: list, create/edit forms, delete action. **No per-row "view detail" action or route** — `org-structure-management` never built a Job Role detail endpoint (BRD-004's "optional" detail view wasn't built for this entity); do not add one.

**Do not touch:**
- Department Management (`T07`) — a separate task even though it shares `orgStructureService.ts`'s file; add Department methods there, not here.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T08` has produced Red tests for it, confirmed failing for the right reason.
