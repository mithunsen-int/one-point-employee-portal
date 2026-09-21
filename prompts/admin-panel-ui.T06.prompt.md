# Task: admin-panel-ui.T06

**Implements:** `admin-panel-ui.T06` — User Management screen: list plus Formik/Yup create/edit forms and a delete action, over `user-management-console.API01`–`API05`.

**Acceptance:** `admin-panel-ui.AC4`, `admin-panel-ui.AC5`. API Contract consumed: `user-management-console.API01`–`API05` (not `API06` — see Do not touch). Implementation detail: `.ai-context/plans/admin-panel-ui.plan.md`, Sequencing step 5.

**Scope — build only this:**
- `usersService.ts`: thin fetch wrappers for `POST /users` (create), `PATCH /users/{id}` (edit), `DELETE /users/{id}` (delete), `GET /users` (list).
- `useUsers` query hook plus `useCreateUser`/`useEditUser`/`useDeleteUser` mutation hooks, each invalidating `useUsers`' query key on success.
- The User Management page/component: a list (every user, per `AC4`) plus Formik/Yup-driven create and edit forms and a delete action per row.
- Any 4xx error from a mutation (e.g., duplicate username) is displayed on the form, not silently dropped (`AC5`).

**Do not touch:**
- `user-management-console.API06` (Admin self-registration bootstrap) — explicitly out of scope for this task and this spec; do not build any UI for it.
- `T02`'s layout/guard/logout.
- Department/Job Role screens (`T07`/`T08`).

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T06` has produced Red tests for it, confirmed failing for the right reason.
