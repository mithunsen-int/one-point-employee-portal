# Task: user-management-console.T04

**Implements:** `user-management-console.T04` — `PATCH /users/{id}` (`API02`), `DELETE /users/{id}` (`API03`): edit and soft-delete, Admin-any / HR-Employee-only scoping.

**Acceptance:** `user-management-console.AC7`, `user-management-console.AC8`, `user-management-console.AC12`, `user-management-console.AC13`. API Contract: `user-management-console.API02`, `user-management-console.API03`. Full text in `.ai-context/specs/user-management-console.spec.md`. Implementation detail: `.ai-context/plans/user-management-console.plan.md`, Sequencing step 4.

**Scope — build only this:**
- `PATCH /users/{id}`: Admin may edit any user's account fields (`AC7`); HR may edit Employee-role records only, identically to Admin's authority over that record (`AC12`); HR attempting a non-Employee record gets 403 (`AC13`).
- `DELETE /users/{id}`: soft-delete only — sets `deletedAt`, per `T01`'s schema, never a physical removal. Same Admin-any / HR-Employee-only scoping as edit.

**Do not touch:**
- `T01`'s schema, `T03`'s registration logic.
- List/detail views (`T05`) — this task is edit/delete only, even though it shares the same Admin/HR scoping rule with `T05`.
- Whether an Admin can delete their own account — per the spec, explicitly undecided; do not add a special guard against self-deletion, and do not silently permit it as if it were a business decision made here.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for user-management-console.T04` has produced Red tests for it, confirmed failing for the right reason.
