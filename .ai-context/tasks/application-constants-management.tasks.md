# Tasks: Centralized Application Constants Management

## Derived From
.ai-context/plans/application-constants-management.plan.md

## Sequence
- [x] application-constants-management.T01 — Backend constants module (`src/services/constants/referenceValues.ts`) with the initial `location` field — Acceptance: application-constants-management.AC2, application-constants-management.AC3, application-constants-management.AC4 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-19) — Location values are placeholders, real values still pending a product decision
- [x] application-constants-management.T02 — Frontend constants module (`src/shared/constants/referenceValues.ts`) with the same `location` field, defined independently — Acceptance: application-constants-management.AC1, application-constants-management.AC3, application-constants-management.AC4, application-constants-management.AC5 — **Merged** (Gate 2 reviewed by Test Reviewer, 2026-09-19) — all tasks now Merged, spec Status moved to `In QA`; Location values still placeholders, real values still pending a product decision

## Coverage Gaps
None identified — all 5 ACs (AC1–AC5) are covered by at least one task above. `AC3`/`AC4` apply to both modules and are covered by both tasks; `AC5` (independence) is confirmed once both modules exist, assigned to `T02` as the completing task.
