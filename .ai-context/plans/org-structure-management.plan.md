# Plan: Organizational Structure Management

## Derived From
.ai-context/specs/org-structure-management.spec.md (Status: Approved)

## Architecture Approach

- **Org Structure Service** (existing module, `architecture.md`) — this plan's sole home. Two independent, structurally identical CRUD resources: Departments and Job Roles.
- **No new module is introduced.** Authorization (Admin-only for every endpoint) is enforced entirely by the existing Auth/RBAC middleware (`rbac-api-security.plan.md`) — not reimplemented here.
- No cross-service reads are needed to build this plan's own endpoints — Departments and Job Roles are self-contained CRUD. (They are read by other specs — `internal-transfer-workflow`, `application-constants-management`'s contrast — but consuming them is those specs' concern, not this plan's.)

## Data Model

Two new collections (new collections within the already-approved MongoDB datastore, not a new datastore — no ADR triggered):

| Collection | Field | Type | Notes |
|---|---|---|---|
| `Departments` | `name` | String, unique | Enforced via a Mongoose unique index; `API01`/`API02`'s 409 on duplicate is this constraint surfaced as an application-level error, not a raw driver exception leaking to the client |
| `JobRoles` | `title` | String, unique | Same pattern as `Departments.name` |

Both schemas are otherwise minimal — `id` and the one uniquely-constrained field — since the spec defines no other fields for either entity (detail views, `API05`/`API10`, remain undecided and are not built by this plan; see Explicitly Deferred).

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first for every endpoint/state-changing op (Testing Discipline) | ✓ | All 8 built endpoints (`API01`–`API04`, `API06`–`API09`) get Red tests before implementation. |
| Jest + RTL (Testing Discipline) | ✓ | Backend-only plan; Jest covers it. RTL is N/A — no UI component is built by this plan. |
| Mongoose schema validators tested (Testing Discipline) | ✓ | The unique-index constraint on `Departments.name`/`JobRoles.title` is tested directly (duplicate insert is rejected), not just documented. |
| Coverage floor (Testing Discipline) | ✓ | constitution.md states none is set yet; this plan doesn't invent one. |
| Role-based authorization enforced server-side (Security Posture) | ✓ | Delegated entirely to the existing `rbac-api-security` middleware; every endpoint here is Admin-only per the spec. |
| MongoDB sole datastore (Architectural Constraints) | ✓ | Both are new collections, not a new datastore. |
| No client-supplied object into a Mongoose filter unvalidated (Security Posture) | ✓ | Every lookup is a typed, single-field `id` query — never a spread of raw request-body content into a filter. |
| Departments/Roles are DB-backed CRUD, never moved into the codebase-constants approach (Architectural Constraints) | ✓ | This plan builds exactly that — a live, database-backed pair of collections, consistent with the BRD-004/BRD-005 contrast already documented in both specs. |
| No new datastore/state lib/external integration without ADR (Architectural Constraints) | ✓ | None introduced. |
| No numeric latency/availability/RPO/RTO targets invented (Non-Functional Baselines) | ✓ | None stated in constitution.md; none invented here. |

**Rate limit decisions:** `API01`–`API04`, `API06`–`API09`: Rate limit: **none, deferred** — every endpoint is authenticated, Admin-only, and low-volume administrative CRUD, not a public-facing or credential-guessing surface. Stated explicitly per the full endpoint set rather than silently omitted.

## Explicitly Deferred

- `API05`/`API10` (detailed views) — per spec, the SOW marks these "Optional" without deciding them; this plan does not build either.
- The effect of deleting a Department/Job Role already referenced by a transfer request (in-flight or historical) — per spec's Explicitly Out of Scope, genuinely undecided; `internal-transfer-workflow.plan.md` validates `departmentId`/`jobRoleId` existence only at submission time and does not address post-submission deletion either. This plan does not invent a resolution — it remains an open cross-spec question, not silently assumed away.
- Bulk import/export, reporting/analytics on org structure — per spec, out of scope.

## Sequencing

1. `Departments` Mongoose schema (unique `name`) + full CRUD (`API01` create, `API02` edit, `API03` delete, `API04` list).
2. `JobRoles` Mongoose schema (unique `title`) + full CRUD (`API06` create, `API07` edit, `API08` delete, `API09` list) — structurally identical to step 1, built as a separate task since it's a distinct collection.
