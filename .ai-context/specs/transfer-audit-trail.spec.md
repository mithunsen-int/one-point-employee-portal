# Spec: Transfer Request Audit Trail

## Spec ID
transfer-audit-trail

## Status
In QA

## Linked BRD
.ai-context/BRD.md#BRD-006

## Intent
Since the system has no SLA/escalation mechanism and a transfer request can remain pending indefinitely, an immutable, complete record of every actor/action/timestamp across the request's lifecycle is the compensating control for accountability. Every state-changing action defined in `internal-transfer-workflow` appends an audit entry that can never be modified or deleted, retrievable by the requesting Employee (their own request) and Admin (any request).

## Context
- Builds on: .ai-context/architecture.md (Audit Logging Service module)
- Related: .ai-context/specs/internal-transfer-workflow.spec.md (Status: Draft v1.0) — every transition it defines (`API01`–`API09`) is the source of audit entries here. This spec owns the storage/append contract; `internal-transfer-workflow.API02`'s `actionHistory` field is sourced from this spec's data, embedded inline for convenience — `transfer-audit-trail.API02` below is the same underlying data as a standalone endpoint.
- Related: .ai-context/specs/rbac-api-security.spec.md (Status: Plan Drafted, past Approved) — read access is gated per that spec's contract.
- Related (forward, not yet drafted): `transfer-admin-oversight.spec.md` — will consume this spec's data for the Admin detailed-request view's full action history.

## API Contract

### transfer-audit-trail.API01 — Append an audit entry (cross-cutting, internal)
**Request payload:** N/A — invoked internally by other services (currently only `internal-transfer-workflow`) whenever they complete a state-changing operation on a transfer request. Not a client-facing endpoint.
**Behavior:** Creates one entry recording `actor` (user id and role), `action` (the transition that occurred), and `timestamp`. No code path may update or delete an existing entry — append-only.

### transfer-audit-trail.API02 — GET /transfer-requests/{id}/audit-log (read a request's audit entries)
**Success response (200):** `[{ "actor": "string", "action": "string", "timestamp": "string" }]`
**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 403 | Requested by anyone other than the requesting Employee or an Admin | `{ "error": { "code": "FORBIDDEN", "message": "string" } }` |
| 404 | `id` does not match an existing transfer request | `{ "error": "not_found" }` |

## Acceptance Criteria
1. transfer-audit-trail.AC1 — Given any state-changing action defined in `internal-transfer-workflow` (submit, Manager decision, HR decision, any parallel task completion, final mapping, withdrawal), when that action completes successfully, then an audit entry recording the actor, the action, and the timestamp is appended.
2. transfer-audit-trail.AC2 — Given an existing audit entry, no code path may update or delete it — entries are append-only.
3. transfer-audit-trail.AC3 — Given the requesting Employee, when they request their own transfer request's audit log, then the system returns all entries for that request.
4. transfer-audit-trail.AC4 — Given an Admin, when they request any transfer request's audit log, then the system returns all entries for that request.
5. transfer-audit-trail.AC5 — Given a user with any role other than the requesting Employee or Admin, when they request a transfer request's audit log, then the system rejects the request with 403.
6. transfer-audit-trail.AC6 — Given a transfer request `id` that doesn't exist, when its audit log is requested, then the system responds 404.

## Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| transfer-audit-trail.UT01 | AC1 | Employee submits a transfer request | Audit entry appended: actor=Employee, action="submitted", timestamp set |
| transfer-audit-trail.UT02 | AC1 | Manager approves a request | Audit entry appended: actor=Manager, action="approved", timestamp set |
| transfer-audit-trail.UT03 | AC2 | Attempt to modify or delete an existing audit entry directly | Rejected/not possible — no update or delete path exists |
| transfer-audit-trail.UT04 | AC3 | Requesting Employee reads their own request's audit log | 200; all entries returned |
| transfer-audit-trail.UT05 | AC4 | Admin reads another employee's request's audit log | 200; all entries returned |
| transfer-audit-trail.UT06 | AC5 | A different Employee (not the requester) attempts to read the audit log | 403 |
| transfer-audit-trail.UT07 | AC6 | Audit log requested for a non-existent request `id` | 404 |

## Explicitly Out of Scope
- Audit logging for `user-management-console` or `org-structure-management` actions (user/department/job-role CRUD) — not mentioned anywhere in the SOW, and neither of those specs declares an audit requirement of its own. **Whether this spec's scope should extend to cover them is a genuinely open architectural question, not decided here.**
- Retention period for audit records — not stated anywhere in BRD-006/SOW; per constitution.md, records are retained indefinitely absent a stated period.
- Export of audit data — not stated; SOW's exclusion of "reporting/analytics beyond basic counts" suggests view-only, but this isn't explicit enough to treat as decided.
- Whether the acting Manager or HR reviewer can view a request's full audit log (as opposed to just performing their own action) — not stated; scoped here to Employee (own) and Admin (any) only, per what BRD-006 and BRD-002 actually decided.

## Non-Functional Constraints (from constitution.md)
- Audit records are immutable and append-only — no code path may update or delete an existing entry, only append new ones (Security Posture).
- Audit entries identify the actor by user ID/role, not by logging raw personal data beyond what's needed for accountability (Security Posture).
- MongoDB is the sole approved datastore (Architectural Constraints).
- Role-based authorization is enforced server-side for `API02`, via `rbac-api-security`'s contract (Security Posture).
- constitution.md states no numeric retention period, coverage floor, or latency/availability targets exist yet — this spec does not invent one (Non-Functional Baselines).
