# Task: application-constants-management.T01

**Implements:** `application-constants-management.T01` — backend constants module (`src/services/constants/referenceValues.ts`) with the initial `location` field.

**Acceptance:** `application-constants-management.AC2`, `AC3`, `AC4`. Full text in `.ai-context/specs/application-constants-management.spec.md`. Implementation detail: `.ai-context/plans/application-constants-management.plan.md`, Sequencing step 1.

**Scope — build only this:**
- A plain TypeScript module exporting a `location` constant (array of values) — this is the single source of truth for backend-side validation (e.g., `internal-transfer-workflow.API01` imports it directly, not via any API call).
- Never define `department` or `jobRole` keys here (`AC3`) — those are owned by `org-structure-management`.

**Do not touch:**
- The frontend module (`T02`) — a deliberately separate file; do not import from or reference it.
- No API route, no database schema, no Mongoose model — this is a plain code module, not a runtime service.
- `internal-transfer-workflow`'s validation logic that will eventually import this module — that's that spec's own task, not this one.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for application-constants-management.T01` has produced Red tests for it, confirmed failing for the right reason.
