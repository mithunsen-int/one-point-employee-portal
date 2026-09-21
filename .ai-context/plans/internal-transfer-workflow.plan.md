# Plan: Internal Transfer Workflow

## Derived From
.ai-context/specs/internal-transfer-workflow.spec.md (Status: Approved)

## Architecture Approach

- **Workflow Engine Service** (existing module, `architecture.md`) — this plan's sole home; owns the `TransferRequests` state machine end to end.
- **Cross-service reads are direct Mongoose queries against the owning collection, not internal HTTP calls** — consistent with the pattern already established in `rbac-api-security.plan.md` (reads `Users` directly) and `application-constants-management.plan.md` (direct module import, not an API call). Concretely:
  - `departmentId`/`jobRoleId` validation (`API01`) — direct query against the `Departments`/`JobRoles` collections owned by `org-structure-management`.
  - `location` validation (`API01`) — direct import from `application-constants-management`'s backend constants module (`src/services/constants/referenceValues.ts`), not an API call, since that spec has no API surface.
  - Eligibility check (`API04`) and Manager routing (`API03`) — direct query against the `Users` collection owned by `user-management-console`, reading `dateOfJoining` and `managerId`.
  - Audit logging — every successful transition across `API01`–`API09` calls `transfer-audit-trail.API01` (an internal, non-HTTP call per that spec's own design) to append one entry.
- **No new module is introduced.** Authorization is enforced entirely by the existing Auth/RBAC middleware (`rbac-api-security.plan.md`, already built) — this plan does not reimplement any role checks.

## Data Model

**New collection: `TransferRequests`** (first plan to introduce it — a new collection within the already-approved MongoDB datastore, not a new datastore, so no ADR is triggered).

| Field | Type | Notes |
|---|---|---|
| `employeeId` | ObjectId (ref `Users`) | The requesting Employee |
| `departmentId` | ObjectId (ref `Departments`) | Validated to exist at submission (`API01`, 404 otherwise) |
| `jobRoleId` | ObjectId (ref `JobRoles`) | Validated to exist at submission |
| `location` | String | Validated against the backend constants module at submission |
| `effectiveDate` | Date | |
| `reason` | String, optional | |
| `status` | String enum | `Pending: Manager` \| `Pending: HR` \| `Pending: Payroll, IT, Facilities` \| `Pending: Transfer` \| `Rejected` \| `Withdrawn` \| `Completed` — matches `AC18`'s vocabulary exactly; enforced via Mongoose `enum`. `Pending: Transfer` added 2026-09-20 per `AC25`. |
| `assignedManagerId` | ObjectId (ref `Users`), snapshotted | Copied from the Employee's `managerId` **at submission time** — see decision below |
| `managerDecisionReason` | String, optional | Required at the application layer when `decision: "reject"` (see Constitution Check) |
| `hrDecisionReason` | String, optional | Same conditional-required pattern |
| `payrollTaskStatus`, `itTaskStatus`, `facilitiesTaskStatus` | String enum (`Pending` \| `Completed`) | Independent per `AC10`–`AC12` |
| `newManagerId` | ObjectId (ref `Users`), optional | Set only at `API08` (final mapping) |
| `submittedAt`, `completedAt` | Date | |

**Decision — `assignedManagerId` is snapshotted at submission, not looked up live on every subsequent check.** Rationale: `internal-transfer-workflow.spec.md`'s Context defines "the assigned Manager" as the employee's `managerId` at the point the term is used, and snapshotting avoids the request's approver silently changing mid-flight if the employee's manager is reassigned elsewhere in the system while a request is pending — indefinitely, per this project's no-SLA constraint. This is a plan-level decision, not stated in the spec; flagged here explicitly rather than left for implementation to decide silently (#13).

**Conditional-required fields are application-layer, not Mongoose-schema-enforced:** `managerDecisionReason`/`hrDecisionReason` are required only when the corresponding `decision` is `"reject"` — Mongoose has no native cross-field conditional-required equivalent to a relational check-constraint, so this is validated in the route handler, not the schema, per `int-standards.nextjs.md`'s Database Layer guidance. Documented here explicitly, not left implicit.

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first for every endpoint/state-changing op (Testing Discipline) | ✓ | All 9 endpoints get Red tests before implementation, per the standing project flow. |
| Jest + RTL (Testing Discipline) | ✓ | Backend-only plan; Jest covers it. RTL is N/A — no UI component is built by this plan (a future Stakeholder Panel spec renders the forms). |
| Mongoose schema validators tested (Testing Discipline) | ✓ | The `status`/task-status enums are schema-level and will be tested; the conditional-required reason fields are application-layer and tested at the route-handler level, per the Data Model note above. |
| Coverage floor (Testing Discipline) | ✓ | constitution.md states none is set yet; this plan doesn't invent one. |
| No PII/personal data in logs (Security Posture) | ✓ | Payroll's salary/compensation/tax fields (`API05`) are never logged, per the spec's own Non-Functional Constraints — only the fact that the task completed. |
| Role-based authorization enforced server-side (Security Posture) | ✓ | Delegated entirely to the existing `rbac-api-security` middleware — not reimplemented here. |
| MongoDB sole datastore (Architectural Constraints) | ✓ | `TransferRequests` is a new collection, not a new datastore. |
| No client-supplied object into a Mongoose filter unvalidated (Security Posture) | ✓ | Every lookup (`departmentId`, `jobRoleId`, `employeeId`, request `id`) is a typed, single-field/ID query — never a spread of raw request-body content into a filter. |
| Parallel Payroll/IT/Facilities tasks are independently completable (Architectural Constraints) | ✓ | Three separate status fields (`payrollTaskStatus`, `itTaskStatus`, `facilitiesTaskStatus`), three separate endpoints (`API05`–`API07`), each updates only its own field — `AC10`–`AC12` implemented directly by this design. |
| No new datastore/state lib/external integration without ADR (Architectural Constraints) | ✓ | None introduced. |
| No numeric latency/availability/RPO/RTO targets invented (Non-Functional Baselines) | ✓ | None stated in constitution.md; none invented here. |

**Rate limit decisions — one blanket justification, stated per endpoint as required:**
`API01`–`API09`: Rate limit: **none, deferred** — every one of these endpoints is authenticated and role-gated (via `rbac-api-security`), performed by internal staff (Employee/Manager/HR/Payroll/IT/Facilities/Admin) acting on their own or an assigned request, not a public-facing or credential-guessing surface like `rbac-api-security.API02`'s login. No brute-force or enumeration risk profile applies the same way. If abuse patterns emerge in practice, that's a future plan revision, not invented here.

## Explicitly Deferred

- Failure/correction path for Payroll/IT/Facilities tasks beyond "No Action Needed" — per spec's Explicitly Out of Scope; this plan builds only the happy-path completion for each.
- Notification behavior on Manager/HR rejection — per spec's Explicitly Out of Scope; no notification mechanism is built here.
- Enforcement (or non-enforcement) of one-active-request-per-Employee — per spec's Explicitly Out of Scope; this plan's schema does not add a uniqueness constraint either way.
- HR assignment/routing logic (which specific HR user reviews a request) — per spec's Explicitly Out of Scope; `API04` is callable by any authenticated HR user, not routed to a specific one.
- SLA/escalation, notifications beyond in-app confirmation — out of scope project-wide.

## Sequencing

1. `TransferRequests` Mongoose schema/model — all fields and enums per the Data Model above.
2. `POST /transfer-requests` (`API01`) — submission, with `departmentId`/`jobRoleId`/`location` validation and `assignedManagerId` snapshot.
3. `GET /transfer-requests/{id}` (`API02`) — status/history/pending-stakeholders view, scoped to the requesting Employee.
4. `POST /transfer-requests/{id}/manager-decision` (`API03`) — approve/reject, conditional-required reason on reject.
5. `POST /transfer-requests/{id}/hr-decision` (`API04`) — ≥90-day eligibility check against `dateOfJoining`, approve/reject, spawns the three parallel task records on approve.
6. `POST .../payroll-task`, `.../it-task`, `.../facilities-task` (`API05`–`API07`) — three independent, individually-gated task-completion endpoints.
7. `POST /transfer-requests/{id}/hr-final-mapping` (`API08`) — gated on all three parallel tasks `Completed`; sets `newManagerId`, status `Completed`.
8. `POST /transfer-requests/{id}/withdraw` (`API09`) — Employee-only, `Pending: Manager`-only.
9. Audit-trail integration — a shared helper invoked at the end of every successful transition in `API01`–`API09`, calling `transfer-audit-trail.API01` to append one entry per action.
10. `GET /transfer-requests/mine` (`API10`) — role-filtered discovery of requests relevant to the caller — added 2026-09-19, see `tasks.md`'s `T10` origin note.
11. `GET /transfer-requests/{id}` (`API02`) carve-out — extend the existing Employee-only check to also allow the assigned Manager to view a request assigned to them while it is `Pending: Manager`, per `AC19`'s 2026-09-20 amendment. Scoped to Manager only for now, since that's the only role with an active consumer (`stakeholder-panel-ui.T06`); HR/Payroll/IT/Facilities get the identical treatment when `stakeholder-panel-ui.T07`–`T10` need it, reusing `AC21`–`AC23`'s eligibility rule each time rather than re-deriving it.
12. `GET /transfer-requests/{id}` (`API02`) carve-out, part 2 — HR/Payroll/IT/Facilities, added together in one task since `stakeholder-panel-ui.T07`–`T11`'s remaining blockers were all audited at once: HR (`AC22`'s rule — `Pending: HR`, or `Pending: Payroll, IT, Facilities` with all three tasks `Completed`, covering both `T07` and `T11`'s needs in the same clause) and Payroll/IT/Facilities (`AC23`'s rule — `Pending: Payroll, IT, Facilities` with that role's own task still `Pending`, one clause each for `T08`/`T09`/`T10`). `AC19`'s already-amended text already generically covers all four roles ("Manager/HR/Payroll/IT/Facilities... using the identical per-role eligibility rule already defined by AC21–AC23") — no further spec amendment needed, this is pure implementation of an already-approved AC.
13. **`Pending: Transfer` status (`AC25`, added 2026-09-20 at explicit user direction during `stakeholder-panel-ui.T11`'s Gate 2 review)** — a new terminal-of-the-parallel-stage status, set automatically by whichever of `API05`/`API06`/`API07` is the last to complete its own task (a small shared helper, `allParallelTasksCompleted`, checks all three fields after the in-memory update, reused by all three handlers rather than tripling the same condition). `API08` (hr-final-mapping)'s own precondition is simplified from checking all three task fields directly to checking `status === "Pending: Transfer"` — the status is now the single source of truth for "all three tasks done," not a derived, re-checked condition. `API02`'s HR carve-out (`T12`) and `API10`'s HR branch (`AC22`) are both simplified the same way. `GET /transfer-requests/{id}`'s `pendingStakeholdersFor` gets a new case (`Pending: Transfer` → `["HR"]`). Closes a real gap: the frontend had no field-level way to know when all three parallel tasks were done, short of relying on `API02`'s own access-control side effect.
