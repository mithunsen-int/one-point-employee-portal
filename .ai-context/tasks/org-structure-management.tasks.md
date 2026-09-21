# Tasks: Organizational Structure Management

## Derived From
.ai-context/plans/org-structure-management.plan.md

## Sequence
- [x] org-structure-management.T01 — `Departments` Mongoose schema (unique `name`) + full CRUD (API01–API04) — Acceptance: org-structure-management.AC1, org-structure-management.AC2, org-structure-management.AC3, org-structure-management.AC4, org-structure-management.AC5, org-structure-management.AC6, org-structure-management.AC13 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-19)
- [x] org-structure-management.T02 — `JobRoles` Mongoose schema (unique `title`) + full CRUD (API06–API09) — Acceptance: org-structure-management.AC7, org-structure-management.AC8, org-structure-management.AC9, org-structure-management.AC10, org-structure-management.AC11, org-structure-management.AC12, org-structure-management.AC13 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-19) — all tasks now Merged, spec Status moved to `In QA`
- [x] org-structure-management.T03 — Relax `GET /departments` and `GET /job-roles` from Admin-only to any authenticated role — Acceptance: org-structure-management.AC6, org-structure-management.AC12 (neither AC ever required Admin-only reads; only `AC2`/`AC8` restrict create/edit/delete) — added 2026-09-20, found while scoping `stakeholder-panel-ui.T04`: an Employee submitting a transfer request needs to read both lists to populate required dropdowns, but both were implemented (not specified) as Admin-only via `withAuthorization("admin.departmentRoleManagement", ...)`. **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-20) — all 3 tasks now Merged, spec Status returned to `In QA`.

## Coverage Gaps
None identified — all 13 ACs (AC1–AC13) are covered by at least one task above. `AC13` (missing-field validation) applies to both entities and is covered by both tasks.
