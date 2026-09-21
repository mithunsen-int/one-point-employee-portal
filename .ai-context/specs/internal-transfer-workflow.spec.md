# Spec: Internal Transfer Workflow

## Spec ID
internal-transfer-workflow

## Status
In QA
*(Reopened `In QA` → `In Development` → `In QA` (`T11`) → `In Development` → `In QA` (`T12`) → `In Development` → `In QA` (`T13`), all same day, 2026-09-20. All 13 tasks now Merged.)*

## Linked BRD
.ai-context/BRD.md#BRD-001

## Intent
An Employee needs a governed, sequenced way to initiate an internal transfer that moves through Manager approval, HR eligibility validation and approval, three independent parallel execution tasks (Payroll, IT, Facilities), and a final HR manager-mapping step, ending in an in-app completion confirmation — replacing uncoordinated, ad hoc handling of transfers, under the explicit constraint that there is no SLA/escalation mechanism and a request may remain pending indefinitely (BRD-001; SOW §1, §2, §4).

## Context
- Builds on: .ai-context/architecture.md (Workflow Engine Service module)
- Related: .ai-context/specs/rbac-api-security.spec.md (Status: Plan Drafted, past Approved) — every action below is gated by role, per that spec's `AC3`–`AC8` (Employee/Manager/HR/Payroll/IT/Facilities permitted-action boundaries).
- Related: .ai-context/specs/user-management-console.spec.md (Status: Draft v1.0) — the acting user in every step is a record created there; this spec assumes that contract and does not re-decide it. Two terms used throughout this spec are defined by that spec's fields: "the assigned Manager" means the requesting Employee's `managerId`, and HR eligibility (`AC7`) is computed from `dateOfJoining` — both resolved 2026-09-10 (previously open here).
- Related: .ai-context/specs/org-structure-management.spec.md (Status: Draft v1.0) — the request's Department/BU and Job Role selections reference entities owned there.
- Related: .ai-context/specs/application-constants-management.spec.md (Status: Draft v1.0) — the request's Location field's allowed values are defined in that feature's backend constants module, imported directly for server-side validation (not fetched via API), and mirrored in the frontend's own constants module for the dropdown UI.
- Related (forward, not yet drafted): `transfer-audit-trail.spec.md`, `transfer-admin-oversight.spec.md` — will consume this spec's state transitions.
- Related: .ai-context/specs/stakeholder-panel-ui.spec.md (Status: Draft v1.0) — `API10` (added 2026-09-19) exists specifically because that spec's `AC4`/`AC6`–`AC9` need a way to discover which requests are relevant to the caller; this gap was found while scoping that spec's screens, after this spec had already reached `In QA`.

## API Contract

### internal-transfer-workflow.API01 — POST /transfer-requests (Employee submits)
**Request payload:** `{ "departmentId": "string", "location": "string", "jobRoleId": "string", "effectiveDate": "string (ISO date)", "reason": "string (optional)" }`
**Success response (201):** `{ "id": "string", "status": "Pending: Manager", "submittedAt": "string" }`
**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 400 | Missing/invalid `departmentId`, `location`, `jobRoleId`, or `effectiveDate` | `{ "error": "validation_error", "fields": ["string"] }` |
| 403 | Requested by any role other than Employee | `{ "error": { "code": "FORBIDDEN", "message": "string" } }` |
| 404 | `departmentId` or `jobRoleId` does not exist (per `org-structure-management`) | `{ "error": "not_found", "field": "string" }` |

### internal-transfer-workflow.API02 — GET /transfer-requests/{id} (status/history/pending stakeholders)
**Success response (200):** `{ "id", "status", "actionHistory": [...], "pendingStakeholders": [...] }`
**Exceptions:** 403 (requested by anyone other than the requesting Employee), 404 (`id` not found).

### internal-transfer-workflow.API03 — POST /transfer-requests/{id}/manager-decision
**Request payload:** `{ "decision": "approve | reject", "reason": "string (required if reject)" }`
**Success response (200):** `{ "id", "status": "Pending: HR" }` (approve) or `{ "id", "status": "Rejected" }` (reject)
**Exceptions:** 400 (`reason` missing on reject), 403 (non-Manager), 404, 409 (request not in `Pending: Manager`).

