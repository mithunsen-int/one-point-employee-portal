# Plan: Transfer Administrative Oversight

## Derived From
.ai-context/specs/transfer-admin-oversight.spec.md (Status: Approved)

## Architecture Approach

- **No new service module** — confirmed by the spec itself. This plan implements three read-only aggregation endpoints directly against collections owned elsewhere: `Users` (`user-management-console`), `TransferRequests` (`internal-transfer-workflow`), `AuditLogs` (`transfer-audit-trail`).
- **All cross-service reads are direct Mongoose queries/aggregations, not internal HTTP calls** — same established pattern as every other plan in this project. Concretely, `API03`'s action history is a direct `AuditLogs.find({ transferRequestId })` query, not an internal call to `transfer-audit-trail.API02`'s HTTP route (which carries its own Employee-owns-request-or-Admin authorization that doesn't apply here — this endpoint is Admin-only by its own contract).

## Data Model

**N/A — no new collection.** Purely read/aggregate queries against existing collections; nothing is written by this plan.

**Decision — dashboard `userCounts` (`API01`) excludes soft-deleted users.** `AC1` doesn't explicitly say this, but `API04`'s list view (`user-management-console`) already excludes `deletedAt`-set users from "the active list," and a dashboard count that included deleted accounts would be misleading. Stated explicitly as a plan-level decision, not assumed silently.

**Decision — `totalTransferRequests` and `statusBreakdown` (`API01`) count every request regardless of terminal status.** `AC2` says "total transfer request count" without qualification; read here as literally every document in `TransferRequests` (including `Rejected`/`Withdrawn`/`Completed`), consistent with "a breakdown across every status" implying the total is the sum across all of them, not just in-flight ones.

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first for every endpoint/state-changing op (Testing Discipline) | ✓ | All 3 endpoints get Red tests before implementation, even though none is state-changing (read-only). |
| Jest + RTL (Testing Discipline) | ✓ | Backend-only plan; Jest covers it. RTL is N/A — no UI component is built by this plan. |
| Mongoose schema validators tested (Testing Discipline) | N/A | No new schema is introduced by this plan. |
| Coverage floor (Testing Discipline) | ✓ | constitution.md states none is set yet; this plan doesn't invent one. |
| No PII/personal data beyond what's already exposed (Security Posture) | ✓ | `API03`'s detail view surfaces exactly what `internal-transfer-workflow.API01`'s payload and `transfer-audit-trail`'s entries already expose — nothing new. |
| Role-based authorization enforced server-side (Security Posture) | ✓ | All 3 endpoints are Admin-only via the existing `rbac-api-security` middleware — not reimplemented here. |
| MongoDB sole datastore (Architectural Constraints) | ✓ | No new collection; reads existing ones only. |
| No client-supplied object into a Mongoose filter unvalidated (Security Posture) | ✓ | `API03`'s lookup is a typed, single-field `id` query; `API01`/`API02` take no client-supplied filter at all. |
| No new datastore/state lib/external integration without ADR (Architectural Constraints) | ✓ | None introduced. |
| No numeric latency/availability/RPO/RTO targets invented (Non-Functional Baselines) | ✓ | None stated in constitution.md; none invented here. |

**Rate limit decisions:** `API01`–`API03`: Rate limit: **none, deferred** — all three are Admin-only, authenticated internal dashboard/monitoring actions, not a public-facing surface.

## Explicitly Deferred

- Filtering/search on `API02`'s monitoring list — per spec, out of scope; this plan implements an unfiltered `find({})`.
- Real-time/push refresh for `API01`'s dashboard counts — per spec, out of scope; this plan implements a plain pull-based aggregation on each request, no caching or streaming layer.
- Export of monitoring/dashboard data — per spec, out of scope.

## Sequencing

1. `GET /admin/dashboard` (`API01`) — `userCounts` aggregation (grouped by role, excluding Admin per `AC1` and excluding soft-deleted users per the decision above), `totalTransferRequests` + `statusBreakdown` aggregation over `TransferRequests.status`.
2. `GET /admin/transfer-requests` (`API02`) — unfiltered list of all transfer requests.
3. `GET /admin/transfer-requests/{id}` (`API03`) — request detail plus its full audit history, via a direct `AuditLogs` query.
