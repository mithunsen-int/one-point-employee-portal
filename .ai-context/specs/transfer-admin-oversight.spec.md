# Spec: Transfer Administrative Oversight

## Spec ID
transfer-admin-oversight

## Status
In QA

## Linked BRD
.ai-context/BRD.md#BRD-002

## Intent
Admin needs one consolidated view — organizational headcounts by role, total transfer request volume, a full status-wise breakdown, and the ability to inspect any individual request's complete action history — rather than tracking this manually, realized through the Admin Panel's Dashboard and Transfer Request Monitoring screens (BRD-002; SOW §2, §3.1.A.1, §3.1.A.5).

## Context
- Builds on: .ai-context/architecture.md — no new service module; this spec is a read-only aggregation layer over the existing Workflow Engine Service (request data), User Management Service (role counts), and Audit Logging Service (action history), surfaced through Admin Panel UI.
- Related: .ai-context/specs/internal-transfer-workflow.spec.md (Status: Draft v1.0) — the status-wise breakdown reuses that spec's `AC18` status vocabulary (`Pending: Manager`, `Pending: HR`, `Pending: Payroll, IT, Facilities`, `Rejected`, `Withdrawn`, `Completed`) directly, resolving BRD-002's original "which statuses" ambiguity rather than re-deciding it.
- Related: .ai-context/specs/transfer-audit-trail.spec.md (Status: Draft v1.0) — the detailed request view's full action history is that spec's `API02` data, surfaced here for Admin (already permitted by its `AC4`).
- Related: .ai-context/specs/user-management-console.spec.md (Status: Draft v1.0) — role counts are derived from that spec's user records.
- Related: .ai-context/specs/rbac-api-security.spec.md (Status: Plan Drafted, past Approved) — every endpoint here is Admin-only, per that spec's `AC9`.

## API Contract

### transfer-admin-oversight.API01 — GET /admin/dashboard (summary counts)
**Success response (200):**
```json
{
  "userCounts": { "Employee": 0, "HR": 0, "Manager": 0, "Payroll": 0, "IT": 0, "Facilities": 0 },
  "totalTransferRequests": 0,
  "statusBreakdown": {
    "Pending: Manager": 0, "Pending: HR": 0, "Pending: Payroll, IT, Facilities": 0,
    "Rejected": 0, "Withdrawn": 0, "Completed": 0
  }
}
```
**Exceptions:** 403 if requested by any role other than Admin.

### transfer-admin-oversight.API02 — GET /admin/transfer-requests (monitoring list)
**Success response (200):** `[{ "id": "string", "status": "string", "employeeId": "string", "submittedAt": "string" }]` — returns every transfer request; no filtering/search (see Explicitly Out of Scope).
**Exceptions:** 403 if requested by any role other than Admin.

### transfer-admin-oversight.API03 — GET /admin/transfer-requests/{id} (detailed view)
**Success response (200):** `{ "id", "status", request fields (per internal-transfer-workflow.API01's payload), "actionHistory": [...] }` — `actionHistory` sourced from `transfer-audit-trail.API02`.
**Exceptions:** 403 (non-Admin — distinct from the Employee's own-request view in `internal-transfer-workflow.API02`), 404 (`id` not found).

## Acceptance Criteria
1. transfer-admin-oversight.AC1 — Given an Admin, when they request the dashboard, then the system returns counts of Employee, HR, Manager, Payroll, IT, and Facilities users.
2. transfer-admin-oversight.AC2 — Given an Admin, when they request the dashboard, then the system returns the total transfer request count and a breakdown across every status defined in `internal-transfer-workflow.AC18`.
3. transfer-admin-oversight.AC3 — Given a user with any role other than Admin, when they request the dashboard, then the system rejects the request with 403.
4. transfer-admin-oversight.AC4 — Given an Admin, when they request the transfer request monitoring list, then the system returns every transfer request with its current status.
5. transfer-admin-oversight.AC5 — Given a user with any role other than Admin, when they request the monitoring list, then the system rejects the request with 403.
6. transfer-admin-oversight.AC6 — Given an Admin, when they request a specific transfer request's detailed view, then the system returns the request data and its full action history.
7. transfer-admin-oversight.AC7 — Given a user with any role other than Admin, when they request a transfer request's detailed view via this endpoint, then the system rejects the request with 403.
8. transfer-admin-oversight.AC8 — Given a transfer request `id` that doesn't exist, when its detailed view is requested, then the system responds 404.

## Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| transfer-admin-oversight.UT01 | AC1 | Admin requests the dashboard with 3 Employees, 1 HR, 2 Managers registered | 200; counts match |
| transfer-admin-oversight.UT02 | AC2 | Admin requests the dashboard with requests in various statuses | 200; totals and per-status breakdown match |
| transfer-admin-oversight.UT03 | AC3 | Employee requests the dashboard | 403 |
| transfer-admin-oversight.UT04 | AC4 | Admin requests the monitoring list | 200; all requests returned |
| transfer-admin-oversight.UT05 | AC5 | Manager requests the monitoring list | 403 |
| transfer-admin-oversight.UT06 | AC6 | Admin requests a specific request's detailed view | 200; request data + action history returned |
| transfer-admin-oversight.UT07 | AC7 | HR requests a specific request's detailed view via this endpoint | 403 |
| transfer-admin-oversight.UT08 | AC8 | Admin requests detail view for a non-existent request `id` | 404 |

## Explicitly Out of Scope
- Filtering/search on the monitoring list (by department, status, date range) — not stated in the SOW; `API02` returns every request unfiltered.
- Real-time vs. on-demand refresh behavior for dashboard counts — not stated; `API01` is a pull-based GET, not a push/streaming mechanism.
- Reporting/analytics beyond these basic counts — out of scope project-wide (SOW §10).
- Export of monitoring or dashboard data — not mentioned anywhere in the SOW.

## Non-Functional Constraints (from constitution.md)
- Every endpoint in this spec is Admin-only, enforced server-side via `rbac-api-security`'s contract (Security Posture).
- No employee personal or compensation data beyond what `internal-transfer-workflow`/`transfer-audit-trail` already expose is surfaced here (Security Posture).
- MongoDB is the sole approved datastore; this spec introduces no new collection — it reads from the `TransferRequests`, `Users`, and `AuditLogs` collections owned elsewhere (Architectural Constraints).
- constitution.md states no numeric coverage floor and no numeric latency/availability targets exist yet — this spec does not invent one (Non-Functional Baselines).