### internal-transfer-workflow.API04 — POST /transfer-requests/{id}/hr-decision
**Request payload:** `{ "decision": "approve | reject", "reason": "string (required if reject)" }`
**Success response (200):** `{ "id", "status": "Pending: Payroll, IT, Facilities" }` (approve — spawns three independent tasks) or `{ "id", "status": "Rejected" }` (reject)
**Exceptions:** 400 (`reason` missing on reject), 403 (non-HR), 404, 409 (request not in `Pending: HR`, or fewer than 90 days have elapsed since the employee's `dateOfJoining`, per `user-management-console`).

### internal-transfer-workflow.API05 — POST /transfer-requests/{id}/payroll-task
**Request payload:** `{ "action": "update | no_action_needed", "salary": "string (if update)", "compensation": "string (if update)", "tax": "string (if update)", "costCenter": "string (if update)" }`
**Success response (200):** `{ "id", "payrollTaskStatus": "Completed" }`
**Exceptions:** 403 (non-Payroll), 404, 409 (request not in `Pending: Payroll, IT, Facilities`, or Payroll task already `Completed`).

### internal-transfer-workflow.API06 — POST /transfer-requests/{id}/it-task
**Request payload:** `{ "systemsAccess": ["string"], "permissions": ["string"], "devices": ["string"] }`
**Success response (200):** `{ "id", "itTaskStatus": "Completed" }`
**Exceptions:** same shapes as API05, substituting the IT task.

### internal-transfer-workflow.API07 — POST /transfer-requests/{id}/facilities-task
**Request payload:** `{ "workspace": "string", "officeLogistics": "string", "locationSetup": "string" }`
**Success response (200):** `{ "id", "facilitiesTaskStatus": "Completed" }`
**Exceptions:** same shapes as API05, substituting the Facilities task.

### internal-transfer-workflow.API08 — POST /transfer-requests/{id}/hr-final-mapping
**Request payload:** `{ "newManagerId": "string" }`
**Success response (200):** `{ "id", "status": "Completed" }`
**Exceptions:** 403 (non-HR), 404, 409 (any of Payroll/IT/Facilities tasks not yet `Completed` — SOW §4 sequences the parallel block before final mapping, so all three completing first is treated as decided, not invented).

### internal-transfer-workflow.API09 — POST /transfer-requests/{id}/withdraw
**Success response (200):** `{ "id", "status": "Withdrawn" }`
**Exceptions:** 403 (requested by anyone other than the requesting Employee), 404, 409 (request not in `Pending: Manager`).

### internal-transfer-workflow.API10 — GET /transfer-requests/mine (requests relevant to the caller)
**Success response (200):**
```json
[
  {
    "id": "string",
    "status": "string",
    "employeeId": "string",
    "submittedAt": "string",
    "payrollTaskStatus": "Pending | Completed",
    "itTaskStatus": "Pending | Completed",
    "facilitiesTaskStatus": "Pending | Completed"
  }
]
```
Filtered server-side by the caller's role — no client-supplied filter parameter exists:
- Employee: every request they submitted (`employeeId` = caller), any status.
- Manager: requests where `assignedManagerId` = caller and status is `Pending: Manager`.
- HR: requests in `Pending: HR` (decision needed), plus requests in `Pending: Payroll, IT, Facilities` where all three task statuses are already `Completed` (final mapping needed) — HR has no per-request assignment (Context: "not stated... assumed as given context"), so this is every request currently actionable by any HR user, not a personal queue.
- Payroll: requests in `Pending: Payroll, IT, Facilities` where `payrollTaskStatus` is still `Pending`. IT and Facilities: the same pattern against their own task status field.

**Exceptions:** 403 if requested by Admin — Admin's equivalent, unfiltered view already exists at `transfer-admin-oversight.API02`/`API03`; this endpoint is not a second copy of that capability.

## Acceptance Criteria
1. internal-transfer-workflow.AC1 — Given an Employee, when they submit a transfer request with a valid Department/BU, Location, Job Role, and Effective Date, then the system creates the request with status `Pending: Manager` and responds 201.
2. internal-transfer-workflow.AC2 — Given a submission missing a required field, then the system responds 400 naming the missing field(s).
3. internal-transfer-workflow.AC3 — Given a user with any role other than Employee, when they attempt to submit a transfer request, then the system rejects it with 403.
4. internal-transfer-workflow.AC4 — Given a request in `Pending: Manager`, when the assigned Manager approves it, then status moves to `Pending: HR`.
5. internal-transfer-workflow.AC5 — Given a request in `Pending: Manager`, when the assigned Manager rejects it with a reason, then status moves to `Rejected` and the request is permanently closed.
6. internal-transfer-workflow.AC6 — Given a Manager rejection with no reason provided, then the system responds 400.
7. internal-transfer-workflow.AC7 — Given a request in `Pending: HR` where at least 90 days have elapsed since the employee's `dateOfJoining` (per `user-management-console`), when HR approves, then status moves to `Pending: Payroll, IT, Facilities` and three independent parallel tasks are created. *(`dateOfJoining` is the single tenure field decided for this check — it is not reset at each transfer, so for an employee's second or later transfer this measures tenure since original hire, not tenure in the immediately prior role.)*
8. internal-transfer-workflow.AC8 — Given a request in `Pending: HR`, when HR rejects it with a reason, then status moves to `Rejected` and the request is permanently closed.
9. internal-transfer-workflow.AC9 — Given a `Rejected` request, no action resumes it — a new request must be submitted to pursue the transfer again.
10. internal-transfer-workflow.AC10 — Given a request with all three parallel tasks pending, when Payroll completes its task (update or "No Action Needed"), then only the Payroll task moves to `Completed`, independent of IT/Facilities.
11. internal-transfer-workflow.AC11 — Given a request with all three parallel tasks pending, when IT completes its task, then only the IT task moves to `Completed`, independent of Payroll/Facilities.
12. internal-transfer-workflow.AC12 — Given a request with all three parallel tasks pending, when Facilities completes its task, then only the Facilities task moves to `Completed`, independent of Payroll/IT.
13. internal-transfer-workflow.AC13 — Given a request in `Pending: Transfer`, when HR performs the final manager-mapping step, then the employee's manager is updated and status moves to `Completed`.
    *(Amended 2026-09-20 — see `AC25`. Previously gated directly on all three task-status fields; now gated on the `Pending: Transfer` status those fields' completion produces, per user direction during `stakeholder-panel-ui.T11`'s Gate 2 review. Needs Gate 1 reviewer re-confirmation.)*
