# Task: user-management-console.T05

**Implements:** `user-management-console.T05` — `GET /users` (`API04`), `GET /users/{id}` (`API05`): list and detail views, Admin/HR scoping.

**Acceptance:** `user-management-console.AC9`, `user-management-console.AC10`, `user-management-console.AC12`, `user-management-console.AC13`. API Contract: `user-management-console.API04`, `user-management-console.API05`. Full text in `.ai-context/specs/user-management-console.spec.md`. Implementation detail: `.ai-context/plans/user-management-console.plan.md`, Sequencing step 5.

**Scope — build only this:**
- `GET /users`: Admin sees every non-deleted user across all six roles + Admin (`AC9`); HR sees Employee-role, non-deleted records only (`AC12`); returns `id`/`username`/`role` per record.
- `GET /users/{id}`: same Admin/HR scoping, returns `id`/`username`/`role`/`dateOfJoining`/`managerId`; 403 for HR requesting a non-Employee record (`AC13`); 404 for a deleted or non-existent `id`.

**Do not touch:**
- `T01`'s schema, `T03`'s registration logic, `T04`'s edit/delete logic — this task is read-only.
- Additional profile fields beyond what's decided — per the spec's Explicitly Out of Scope, do not add Department/BU or Job Role fields to the response.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for user-management-console.T05` has produced Red tests for it, confirmed failing for the right reason.
