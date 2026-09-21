# Spec: Centralized Application Constants Management

## Spec ID

application-constants-management

## Status

In QA

## Linked BRD

.ai-context/BRD.md#BRD-005

## Intent

Every static reference value in the system except Department/BU and Job Role (owned by `org-structure-management`) must be defined in exactly one place per layer — a dedicated, single-source JavaScript module in the frontend codebase and a separate dedicated module in the backend codebase — so that no reference value is ever hardcoded or duplicated across files, and changing one requires only a code change and redeployment, never a runtime or admin action.

## Context

- Builds on: .ai-context/architecture.md — no service/API module; this is a codebase-organization requirement realized as plain JavaScript modules in each layer, not a runtime component.
- Non-blocking contrast note (no functional dependency either way): .ai-context/specs/org-structure-management.spec.md — Departments/BUs and Job Roles are the explicit exception, owned there instead. Neither spec's implementation depends on the other; this note exists only so the two aren't conflated.
- Related (forward, not yet drafted): `internal-transfer-workflow.spec.md` — will import the backend module directly to validate the transfer request's Location field, and the frontend module to populate the Location dropdown; not via any API, since this feature has none.
- API contract (if consuming an external one): None — this feature exposes no API and consumes none.

No API Contract section is included — this feature has no API surface (per #11.3's conditional rule); consumers import the modules directly, in-process.

## Acceptance Criteria

1. application-constants-management.AC1 — Given a reference value used anywhere in the frontend (e.g., Location options), it is defined in exactly one dedicated frontend constants module — never hardcoded or duplicated in a component, hook, or another file.
2. application-constants-management.AC2 — Given a reference value used anywhere in the backend (e.g., validating a submitted Location), it is defined in exactly one dedicated backend constants module — never hardcoded or duplicated in a route handler, service, or another file.
3. application-constants-management.AC3 — Given Department/BU or Job Role values, they are never defined in either constants module — those remain owned exclusively by `org-structure-management`.
4. application-constants-management.AC4 — Given a reference value needs to change (add, remove, or edit an option), the only required action is editing the relevant module's source and redeploying — no database migration, no runtime config file edit, and no admin-facing UI action exists for this.
5. application-constants-management.AC5 — Given the frontend and backend constants modules, each is independently authoritative for its own layer — this spec does not require them to be generated from, or synchronized against, one shared definition. _(Per BRD-005's own open item, this is the assumed reading absent confirmation otherwise.)_

## Unit Test Cases (spec-derived)

| Test ID                               | Maps to AC | Scenario                                                                                        | Expected                                                                         |
| ------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| application-constants-management.UT01 | AC1        | Import the frontend constants module's Location export                                          | Returns the expected, complete set of values                                     |
| application-constants-management.UT02 | AC2        | Import the backend constants module's Location export and validate a submitted value against it | Valid value accepted; value outside the set rejected                             |
| application-constants-management.UT03 | AC3        | Inspect both constants modules for `department` or `jobRole` keys                               | Absent from both — not defined here                                              |
| application-constants-management.UT04 | AC4        | Add a new Location option by editing the module source                                          | New value available after redeploy; no other change required                     |
| application-constants-management.UT05 | AC5        | Compare frontend and backend Location value sets after independently editing only one module    | No automatic sync occurs — divergence is possible and not prevented by this spec |

## Explicitly Out of Scope

- Departments/BUs and Job Roles — explicitly excluded; owned entirely by `org-structure-management` (BRD-004/BRD-005 contrast).
- Any runtime or admin-facing update path for these values — explicitly excluded by BRD-005's Business Need; all changes go through code change and redeployment.
- Synchronization/generation tooling to keep the frontend and backend modules consistent with each other — not stated in BRD-005; per `AC5`, each module is independently authoritative, and this spec does not build a mechanism to prevent the two from drifting apart.
- The complete enumerated list of which reference values belong in these modules beyond Location — not confirmed anywhere in the SOW; this spec's ACs apply generically to whatever values are placed in either module, so the catalog's completeness doesn't block this spec.
- Lint/validation tooling to detect a hardcoded duplicate value outside these modules — not stated in BRD-005; a plan-stage/tooling decision, not a spec-level acceptance criterion.

## Non-Functional Constraints (from constitution.md)

- Departments/BUs and Job Roles are DB-backed CRUD entities; all other static reference values are codebase-defined constants — a plan may not blur this distinction (Architectural Constraints).
- No new datastore or service is introduced by this spec — the constants live in code, not MongoDB, not a runtime file (Architectural Constraints).
- No employee personal data is involved; no PII-in-logs concern (Security Posture).
- No authentication/authorization applies to this feature — there is no API surface for `rbac-api-security` to gate (Security Posture — an explicit absence, not an oversight).
- constitution.md states no numeric coverage floor and no numeric latency/availability targets exist yet — this spec does not invent one (Non-Functional Baselines).