14. internal-transfer-workflow.AC14 — Given a request not in `Pending: Transfer` (i.e., at least one parallel task not yet `Completed`), when HR attempts the final manager-mapping step, then the system rejects it with 409.
    *(Amended 2026-09-20 — same change as `AC13`. Needs Gate 1 reviewer re-confirmation.)*
15. internal-transfer-workflow.AC15 — Given a request that reaches `Completed`, then the employee receives an in-app confirmation of the successful transfer.
16. internal-transfer-workflow.AC16 — Given a request in `Pending: Manager`, when the requesting Employee withdraws it, then status moves to `Withdrawn`.
17. internal-transfer-workflow.AC17 — Given a request in any status other than `Pending: Manager`, when the requesting Employee attempts to withdraw it, then the system rejects it with 409.
18. internal-transfer-workflow.AC18 — Given any request, its status is always displayed as `Pending: [Stakeholder]` while pending — including the new `Pending: Transfer` status (`AC25`), which names the pending action rather than a single stakeholder but is still HR's turn to act — or its terminal status (`Rejected`, `Withdrawn`, `Completed`) once resolved.
    *(Amended 2026-09-20 — extended to explicitly cover `Pending: Transfer`. Needs Gate 1 reviewer re-confirmation.)*
19. internal-transfer-workflow.AC19 — Given the requesting Employee, when they request their own request's status/history/pending stakeholders, then the system returns that data; given the currently-relevant assigned stakeholder for that specific request (Manager/HR/Payroll/IT/Facilities, using the identical per-role eligibility rule already defined by `AC21`–`AC23`), the system also returns that data; given any other non-Admin role, or Admin, the system rejects with 403.
    *(Amended 2026-09-20 — the original wording rejected even the legitimately assigned stakeholder, discovered while building `stakeholder-panel-ui.T06`'s Manager Decision panel: a Manager could never view the one request they're assigned to decide on. The carve-out deliberately reuses `AC21`–`AC23`'s already-defined eligibility rule rather than inventing a new one, and preserves the "no Admin carve-out" rule from `AC24`'s precedent. Gate 1 re-confirmed 2026-09-20 — see `gate-reviews/gate1-review-internal-transfer-workflow.md`.)*
