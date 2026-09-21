# Integration & System-Level Test Scenarios

## Derived From
.ai-context/BRD.md (all 7 entries) and .ai-context/specs/*.spec.md (all 7 specs) — cross-feature and full-journey scenarios that don't map cleanly to a single spec's own AC table, per sdd-methodology.md #19.1. This file is the one master file that remains after the per-feature split; it is not produced by `@generate-test-cases.md` (that workflow is scoped to one spec at a time) but follows the same governing discipline (#19.2): derived from acceptance criteria across specs, never from reading an implementation, and genuinely undecided cross-feature behavior is recorded as an Open Question rather than guessed.

_Previous version of this file (dated before `BRD.md` existed) referenced a mismatched design — a different feature slug, AC numbering, a Kafka/ITSM consumer, conditional step creation, and an `idempotencyKey` that appear nowhere in the current 7 specs. Deleted and regenerated fresh against the actual chain, per instruction._

## INT-001 — System cold-start / bootstrap
Before any Admin account exists: every authenticated action (login, user registration, org-structure management, transfer submission) fails, since no Admin or HR user can yet exist to perform the actions that create everything else. `POST /admin/self-register` then succeeds exactly once, creating the sole Admin. A second attempt fails. The Admin logs in, registers the first Manager and HR users, and HR registers the first Employee (with `dateOfJoining` and a `managerId` referencing the just-created Manager).
_Exercises: user-management-console.AC14, AC15, AC3, AC1; rbac-api-security.AC1, AC10._

## INT-002 — Full happy-path end-to-end journey
Admin creates a Department and a Job Role. An Employee (`dateOfJoining` 91 days ago, `managerId` set) logs in and submits a transfer request selecting that Department, Job Role, and a config-driven Location. The assigned Manager approves. HR validates eligibility (≥90 days holds) and approves, spawning independent Payroll/IT/Facilities tasks. All three complete in any order. HR performs the final manager-mapping step. The request reaches `Completed`. The Employee's own view and Admin's dashboard/detail view both reflect the same final state, and the audit trail shows one entry per transition.
_Exercises: org-structure-management.AC1, AC7; application-constants-management.AC1, AC2; internal-transfer-workflow.AC1, AC4, AC7, AC10–AC13, AC15; transfer-admin-oversight.AC1, AC2, AC6; transfer-audit-trail.AC1 — the only scenario touching all 7 specs in one pass._

## INT-003 — Rejection at Manager stage, then independent resubmission
Submit → Manager rejects with a reason → status `Rejected`, permanently closed → every other endpoint on this same request now returns 409 → the Employee submits a brand-new request for the same Department/Location/Job Role → succeeds independently, with its own separate audit trail not conflated with the rejected request's.
_Exercises: internal-transfer-workflow.AC1, AC5, AC9; transfer-audit-trail.AC1._

## INT-004 — Ineligible employee blocked at HR gate
Employee registered with `dateOfJoining` 30 days ago. Submits and receives Manager approval. HR attempts approval → 409, not yet eligible. HR rejects instead → `Rejected`. (This is the full-journey version of the 89/90-day boundary already unit-tested in `internal-transfer-workflow.test_cases.md` QT11/QT12.)
_Exercises: internal-transfer-workflow.AC7, AC8; user-management-console.AC1._

## INT-005 — Withdrawal mid-journey
Submit → Employee withdraws while still `Pending: Manager` → status `Withdrawn`, the request never reaches HR or the parallel stage → the audit trail shows exactly two entries (submitted, withdrawn) → the dashboard's `statusBreakdown.Withdrawn` count reflects it.
_Exercises: internal-transfer-workflow.AC16; transfer-audit-trail.AC1; transfer-admin-oversight.AC2._

## INT-006 — Role confinement across a single request's full lifecycle
Using the request from INT-002, verify at every stage that every role other than the one currently authorized for that step is rejected — e.g. while `Pending: Manager`, HR/Payroll/IT/Facilities/Admin (via `internal-transfer-workflow.API02`, not the Admin-only oversight endpoint) all get 403 attempting to act on or view it. This is the full-journey version of the isolated role-boundary cases already covered per-spec — exercised once, continuously, across one real request rather than as independent isolated calls.
_Exercises: rbac-api-security.AC3–AC9; internal-transfer-workflow.AC19._

## INT-007 — Audit trail / Admin detail view cross-check
For the request in INT-002, compare `transfer-audit-trail.API02`'s own response against `transfer-admin-oversight.API03`'s embedded `actionHistory` for the same request. They must be identical — `transfer-admin-oversight.plan.md` reads `AuditLogs` directly rather than calling `transfer-audit-trail.API02` internally, so this is a genuine cross-implementation consistency check, not a redundant one.
_Exercises: transfer-audit-trail.AC1, AC4; transfer-admin-oversight.AC6._

## INT-008 — Concurrent parallel-task completion
Payroll, IT, and Facilities submit their completion calls within the same instant (near-simultaneous requests). All three succeed independently with no lost update, and HR's subsequent final-mapping attempt only succeeds once all three are genuinely reflected as `Completed`.
_Exercises: internal-transfer-workflow.AC10–AC14._

## INT-009 — Org-structure edit/delete during an in-flight request (Open Question)
A Department referenced by an in-flight (not yet terminal) transfer request is deleted by Admin mid-journey. What happens to the in-flight request — does it remain valid, get blocked at its next transition, or surface an error? **Not decided anywhere.** `org-structure-management.spec.md`'s and `internal-transfer-workflow.plan.md`'s own Explicitly Out of Scope / Deferred sections already flag this as unresolved; not assumed here either. Routes back to a spec/plan amendment before this scenario can be given an expected outcome.

## INT-010 — Application-constant value change during an in-flight request (Open Question)
A `location` value is removed from the backend constants module after a transfer request already using that value has been submitted but is not yet `Completed`. Does the in-flight request remain valid through to completion, or does a later transition re-validate `location` and fail? **Not stated anywhere** — `application-constants-management.spec.md`'s Explicitly Out of Scope addresses frontend/backend sync, not this temporal question. Routes back to a spec amendment.
