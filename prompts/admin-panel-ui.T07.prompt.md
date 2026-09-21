# Task: admin-panel-ui.T07

**Implements:** `admin-panel-ui.T07` — Department Management screen: list, detail view, plus Formik/Yup create/edit forms and a delete action, over `org-structure-management.API01`–`API05`.

**Acceptance:** `admin-panel-ui.AC6`. API Contract consumed: `org-structure-management.API01`–`API05`. Implementation detail: `.ai-context/plans/admin-panel-ui.plan.md`, Sequencing step 6.

**Scope — build only this:**
- `orgStructureService.ts` (Departments portion): thin fetch wrappers for `POST /departments`, `PATCH /departments/{id}`, `DELETE /departments/{id}`, `GET /departments`, `GET /departments/{id}`.
- `useDepartments` query hook, `useDepartmentDetail` query hook, plus create/edit/delete mutation hooks, each invalidating `useDepartments`' query key on success.
- The Department Management page/component: list, detail view, create/edit forms, delete action.

**Do not touch:**
- Job Role Management (`T08`) — a separate task even though it shares `orgStructureService.ts`'s file; add Job Role methods there, not here.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T07` has produced Red tests for it, confirmed failing for the right reason.
