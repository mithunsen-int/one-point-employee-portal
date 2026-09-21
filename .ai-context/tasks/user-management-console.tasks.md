# Tasks: User Management Console

## Derived From
.ai-context/plans/user-management-console.plan.md

## Sequence
- [x] user-management-console.T01 — `Users` Mongoose schema: all fields, `username` unique index, `{ role: "Admin", deletedAt: null }` partial unique index — Acceptance: user-management-console.AC5, user-management-console.AC15 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-18)
- [x] user-management-console.T02 — Password hashing utility (bcrypt, 12 salt rounds), wired into every write path that sets `passwordHash` — Acceptance: user-management-console.AC1, user-management-console.AC14 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-18)
- [x] user-management-console.T03 — `POST /users` (API01): registration with Admin/HR-vs-Employee authority scoping, `dateOfJoining` requirement, `managerId` existence/role validation — Acceptance: user-management-console.AC1, user-management-console.AC2, user-management-console.AC3, user-management-console.AC4, user-management-console.AC5, user-management-console.AC6, user-management-console.AC11 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-18)
- [x] user-management-console.T04 — `PATCH /users/{id}` (API02), `DELETE /users/{id}` (API03): edit and soft-delete, Admin-any / HR-Employee-only scoping — Acceptance: user-management-console.AC7, user-management-console.AC8, user-management-console.AC12, user-management-console.AC13 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-18 — reviewer knowingly accepted the flagged `role: "Admin"` guard gap as open, non-blocking; not yet fixed, worth a future follow-up)
- [x] user-management-console.T05 — `GET /users` (API04), `GET /users/{id}` (API05): list and detail views, same Admin/HR scoping — Acceptance: user-management-console.AC9, user-management-console.AC10, user-management-console.AC12, user-management-console.AC13 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-18)
- [x] user-management-console.T06 — `POST /admin/self-register` (API06): unauthenticated bootstrap endpoint, its own rate limit, single-Admin invariant enforced by T01's database index — Acceptance: user-management-console.AC14, user-management-console.AC15 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-19) — all 6 tasks now Merged, spec Status moved to `In QA`
- [x] user-management-console.T07 — `GET /users` (API04) `role=Manager` carve-out for HR — Acceptance: user-management-console.AC13 (amended 2026-09-20, Gate 1 re-confirmed 2026-09-20). Added after discovering, while auditing `stakeholder-panel-ui.T07`–`T11`'s remaining blockers, that `stakeholder-panel-ui.T11`'s already-approved Manager-selector requirement was impossible for HR to satisfy — the endpoint hardcoded `role: "Employee"` for any HR caller, with no way to request Manager records at all. Red confirmed (2 new tests failed — 403 became reachable-but-wrong-shape/200 instead of the intended 400, and the Manager-filter case returned the default Employee-only list instead of Manager records), then Green — full suite 574/574. **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-20).

## Open Items (not any single task's scope)
`PATCH /users/{id}` (`T04`) can set `role: "Admin"` with no guard, a path around this spec's own `API06` bootstrap flow when no Admin yet exists. Flagged at `T04`'s Gate 2, knowingly accepted (not fixed) by the reviewer there, restated at `T05` and `T06`. Still open as this spec reaches `In QA` — worth a small follow-up task.

## Coverage Gaps
None identified — all 15 ACs (AC1–AC15) are covered by at least one task above. `T07`'s `AC13` amendment (2026-09-20) is covered by `T07` itself.
