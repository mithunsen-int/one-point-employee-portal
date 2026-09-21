# Task: user-management-console.T03

**Implements:** `user-management-console.T03` — `POST /users` (`user-management-console.API01`): registration with Admin/HR-vs-Employee authority scoping, `dateOfJoining` requirement, `managerId` existence/role validation.

**Acceptance:** `user-management-console.AC1`, `user-management-console.AC2`, `user-management-console.AC3`, `user-management-console.AC4`, `user-management-console.AC6`, `user-management-console.AC11`. API Contract: `user-management-console.API01`. Full text in `.ai-context/specs/user-management-console.spec.md`. Implementation detail: `.ai-context/plans/user-management-console.plan.md`, Sequencing step 3.

**Scope — build only this:**
- The `POST /users` route handler: validates `username`/`password`/`dateOfJoining`/`role` are present and `role` is one of the six values (`AC6`); enforces Admin-can-register-any-of-six, HR-can-register-Employee-only, all others blocked (`AC1`–`AC4`); requires `managerId` when `role: "Employee"` and validates it references an existing `Manager`-role user, 404 otherwise (`AC11`).
- Calls `T02`'s hashing utility to produce `passwordHash` — do not reimplement hashing here.

**Do not touch:**
- `T01`'s schema, `T02`'s hashing utility internals (only call it).
- Edit/delete/list/detail endpoints (`T04`, `T05`) — this task is registration only.
- `POST /admin/self-register` (`T06`) — a separate, deliberately unauthenticated endpoint with its own rules; do not merge its logic into this handler.
- HR's authority over the other five roles beyond Employee — per the spec, still explicitly out of scope; do not extend HR's registration authority beyond what `AC1`–`AC4` state.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for user-management-console.T03` has produced Red tests for it, confirmed failing for the right reason.
