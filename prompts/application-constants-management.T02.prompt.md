# Task: application-constants-management.T02

**Implements:** `application-constants-management.T02` — frontend constants module (`src/shared/constants/referenceValues.ts`) with the same `location` field, defined independently.

**Acceptance:** `application-constants-management.AC1`, `AC3`, `AC4`, `AC5`. Full text in `.ai-context/specs/application-constants-management.spec.md`. Implementation detail: `.ai-context/plans/application-constants-management.plan.md`, Sequencing step 2.

**Scope — build only this:**
- A plain TypeScript module exporting a `location` constant (array of values) — this is the single source of truth for the frontend dropdown UI.
- **Deliberately does not import from `T01`'s backend module**, even though both currently hold the same values — this is `AC5`'s decided design (each layer independently authoritative), not an oversight to "fix" by sharing a single file.

**Do not touch:**
- The backend module (`T01`) — do not import from it, do not create a shared source either module pulls from.
- No API route, no server-side code — this module is imported only by client components.
- The transfer-request form's dropdown UI itself (whichever spec builds it) — that's a separate task's job; this task only provides the values it will consume.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for application-constants-management.T02` has produced Red tests for it, confirmed failing for the right reason.