20. internal-transfer-workflow.AC20 — Given an Employee, when they request `API10`, then the system returns every request they've submitted, regardless of status.
21. internal-transfer-workflow.AC21 — Given a Manager, when they request `API10`, then the system returns only requests currently assigned to them (`assignedManagerId`) with status `Pending: Manager`.
22. internal-transfer-workflow.AC22 — Given an HR user, when they request `API10`, then the system returns every request in `Pending: HR`, plus every request in `Pending: Transfer`.
    *(Amended 2026-09-20 — previously "every request in `Pending: Payroll, IT, Facilities` whose Payroll/IT/Facilities tasks are all `Completed`"; simplified to the new status directly, per `AC25`. Needs Gate 1 reviewer re-confirmation.)*
23. internal-transfer-workflow.AC23 — Given a Payroll, IT, or Facilities user, when they request `API10`, then the system returns only requests in `Pending: Payroll, IT, Facilities` where that role's own task status is still `Pending`.
24. internal-transfer-workflow.AC24 — Given an Admin, when they request `API10`, then the system rejects with 403.
25. internal-transfer-workflow.AC25 — Given a request in `Pending: Payroll, IT, Facilities` whose Payroll, IT, and Facilities tasks all become `Completed` (regardless of completion order), then its status automatically moves to `Pending: Transfer`, signaling that HR's final manager-mapping step (`AC13`) is now the only remaining action.
    *(Added 2026-09-20 — introduced at explicit user direction during `stakeholder-panel-ui.T11`'s Gate 2 review, closing a real gap: `API02`'s response had no field at all indicating individual task-completion progress, so the frontend's HR Final Mapping panel had no way to distinguish "all three tasks done, my turn" from "still waiting on Payroll/IT/Facilities" except by relying on the detail-view's own access-control side effect. This status makes that distinction a first-class, directly observable part of the request's own state. Needs Gate 1 reviewer re-confirmation.)*

## Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| internal-transfer-workflow.UT01 | AC1 | Employee submits a valid transfer request | 201; status `Pending: Manager` |
| internal-transfer-workflow.UT02 | AC2 | Submission missing `effectiveDate` | 400; `fields: ["effectiveDate"]` |
| internal-transfer-workflow.UT03 | AC3 | Manager attempts to submit a transfer request | 403 |
| internal-transfer-workflow.UT04 | AC4 | Manager approves a `Pending: Manager` request | Status → `Pending: HR` |
| internal-transfer-workflow.UT05 | AC5 | Manager rejects with a reason | Status → `Rejected` |
| internal-transfer-workflow.UT06 | AC6 | Manager rejects with no reason | 400 |
| internal-transfer-workflow.UT07 | AC7 | HR approves an eligible (≥90 days) request | Status → `Pending: Payroll, IT, Facilities`; 3 tasks created |
| internal-transfer-workflow.UT08 | AC8 | HR rejects with a reason | Status → `Rejected` |
| internal-transfer-workflow.UT09 | AC9 | Attempt to resume a `Rejected` request | No resume path exists; new request required |
| internal-transfer-workflow.UT10 | AC10 | Payroll marks its task "No Action Needed" | Payroll task → `Completed`; IT/Facilities unaffected |
| internal-transfer-workflow.UT11 | AC11 | IT completes its task | IT task → `Completed`; others unaffected |
| internal-transfer-workflow.UT12 | AC12 | Facilities completes its task | Facilities task → `Completed`; others unaffected |
| internal-transfer-workflow.UT13 | AC13 | HR performs final mapping on a `Pending: Transfer` request | Status → `Completed`; manager updated |
| internal-transfer-workflow.UT14 | AC14 | HR attempts final mapping while still `Pending: Payroll, IT, Facilities` (IT task not yet `Completed`) | 409 |
| internal-transfer-workflow.UT15 | AC15 | Request reaches `Completed` | Employee sees in-app confirmation |
| internal-transfer-workflow.UT16 | AC16 | Employee withdraws a `Pending: Manager` request | Status → `Withdrawn` |
| internal-transfer-workflow.UT17 | AC17 | Employee attempts withdrawal on a `Pending: HR` request | 409 |
| internal-transfer-workflow.UT18 | AC18 | Request status rendered while pending vs. resolved | Matches `Pending: [Stakeholder]` or terminal status |
| internal-transfer-workflow.UT19 | AC19 | Manager (not the requester, and not the assigned Manager for this specific request) requests its detail | 403 |
| internal-transfer-workflow.UT19a | AC19 | The assigned Manager requests detail of a `Pending: Manager` request assigned to them | 200; returns detail (HR/Payroll/IT/Facilities equivalents deferred to whichever task first needs them, per `AC19`'s amendment note) |
| internal-transfer-workflow.UT20 | AC20 | Employee with 2 requests (one `Completed`, one `Pending: Manager`) requests `API10` | Both returned |
| internal-transfer-workflow.UT21 | AC21 | Manager assigned to 1 of 2 `Pending: Manager` requests requests `API10` | Only the assigned one returned |
| internal-transfer-workflow.UT22 | AC22 | HR requests `API10` with one request in `Pending: HR` and one in `Pending: Transfer` | Both returned |
| internal-transfer-workflow.UT23 | AC23 | Payroll requests `API10` with one request whose `payrollTaskStatus` is `Completed` and one still `Pending` | Only the `Pending` one returned |
| internal-transfer-workflow.UT25 | AC25 | The last of the 3 parallel tasks (in any order) completes | Status → `Pending: Transfer` |
| internal-transfer-workflow.UT24 | AC24 | Admin requests `API10` | 403 |

## Explicitly Out of Scope
- Failure/correction path for Payroll/IT/Facilities parallel tasks beyond Payroll's "No Action Needed" option — not stated in SOW/BRD-001.
- Notification behavior on Manager/HR rejection, beyond the completion confirmation on success — not stated.
- Whether an Employee can hold more than one active transfer request concurrently — not stated; this spec neither permits nor restricts it.
- HR assignment/routing logic (which specific HR user reviews a given request) — not stated in SOW/BRD-001; assumed as given context. (Manager routing is resolved — see Context: "the assigned Manager" is the employee's `managerId`.)
- SLA/escalation — out of scope project-wide (BRD-001 Decided; SOW §5, §9, §10).
- Notifications beyond the in-app completion confirmation (Email/SMS/Push) — out of scope project-wide (SOW §10).

## Non-Functional Constraints (from constitution.md)
- Role-based authorization is enforced server-side for every endpoint in this spec, via `rbac-api-security`'s contract (Security Posture).
- Payroll's salary/compensation/tax fields must never appear in logs (Security Posture).
- MongoDB is the sole approved datastore; no client-supplied object may be passed unvalidated into a Mongoose query filter (Security Posture / Architectural Constraints).
- The workflow engine must support Payroll/IT/Facilities as three independently completable tasks — none may block another (Architectural Constraints; `AC10`–`AC12` above implement this directly).
- Every transition in this spec is expected to be logged by `transfer-audit-trail` — not re-decided here, just noted as a dependency.
- constitution.md states no numeric coverage floor and no numeric latency/availability targets exist yet — this spec does not invent one (Non-Functional Baselines).
