# Plan: Centralized Application Constants Management

## Derived From
.ai-context/specs/application-constants-management.spec.md (Status: Approved)

## Architecture Approach

- **No existing or new service module applies.** This is a codebase-organization requirement, not an API-layer feature — confirmed by the spec itself (no API Contract section).
- **Two plain TypeScript modules, one per layer, per `int-standards.nextjs.md`'s project structure:**
  - Backend: `src/services/constants/referenceValues.ts` — imported by API route handlers for server-side validation (e.g., `internal-transfer-workflow`'s Location field check).
  - Frontend: `src/shared/constants/referenceValues.ts` — imported by client components for dropdown rendering (e.g., the transfer request form's Location select).
- **Deliberately two separate files, not one shared module imported by both sides** — even though Next.js's single-codebase structure would technically allow one shared file to be imported by both client and server code. The spec's `AC5` already decided the two modules are independently authoritative, per BRD-005's "dedicated... modules within each layer" wording; this plan does not silently collapse that decision into a simpler shared-file design.

## Data Model

**N/A.** No MongoDB collection, no Mongoose schema, no database interaction of any kind — confirmed explicitly by the spec's Non-Functional Constraints ("No new datastore or service is introduced"). The two constants modules are plain exported objects/arrays, not persisted data.

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first (Testing Discipline) | ✓ | No API endpoint or state-changing operation exists here, so the literal rule doesn't apply — but Jest unit tests for `AC1`–`AC5` (module exports, absence of Department/Job Role keys) are still written before the modules' final content, per this project's standing test-first flow for every task. |
| Jest + RTL (Testing Discipline) | ✓ | Jest covers both modules' exports; RTL is N/A — no UI component is introduced by this plan (the modules are imported by other specs' components, not this one's). |
| Mongoose schema validators tested (Testing Discipline) | N/A | No schema exists. |
| Coverage floor (Testing Discipline) | ✓ | constitution.md states none is set yet; this plan doesn't invent one. |
| No PII/personal data in logs (Security Posture) | N/A | No logging occurs in this plan — static constant exports have no runtime logic to log. |
| Role-based authorization enforced server-side (Security Posture) | N/A | No API surface exists for `rbac-api-security` to gate — confirmed explicitly in the spec's Non-Functional Constraints. |
| MongoDB sole datastore (Architectural Constraints) | ✓ | No datastore introduced at all, let alone a non-MongoDB one. |
| Departments/Roles vs. codebase-constants distinction (Architectural Constraints) | ✓ | This plan's modules never define `department` or `jobRole` keys (`AC3`) — enforced by a unit test, not just documentation. |
| No new datastore/state lib/external integration without ADR (Architectural Constraints) | ✓ | None introduced. |
| No numeric latency/availability/RPO/RTO targets invented (Non-Functional Baselines) | ✓ | None stated in constitution.md; none invented here. |

**Rate limit decisions:** N/A for every rule in this table that would normally require one — this spec defines zero API endpoints, so there is nothing to rate-limit. Stated explicitly rather than silently omitted, per this workflow's own requirement.

## Explicitly Deferred

- Synchronization/generation tooling between the two modules — per spec's Explicitly Out of Scope (`AC5`); this plan builds two independently-maintained files, not a shared-source build step.
- Lint/validation tooling to catch a hardcoded duplicate value elsewhere in the codebase — per spec's Explicitly Out of Scope; a future tooling decision, not built here.
- The complete field catalog beyond Location — this plan populates Location in both modules (the one field confirmed by the SOW); additional fields are added the same way, later, as they're identified, without needing a new plan.
- Wiring `internal-transfer-workflow`'s Location validation/dropdown to actually import from these modules — that integration point is named here for traceability, but the import statements themselves are that spec's own task, not this plan's.

## Sequencing

1. Create the backend constants module (`src/services/constants/referenceValues.ts`) with the initial `location` field and its values.
2. Create the frontend constants module (`src/shared/constants/referenceValues.ts`) with the same `location` field and values, defined independently — not imported from the backend module.
