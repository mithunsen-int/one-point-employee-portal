# Plan: Transfer Request Audit Trail

## Derived From
.ai-context/specs/transfer-audit-trail.spec.md (Status: Approved)

## Architecture Approach

- **Audit Logging Service** (existing module, `architecture.md`) — this plan's sole home.
- **`API01` (append) is invoked internally, in-process, by `internal-transfer-workflow`'s shared audit-log helper** (named in that plan's Sequencing step 9) — not an HTTP call, consistent with this project's established cross-service pattern (direct calls/queries, not internal HTTP hops).
- **`API02` (read) authorizes the "requesting Employee" case via a direct Mongoose query against `TransferRequests.employeeId`** (owned by `internal-transfer-workflow`) — comparing it to the caller's identity from their JWT claims. Admin's authorization is a simple role check, no cross-query needed.

## Data Model

**New collection: `AuditLogs`.**

| Field | Type | Notes |
|---|---|---|
| `transferRequestId` | ObjectId (ref `TransferRequests`), indexed | Indexed for efficient per-request lookup (`API02`) |
| `actorId` | ObjectId (ref `Users`) | |
| `actorRole` | String, snapshotted | The actor's role **at the time of the action**, not looked up live from `Users` — if a user's role changes later, the historical entry must still reflect what role they held when they acted. This is the same snapshotting principle `internal-transfer-workflow.plan.md` applied to `assignedManagerId`, for the same reason: an audit trail that silently reinterprets history isn't one. |
| `action` | String | One of a fixed set matching `internal-transfer-workflow`'s transitions (e.g., `submitted`, `manager_approved`, `manager_rejected`, `hr_approved`, `hr_rejected`, `payroll_task_completed`, `it_task_completed`, `facilities_task_completed`, `hr_final_mapping`, `withdrawn`) |
| `timestamp` | Date | |

**Decision — append-only is enforced at the model layer, not just by omission.** Beyond simply not exposing an update/delete route (`AC2`), the Mongoose model registers `pre('findOneAndUpdate')` and `pre('deleteOne')`/`pre('deleteMany')` hooks that throw, so a future engineer cannot accidentally introduce a mutation path without deliberately removing an explicit guard first. This is a plan-level decision beyond what the spec strictly requires, made because "no code path may update or delete an existing entry" (constitution.md) is exactly the kind of rule that's cheap to enforce defensively and expensive to violate by accident later.

**No TTL/expiry index is added** — retention period is unstated anywhere (spec's own Explicitly Out of Scope), so records are retained indefinitely by default; stated explicitly so a future reader doesn't assume an index was simply forgotten.

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first for every endpoint/state-changing op (Testing Discipline) | ✓ | Both the append path and `API02` get Red tests before implementation. |
| Jest + RTL (Testing Discipline) | ✓ | Backend-only plan; Jest covers it. RTL is N/A — no UI component is built by this plan. |
| Mongoose schema validators tested (Testing Discipline) | ✓ | The update/delete-blocking hooks are tested directly (an attempted mutation must throw), not just documented. |
| Coverage floor (Testing Discipline) | ✓ | constitution.md states none is set yet; this plan doesn't invent one. |
| Audit records immutable, append-only (Security Posture) | ✓ | This is the plan's core deliverable — enforced at the model layer, per the Data Model decision above. |
| Actor identified by ID/role, not raw personal data (Security Posture) | ✓ | `actorId`/`actorRole` only — no name, email, or other personal fields stored in an entry. |
| Role-based authorization enforced server-side (Security Posture) | ✓ | `API02` is gated by the existing `rbac-api-security` middleware plus the request-ownership check above. |
| MongoDB sole datastore (Architectural Constraints) | ✓ | `AuditLogs` is a new collection, not a new datastore. |
| No client-supplied object into a Mongoose filter unvalidated (Security Posture) | ✓ | `API02`'s lookup is a typed, single-field `transferRequestId` query. |
| No new datastore/state lib/external integration without ADR (Architectural Constraints) | ✓ | None introduced. |
| No numeric latency/availability/RPO/RTO targets invented (Non-Functional Baselines) | ✓ | None stated in constitution.md; none invented here — including no retention period, per the Data Model note above. |

**Rate limit decisions:**
- `API01` (append): N/A — internal, in-process call, not a client-facing endpoint at all.
- `API02` (`GET /transfer-requests/{id}/audit-log`): Rate limit: **none, deferred** — authenticated, ownership/role-gated read, not a public-facing surface.

## Explicitly Deferred

- Whether audit scope extends to `user-management-console`/`org-structure-management` CRUD actions, or is limited to transfer-request lifecycle actions only — per spec's Explicitly Out of Scope, still a genuinely open architectural question. This plan builds only transfer-request-scoped logging; extending it later would be a spec amendment and a new plan section, not something this plan silently anticipates.
- Retention period, export tooling — per spec, out of scope; no TTL index, no export endpoint.
- Whether a Manager or HR reviewer (as opposed to only the requesting Employee and Admin) can view a request's full audit log — per spec, out of scope; `API02`'s authorization is exactly Employee-owns-request-or-Admin, nothing broader.

## Sequencing

1. `AuditLogs` Mongoose schema — fields per the Data Model above, `transferRequestId` index, and the update/delete-blocking middleware guards.
2. Internal append function (`API01`) — the target `internal-transfer-workflow`'s shared audit-log helper calls after every successful transition.
3. `GET /transfer-requests/{id}/audit-log` (`API02`) — Employee-owns-request-or-Admin authorization, returns all entries for that request.
