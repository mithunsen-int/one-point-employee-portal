# Gate 2 Evidence — internal-transfer-workflow

One running file per feature for this gate. Each task gets one appended row below, plus its full findings report in this same file. Never overwritten or removed.

## Summary Table

| Task ID | Date | Reviewer (named human) | Verdict | Blocking findings | Reference |
|---|---|---|---|---|---|
| internal-transfer-workflow.T01 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt01--full-report) |
| internal-transfer-workflow.T02 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt02--full-report) |
| internal-transfer-workflow.T03 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt03--full-report) |
| internal-transfer-workflow.T04 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt04--full-report) |
| internal-transfer-workflow.T05 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt05--full-report) |
| internal-transfer-workflow.T06 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt06--full-report) |
| internal-transfer-workflow.T07 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt07--full-report) |
| internal-transfer-workflow.T08 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt08--full-report) |
| internal-transfer-workflow.T09 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt09--full-report) |
| internal-transfer-workflow.T10 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#internal-transfer-workflowt10--full-report) |
| internal-transfer-workflow.T11 | 2026-09-20 | Test Reviewer | Merged | None (AC19 Gate 1 re-confirmed 2026-09-20) | [Full report](#internal-transfer-workflowt11--full-report) |
| internal-transfer-workflow.T12 | 2026-09-20 | Test Reviewer | Merged | None (reuses already-approved/re-confirmed AC19 text) | [Full report](#internal-transfer-workflowt12--full-report) |
| internal-transfer-workflow.T13 | 2026-09-20 | Test Reviewer | Merged | None (AC13/AC14/AC18/AC22/AC25 Gate 1 re-confirmed 2026-09-20) | [Full report](#internal-transfer-workflowt13--full-report) |

---

## internal-transfer-workflow.T01 — Full Report

**Diff reviewed:** `src/services/workflow/TransferRequest.ts` (new), `src/services/workflow/TransferRequest.test.ts` (new).

**Acceptance:** `internal-transfer-workflow.AC1` — cited representatively; this task is foundational schema work, not itself the full behavior of any one endpoint (same "cited representatively" pattern already used consistently across the project's other first-task-in-a-spec schema work).

### AC verification (by ID)

- **`AC1`** — **Pass, as scoped.** The schema defines every field a valid submission needs (`employeeId`, `departmentId`, `jobRoleId`, `location`, `effectiveDate`, `status`, `assignedManagerId`, `submittedAt`, all required) plus the optional ones (`reason`, `managerDecisionReason`, `hrDecisionReason`, `newManagerId`, `completedAt`). The `status` enum's 6-value vocabulary is verified to match `AC18` exactly, both individually (each value accepted) and negatively (an invalid value rejected) — a real cross-check against a different AC's own wording, not just this task's literal citation. This task does not itself create a request or return 201 — that's `T02`'s job.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above, with the representative-citation scope stated explicitly. |
| No AI-attribution in comments/commit messages | Pass | `TransferRequest.ts`'s two comments explain real, non-obvious decisions (why `assignedManagerId` is required; why the three task-status fields default to `Pending`) — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `TransferRequests` is confirmed by the plan as a new collection within the already-approved datastore — no ADR trigger. Workflow Engine Service is already named in `architecture.md`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 27 tests failed with `Cannot find module './TransferRequest'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Both updated same session (2026-09-19); spec Status moved `Tasks Generated` → `In Development` in the same edit as this task's work. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Field names, types, and ref targets match the plan's Data Model table exactly, one-for-one; `TRANSFER_REQUEST_STATUSES`/`TASK_STATUSES` exported as named constants following the same pattern already used for `USER_ROLES` in `user-management-console`. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass (N-A) | No logging statements — schema only. |
| No secrets/credentials/tokens hardcoded or logged | Pass (N-A) | No secret/credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint introduced — schema only, per this task's own scope. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass (N-A) | No authorization logic in this diff — delegated entirely to the existing `rbac-api-security` middleware per the plan, not reimplemented anywhere in this spec. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; `TransferRequests` is a new collection within it, not a new datastore. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No query-filter code in this diff — schema definition only. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — task-status defaults are a schema-level decision not explicitly stated in the plan.** The plan's Data Model table lists `payrollTaskStatus`/`itTaskStatus`/`facilitiesTaskStatus` as an enum without specifying a default. This implementation defaults them to `"Pending"` on creation, reasoned from `AC10`–`AC12`'s framing of them as independently trackable state from the moment a request exists. A reasonable, low-risk completion of the plan's own field list — flagged for traceability, not silently assumed.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T01`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T01` Merged.

---

## internal-transfer-workflow.T02 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/route.ts` (new), `src/app/api/transfer-requests/route.test.ts` (new).

**Acceptance:** `internal-transfer-workflow.AC1`–`AC3`. API Contract: `API01`.

### AC verification (by ID)

- **`AC1`** — **Pass.** Valid submission creates the request with `status: "Pending: Manager"` and 201; `assignedManagerId` verified against the real snapshotted value from the employee's own `managerId` (`UT01`), not just presence. Optional `reason` correctly omittable (`QT01`).
- **`AC2`** — **Pass.** Each of `departmentId`/`jobRoleId`/`location`/`effectiveDate` individually missing correctly 400s naming that field (`UT02`/`QT05`–`QT07`).
- **`AC3`** — **Pass.** Full 6-role sweep (Manager, HR, Payroll, IT, Facilities, Admin) all correctly rejected 403 (`UT03`/`QT08`).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `route.ts`'s one comment explains the `assignedManagerId` snapshotting decision (a real plan-level rationale) — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection/decision — composes four already-Merged pieces from four different specs. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 17 tests failed with `Cannot find module './route'` before the file existed. One transient full-suite failure (an unrelated `job-roles` test's `afterEach` hook timing out under parallel load) was investigated and confirmed as environment resource contention, not a regression this diff introduced — passed cleanly in isolation and on an immediate full-suite rerun. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Validation → authorization (via `withAuthorization`) → existence checks → business logic, matching the layering already established across this project's other write endpoints. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for all 9 endpoints in this spec — authenticated, role-gated, not public-facing — explicit, not omitted. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | `withAuthorization("transfer.initiate", ...)` — the exact action already defined for Employee in `rbac-api-security.T05`'s matrix, reused rather than a new one invented. Verified by the full 401/403 test coverage above, not assumed from the wrapper's own prior tests alone. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; `TransferRequests` is the one collection written to. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `departmentId`/`jobRoleId` are validated via `Types.ObjectId.isValid()` before use in `.exists()`; `identity.userId` (from the verified JWT, not client-suppliable) is used for the `User.findById` lookup. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — this is the project's first genuinely real (non-stubbed) cross-spec integration.** Every previous cross-spec dependency this session hit (`rbac-api-security.T02`'s `userLookup.ts`, `transfer-audit-trail.T03`'s `transferRequestLookup.ts`) was blocked on an unbuilt schema and had to be stubbed. Here, all four dependencies (`Users`, `Departments`, `JobRoles`, the backend constants module) already exist and are Merged, so this diff wires them directly — worth noting as a milestone, not a defect.

**Note (non-blocking) — no explicit handling for a missing/deleted employee record at submission time.** `User.findById(identity.userId)` could in principle return `null` if the authenticated user's own record has since been deleted — not covered by any AC/QA row, and would currently surface as an uncaught Mongoose validation error (missing `assignedManagerId`) rather than a graceful response. Extreme edge case (a valid, unexpired JWT for a since-deleted user), not built defensively per "don't invent unrequested validation" — flagged for awareness, not fixed unrequested.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T02`.

### Outcome

No Blocking findings. Three non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T02` Merged.

---

## internal-transfer-workflow.T03 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/route.ts` (new), `src/app/api/transfer-requests/[id]/route.test.ts` (new).

**Acceptance:** `internal-transfer-workflow.AC18`, `AC19`. API Contract: `API02`.

### AC verification (by ID)

- **`AC18`** — **Pass.** All 6 status values render exactly as their literal string (`QT24`, full enumeration), each paired with its correctly-derived `pendingStakeholders` array in the same parametrized test.
- **`AC19`** — **Pass.** The requesting Employee (exact `employeeId` match) gets 200 with the full shape; the assigned Manager, HR/Payroll/IT/Facilities (`QT25`), a different Employee, and Admin with explicitly no carve-out (`QT26`) all correctly 403. `UT19`'s Manager-specific case verified directly.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `route.ts`'s comments explain the no-Admin-carve-out design (a real, spec-derived decision) and the deliberate non-extraction of the actor-resolution logic — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; reuses `rbac-api-security.T04`'s `authenticateRequest` and `transfer-audit-trail`'s already-Merged `AuditLog`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 17 tests failed with `Cannot find module './route'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass, with one flagged trade-off | See Findings — the actor-resolution logic is duplicated from `transfer-audit-trail.T03`'s route rather than shared, a deliberate and explained choice, not an oversight. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for all 9 endpoints in this spec. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Ownership is checked by exact `employeeId` match, not role alone — even other Employees, and Admin, are correctly excluded. Verified by explicit test coverage of each excluded case, not assumed. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Read-only; no new datastore. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` validated via `Types.ObjectId.isValid()`; `identity.userId` (from the verified JWT) drives the ownership comparison, not client-suppliable. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — actor-resolution logic duplicated from `transfer-audit-trail.T03`, not shared.** The ~10-line "resolve `AuditLog.actorId` entries to usernames" logic now exists in two places (that spec's own `GET /transfer-requests/{id}/audit-log` route, and this one). Deliberate: it's used in exactly one other place, and extracting a shared helper for two current call sites — especially across two different specs' service directories — wasn't judged worth the added indirection yet. Worth revisiting if a third consumer appears (e.g., `transfer-admin-oversight`'s detail view).

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T03`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T03` Merged.

---

## internal-transfer-workflow.T04 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/manager-decision/route.ts` (new), `src/app/api/transfer-requests/[id]/manager-decision/route.test.ts` (new). Updated during this same review cycle, before Merge: both files' comments, and `test_cases/internal-transfer-workflow.test_cases.md` (`QT09` closed — see Findings).

**Acceptance:** `internal-transfer-workflow.AC4`, `AC5`, `AC6`, `AC9` (the `Rejected`-closes-permanently half). API Contract: `API03`.

### AC verification (by ID)

- **`AC4`** — **Pass.** The assigned Manager approving a `Pending: Manager` request moves it to `Pending: HR`, verified against the response and the stored document.
- **`AC5`** — **Pass.** The assigned Manager rejecting with a reason moves the request to `Rejected` and stores `managerDecisionReason`, verified against the stored document, not just the response.
- **`AC6`** — **Pass.** A reject with no reason, and a reject with an empty-string reason (`QT10`), both 400 naming `reason`.
- **`AC9`** — **Pass, as scoped.** 409 verified across all 5 non-`Pending: Manager` statuses for *this* endpoint. The full cross-endpoint sweep (`QT14`/`QT15`, every one of `API03`–`API09` against a terminal request) is explicitly each future endpoint's own responsibility, per this task's own scope note ("enforced by each endpoint's own state check, not centrally") — not testable here since `API04`–`API09` don't exist yet.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above, with `AC9`'s scope boundary stated explicitly. |
| No AI-attribution in comments/commit messages | Pass | `route.ts`'s one comment documents the `QT09` resolution (a real, traceable decision) — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection/decision; composes already-Merged `T01`–`T03` pieces. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 14 tests failed with `Cannot find module './route'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Ordering (401 → 404 → 403 → 409 → 400 → business logic) matches the layering already established across this spec's other endpoints. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for all 9 endpoints in this spec. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Scoped to the exact `assignedManagerId`, not role alone — a different Manager is correctly excluded, verified by explicit test, not merely assumed from role-based gating. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; `TransferRequests` is the one collection written to. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` validated via `Types.ObjectId.isValid()`; `identity.userId` (from the verified JWT) drives the ownership comparison, not client-suppliable. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Resolved during this review, before Merge — `QT09` formally closed.** `test_cases.md` recorded `QT09` (403 vs. 404 for a non-assigned Manager) as an *Open QA Question* even though this task's own prompt file already instructed 403. Flagged rather than left silently inconsistent; the user then explicitly confirmed 403 is the correct, final decision. `test_cases.md`'s `QT09` row and its Open Questions entry updated to record the resolution (2026-09-19), and both `route.ts`'s and `route.test.ts`'s comments updated to reference the closed question rather than an open one.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T04`.

### Outcome

No Blocking findings. One finding raised and resolved within this same review cycle (`QT09`, now formally closed, not erased from this record) plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T04` Merged.

---

## internal-transfer-workflow.T05 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/hr-decision/route.ts` (new), `src/app/api/transfer-requests/[id]/hr-decision/route.test.ts` (new).

**Acceptance:** `internal-transfer-workflow.AC7`, `AC8`, `AC9`. API Contract: `API04`.

### AC verification (by ID)

- **`AC7`** — **Pass.** HR approving an eligible (≥90 days) request moves it to `Pending: Payroll, IT, Facilities` and initializes all 3 task statuses to `Pending` (`UT07`); the exact 90-day inclusive boundary (`QT11`) and the 89-day ineligible case (`QT12`) are both verified, the latter confirming the request's status is genuinely unchanged, not just that the response is 409.
- **`AC8`** — **Pass.** HR rejecting with a reason moves the request to `Rejected` and stores `hrDecisionReason` (`UT08`); missing and empty-string reason both 400 (`QT13`). A dedicated test confirms rejection is *not* blocked by the 90-day rule even for a 10-day-tenure employee — a real, AC-traceable distinction (`AC7`'s "when HR approves" vs. `AC8`'s unconditional reject), not assumed.
- **`AC9`** — **Pass, as scoped.** 409 verified across all 5 non-`Pending: HR` statuses for this endpoint, same scope boundary already established at `T04`'s review.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `route.ts`'s two comments explain real decisions (any-HR-user vs. `T04`'s exact-assignee check; eligibility applying to approve only) — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection/decision; composes already-Merged `T01`–`T04` pieces plus a read from `user-management-console`'s `Users`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 20 tests failed with `Cannot find module './route'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Same layering as `T04`; the eligibility check is cleanly scoped inside the approve branch only, not interleaved with the reject path. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. `dateOfJoining` is read but never logged. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for all 9 endpoints in this spec. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Role-gated to HR only, verified by a full 6-role 403 sweep, not merely the spec's single example. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; reads `Users` (owned by `user-management-console`) read-only, writes only to `TransferRequests`. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` validated via `Types.ObjectId.isValid()`; the `employeeId` used for the `Users` lookup comes from the already-fetched `TransferRequest` document, not client input. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — wrong-status and insufficient-tenure both return the same generic 409 body.** `API04`'s exception table groups both conditions under one 409 line without a distinguishing error code. This implementation returns `{"error": "conflict"}` for both rather than inventing a distinguishing code (e.g., `"not_eligible"`) the spec doesn't specify — a literal reading, flagged for traceability, not an oversight.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T05`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T05` Merged.

---

## internal-transfer-workflow.T06 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/payroll-task/route.ts` + `route.test.ts` (new), `src/app/api/transfer-requests/[id]/it-task/route.ts` + `route.test.ts` (new), `src/app/api/transfer-requests/[id]/facilities-task/route.ts` + `route.test.ts` (new).

**Acceptance:** `internal-transfer-workflow.AC10`, `AC11`, `AC12`. API Contract: `API05`, `API06`, `API07`.

### AC verification (by ID)

- **`AC10`** — **Pass.** Payroll completing its task (both `action: "update"` and `action: "no_action_needed"`) marks only `payrollTaskStatus` `Completed`; `itTaskStatus`/`facilitiesTaskStatus` verified directly to remain `Pending` — the actual independence claim, not just that the target field changed.
- **`AC11`** — **Pass.** Same verification pattern for IT; `payrollTaskStatus`/`facilitiesTaskStatus` confirmed unaffected.
- **`AC12`** — **Pass.** Same verification pattern for Facilities; `payrollTaskStatus`/`itTaskStatus` confirmed unaffected.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Each route's one comment states which two fields it deliberately never touches (a real, traceable independence claim) — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection/decision; composes already-Merged `T01`/`T05` state. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 37 tests (across 3 files) failed with `Cannot find module './route'` before the respective files existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass, with one deliberate trade-off noted | Three near-identical files rather than one shared parameterized handler — matches this project's own established convention (`Departments`/`JobRoles`) and this task's own explicit "never reads or reasons about the other two tasks' state" scope note, which argues for structural separation over a shared abstraction that could couple them. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in any of the three files. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for all 9 endpoints in this spec. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Each endpoint role-gated to exactly one role, verified by a full 6-role 403 sweep per endpoint (18 role-check tests total across the three). |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; each handler writes only its own single field on `TransferRequests`. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` validated via `Types.ObjectId.isValid()` in all three; no other filter-driven query in any of them. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — no payload validation on any of the three endpoints, by design.** `API05`–`API07`'s contracts document no 400 exception, unlike every other endpoint built in this project so far. This implementation accepts any payload shape and completes the task regardless — a literal reading of the contract, not an oversight. Payroll's `action` field content specifically is never inspected; both of its documented values produce the same outcome per this task's own scope note.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T06`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T06` Merged.

---

## internal-transfer-workflow.T07 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/hr-final-mapping/route.ts` (new), `src/app/api/transfer-requests/[id]/hr-final-mapping/route.test.ts` (new). Updated during this same review cycle, before Merge: both files, to add the real `User.managerId` write (see Findings).

**Acceptance:** `internal-transfer-workflow.AC13`, `AC14`, `AC15`. API Contract: `API08`.

### AC verification (by ID)

- **`AC13`** — **Pass, in full.** All 3 tasks `Completed` correctly moves the request to `status: "Completed"`, sets `TransferRequest.newManagerId`, sets `completedAt` to a real `Date`, and — confirmed during this review — genuinely updates the employee's own `User.managerId` to the new manager, verified by a dedicated test against the `Users` collection, not just the request document. `QT20` confirms a different HR user than the one who approved earlier is still permitted.
- **`AC14`** — **Pass.** Each of the three tasks individually still `Pending` blocks the request with 409 (`QT19`'s full variant sweep), verified independently rather than assuming an order; the request is confirmed genuinely unchanged after a blocked attempt, not just that the response is 409.
- **`AC15`** — **Pass, as scoped.** No separate confirmation mechanism is built, per this task's own scope note — `AC15` is satisfied entirely by `T03`'s existing `GET /transfer-requests/{id}` surfacing `status: "Completed"`. `QT21` (the exact confirmation data shape) is correctly left as an untested Open QA Question.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `route.ts`'s comments document the three-independent-checks design and the `newManagerId`-not-`Users.managerId` scope decision — real, traceable notes, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection/decision; composes already-Merged `T01`/`T06` state and reads (not writes) nothing from `Users`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 14 tests failed with `Cannot find module './route'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Three-field gate is a single, explicit boolean expression — easy to audit against `AC14`'s "each independently" requirement at a glance. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for all 9 endpoints in this spec. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Role-gated to HR only, verified by a full 6-role 403 sweep. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; this diff writes to `TransferRequests` and, following the confirmed `AC13` decision, to `Users.managerId` — a real, confirmed cross-collection write, not an undecided one. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` validated via `Types.ObjectId.isValid()`; no filter-driven query uses client input beyond that. `newManagerId` is written as a scalar field value, not used in any filter. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Resolved during this review, before Merge — `AC13`'s "the employee's manager is updated" confirmed to mean a real `Users.managerId` write.** The first version of this diff wrote only `TransferRequest.newManagerId` and flagged the ambiguity rather than guessing. User confirmed explicitly: HR selects the new manager for the employee from a list, and the employee's actual manager record must change — this is precisely what `API04` (HR approval), `T04`'s Manager-decision, and `T02`'s submission-time `managerId` snapshot all read from `Users`, so leaving it unwritten would have left the employee's real manager assignment stale after a completed transfer. Fixed with `User.findByIdAndUpdate(transferRequest.employeeId, { managerId: newManagerId })`, alongside the existing `TransferRequest.newManagerId` write (kept as the historical record of what was decided on this specific request). One new test confirms the employee's own `User.managerId` is genuinely updated, not just the request document.

**Note (non-blocking) — no payload validation on `newManagerId`.** `API08`'s contract documents no 400 exception, consistent with `T06`'s endpoints. A non-`ObjectId`-shaped `newManagerId` would currently surface as an uncaught Mongoose cast error (an unhandled 500) rather than a graceful response — not covered by any AC/QA row, so not built defensively per "don't invent unrequested validation," but worth being aware of.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T07`.

### Outcome

No Blocking findings. One finding raised and resolved within this same review cycle (`AC13`'s `Users.managerId` write, now confirmed and implemented, not erased from this record) plus two routine Notes.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T07` Merged.

---

## internal-transfer-workflow.T08 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/withdraw/route.ts` (new), `src/app/api/transfer-requests/[id]/withdraw/route.test.ts` (new).

**Acceptance:** `internal-transfer-workflow.AC16`, `AC17`. API Contract: `API09`.

### AC verification (by ID)

- **`AC16`** — **Pass.** The requesting Employee withdrawing a `Pending: Manager` request moves it to `Withdrawn`, verified against both the response and the stored document.
- **`AC17`** — **Pass.** All 5 non-`Pending: Manager` statuses individually rejected 409 (`QT23`'s full sweep), not just the spec's single `Pending: HR` example.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `route.ts`'s one comment notes the reused ownership-check pattern from `T03` — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection/decision; composes already-Merged `T01`/`T03` patterns. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 10 tests failed with `Cannot find module './route'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Ownership check is a direct reuse of `T03`'s exact comparison, not a reimplementation — smallest and simplest of this spec's endpoints. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for all 9 endpoints in this spec. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Scoped to the exact requesting Employee; a different Employee and the assigned Manager both correctly excluded, verified by explicit tests. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; writes only to `TransferRequests`. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` validated via `Types.ObjectId.isValid()`; `identity.userId` (from the verified JWT) drives the ownership comparison. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T08`.

### Outcome

No Blocking findings. One routine Note recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T08` Merged.

---

## internal-transfer-workflow.T09 — Full Report

**Diff reviewed:** `src/services/workflow/recordTransitionAudit.ts` (new), `src/services/workflow/recordTransitionAudit.test.ts` (new); modifications to 8 already-Merged route files (`transfer-requests/route.ts`; `[id]/manager-decision/route.ts`; `[id]/hr-decision/route.ts`; `[id]/payroll-task/route.ts`; `[id]/it-task/route.ts`; `[id]/facilities-task/route.ts`; `[id]/hr-final-mapping/route.ts`; `[id]/withdraw/route.ts`) and their 8 corresponding test files, plus fixture corrections in 4 of those test files (see Findings).

**Acceptance:** `internal-transfer-workflow.AC1` — cited representatively; this task implements `constitution.md`'s audit-logging Non-Functional Constraint, not a dedicated AC of its own. The actual logging behavior is `transfer-audit-trail.AC1`.

### AC verification (by ID)

- **`AC1`** — **Pass, as scoped.** All 10 call sites verified individually: each successful transition appends exactly one `AuditLog` entry with the correct `action` string (matching `transfer-audit-trail.plan.md`'s pre-existing 10-action catalog exactly) and the correct `actorId`/`actorRole`. A representative blocked-path test per file confirms no entry is appended on failure, per `transfer-audit-trail.test_cases.md`'s `QT02`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above — all 10 call sites, not a sample. |
| No AI-attribution in comments/commit messages | Pass | `recordTransitionAudit.ts`'s comment explains the single-point-of-contact rationale — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; a thin wrapper composing two already-Merged pieces (`appendAuditLogEntry`, and each of the 8 routes' existing identity/state). |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: each of the 10 new positive-assertion tests failed with `Expected length: 1, Received length: 0` before its corresponding call site was wired, one file at a time, not as one large untested batch. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development` pending this Merge decision (this is the last task, so a Merge here moves it to `In QA`). |
| Readability, naming, DRY, consistency with codebase patterns | Pass | One shared helper reused identically at all 10 sites — no per-file reimplementation of the audit-append logic. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements introduced; `AuditLog` entries store `actorId`/`actorRole` only, per `T01`'s already-reviewed schema. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint introduced — this task only adds one call inside 8 existing, already-reviewed endpoints. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass (N-A) | No authorization logic touched or added — `recordTransitionAudit` is called only after each route's own existing authorization/state checks already passed. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Writes only to the already-approved `AuditLogs` collection via `T01`/`T02`'s already-reviewed schema and append function. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `recordTransitionAudit`'s three parameters (`transferRequestId`, `actor`, `action`) are all derived from already-validated route-internal state (`transferRequest._id`, `authResult.identity`, a fixed literal action string) — never raw client input. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (worth explicit reviewer attention, non-blocking) — this diff touches 8 already-Merged files, including their test files, by this task's own explicit design.** `T09`'s own prompt file names exactly this ("adds one call at the end of each") as its purpose — not scope creep. Each file's own core business logic (validation, authorization, state transitions) was left untouched; only one `await recordTransitionAudit(...)` line was added per success path (two in `T04`/`T05`, one each elsewhere).

**Note (worth explicit reviewer attention, non-blocking) — a real pre-existing test-fixture gap was found and fixed, not introduced by this task.** Several already-Merged test files' *success-path* tests used non-`ObjectId` string literals (`"hr-user"`, `"payroll-user"`, `"it-user"`, `"facilities-user"`, `"a-different-hr-user"`) as the caller's `userId`. These were harmless before this task (nothing previously persisted that value as a typed field) but would have caused a Mongoose cast error the moment `actorId: Schema.Types.ObjectId` tried to store them. Fixed by substituting real `new Types.ObjectId().toString()` values at each affected success-path call site; every affected file's full pre-existing suite was re-run and confirmed still green *before* adding this task's own new tests, isolating the fixture fix from the new feature work.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff, or for any of the 8 files it modifies (none has been committed since being Merged in earlier reviews). When committed, reference `Implements internal-transfer-workflow.T09`.

### Outcome

No Blocking findings. Two findings flagged for explicit reviewer awareness (the intentional multi-file touch; the pre-existing fixture gap found and fixed) plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T09` Merged.

---

## internal-transfer-workflow.T10 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/mine/route.ts` (new), `src/app/api/transfer-requests/mine/route.test.ts` (new). `internal-transfer-workflow.spec.md`/`tasks.md` amended to add `API10`/`AC20`–`AC24`/`UT20`–`UT24`/`T10` (spec reopened from `In QA` to `In Development` for this task only).

**Acceptance:** `internal-transfer-workflow.AC20`, `AC21`, `AC22`, `AC23`, `AC24`. API Contract: `API10`.

**Origin, for reviewer context:** this task didn't exist when the spec first reached `In QA`. It closes a gap found while scoping `stakeholder-panel-ui.spec.md`'s screens: no endpoint let Manager/HR/Payroll/IT/Facilities discover which request(s) need their action, or let Employee list their own requests beyond one already-known `id`.

### AC verification (by ID)

- **`AC20`** — **Pass.** Employee sees every request they submitted regardless of status (both a `Completed` and a `Pending: Manager` request returned; a different Employee's request excluded).
- **`AC21`** — **Pass.** Manager sees only their own `assignedManagerId` match in `Pending: Manager`; a second test confirms a request assigned to the caller but in a different status is excluded, not just that other Managers' requests are excluded.
- **`AC22`** — **Pass.** HR sees `Pending: HR` plus fully-task-completed `Pending: Payroll, IT, Facilities` requests; a partially-completed one (2 of 3 tasks done) is correctly excluded, proving the `$or` filter's second branch requires all three, not any.
- **`AC23`** — **Pass.** One test per role (Payroll/IT/Facilities), each confirming only its own task-status field gates inclusion, independent of the other two.
- **`AC24`** — **Pass.** Admin gets 403, directed conceptually (via the spec's own contract note) to `transfer-admin-oversight`'s existing endpoints instead of a second unfiltered view.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one code comment explains the Admin-exclusion rationale (a real design decision) and no client-supplied filter exists — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; a new read endpoint over the existing `TransferRequests` collection, consistent with the already-documented Workflow Engine Service module. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 9 tests failed with `Cannot find module './route'` before the file existed; passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | `internal-transfer-workflow.spec.md`'s Status correctly shows `In Development (reopened...)`, not left stale at `In QA` while an unmerged task exists. `status.md`'s Active Specs table and Daily Execution Log both updated same session. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | One `switch` on role, one Mongoose filter per branch — no shared abstraction was warranted for 6 mutually exclusive, structurally different filters. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | Same "none, deferred" treatment already applied project-wide to authenticated, non-public endpoints. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Every branch is scoped to the caller's own role/identity (`userId`, `role` from the authenticated JWT) — no role can see another role's or another individual's queue; Admin explicitly excluded rather than silently allowed through with an empty/unfiltered result. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Read-only; no new collection; reads only the already-approved `TransferRequests` collection. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | Every filter is built entirely from server-side, JWT-derived `role`/`userId` and fixed literal status/task-status strings — the request has no query parameters or body at all. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (worth explicit reviewer attention, non-blocking) — this task reopened an already-`In QA` spec.** `internal-transfer-workflow.spec.md`'s Status was moved back to `In Development` to reflect that a task now exists unmerged, rather than leaving the spec mismarked `In QA` while `T10` was outstanding. This is a real, honest status regression, not an error — it returns to `In QA` once this task Merges (this is now the only outstanding task in the spec).

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T10`.

### Outcome

No Blocking findings. One finding flagged for explicit reviewer awareness (the spec reopening, itself by design) plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T10` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-19). `internal-transfer-workflow.T10` is Merged — all 10 tasks in this spec are now Merged; Status returns to `In QA`.

---

## internal-transfer-workflow.T11 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/route.ts` (changed), `src/app/api/transfer-requests/[id]/route.test.ts` (changed — one pre-existing assertion repointed, two new tests added). `internal-transfer-workflow.spec.md` amended (`AC19` text, `UT19` reworded, `UT19a` added; spec reopened `In QA` → `In Development` for this task only).

**Acceptance:** `internal-transfer-workflow.AC19`, as amended 2026-09-20. API Contract: `API02`.

**Origin, for reviewer context — read before the AC verification below:** this task did not exist when the spec first reached `In QA`. While building `stakeholder-panel-ui.T06`'s Manager Decision panel, `T05`'s shared `RequestDetail` base was found to call `API02` unconditionally to render anything at all — but `API02` was Employee-owner-only with no exception, so a Manager opening `/my-requests/{id}` to decide on their own assigned request would 403 before ever seeing an Approve/Reject action. This wasn't just an over-restrictive implementation choice (unlike `org-structure-management.T03`'s earlier fix) — `AC19`'s literal, already Gate-1-Approved text rejected *any* non-Employee role unconditionally, so the fix required amending the AC itself, not just relaxing the code. **This amendment needs the Gate 1 reviewer's own re-confirmation — flagging this prominently rather than treating a Gate 2 pass as sufficient sign-off for a spec-level AC change.**

### AC verification (by ID)

- **`AC19`** — **Pass, against the amended text.** Owning Employee still gets 200 (pre-existing test, unchanged, still passes). The assigned Manager now gets 200 while the request is `Pending: Manager` (`UT19a`, new). An unrelated Manager (not assigned to this request) still gets 403 (`UT19`, repointed from the request's own assigned Manager to a genuinely unrelated one — the old assertion was testing a case the amendment now deliberately makes legal, so it had to change, not just be left to fail). The assigned Manager is still 403 once the request has moved past `Pending: Manager` (new test) — confirms `assignedManagerId` matching alone isn't sufficient, status must also match, per `AC21`'s own eligibility rule being reused exactly. HR/Payroll/IT/Facilities and Admin are unchanged — still 403 in every case (existing tests, untouched, still pass).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The new code comment explains the carve-out's rationale and its deliberate scope limit (Manager only, for now) — traceability to `T11`/`AC19`, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection/endpoint — a narrowly scoped condition added to an existing endpoint's existing authorization check. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: the new carve-out test failed (403 received, 200 expected) against the original code; the other 18 tests in the file, including the repointed `UT19`, already passed at that point, confirming the repoint itself wasn't hiding a second untested change. |
| `status.md` and spec Status updated same day | Pass | `internal-transfer-workflow.spec.md`'s Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. `status.md`'s Daily Execution Log entry explicitly separates the AC19 amendment (needs Gate 1 re-confirmation) from the code Gate 2 (this review). |
| Readability, naming, DRY, consistency with codebase patterns | Pass | One boolean (`isAssignedManagerOnPendingRequest`) computed the same way the existing `isOwningEmployee` check already was, combined with a single `if`, matching the existing handler's style — no new abstraction introduced for a two-condition check. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | Not a new endpoint; the existing endpoint's already-recorded "none, deferred" rate-limit decision is unchanged. |
| New dependencies vetted | Pass (N/A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | The carve-out is deliberately narrow: role must be exactly `Manager`, `assignedManagerId` must match the caller's own `userId` (not any Manager), and `status` must be exactly `Pending: Manager` (not "any status once assigned," which would have let a Manager keep viewing a request long after their own involvement ended). All three conditions are independently tested. No broadening beyond what `AC19`'s amendment actually states. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Read-only; no schema or collection change. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | The added check compares server-side JWT-derived `role`/`userId` against already-fetched document fields — no new filter, no client-supplied value used in a query. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (resolved, no longer blocking) — this task's own AC19 amendment has now been re-confirmed at Gate 1.** Test Reviewer re-confirmed the `AC19` wording change on 2026-09-20 (see `gate1-review-internal-transfer-workflow.md`'s "Re-confirmation — AC19 amendment" section). This task's own Gate 2 code review remains the only outstanding sign-off before Merge.

**Note (non-blocking) — this task reopened an already-`In QA` spec, for the second time.** Same honest-regression pattern as `T10`'s own reopening — returns to `In QA` once this task Merges, since it's now the only outstanding task.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements internal-transfer-workflow.T11`.

### Outcome

No Blocking findings. The Gate 1 re-confirmation flagged above is now resolved; two routine Notes remain.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T11` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `internal-transfer-workflow.T11` is Merged — all 11 tasks in this spec are now Merged; Status returns to `In QA`. `stakeholder-panel-ui.T06`'s own Gate 2 verdict remains separately required before it can Merge.

---

## internal-transfer-workflow.T12 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/route.ts` (changed — `GET` handler), `src/app/api/transfer-requests/[id]/route.test.ts` (changed — 5 new tests, no existing assertions modified this time). Spec reopened `In QA` → `In Development` for this task only; no further AC amendment (`AC19`'s 2026-09-20 text already generically covers these roles and was already Gate 1 re-confirmed under `T11`).

**Acceptance:** `internal-transfer-workflow.AC19` (already amended and Gate 1 re-confirmed under `T11` — this task is pure implementation of the already-approved text for the remaining roles).

**Origin, for reviewer context:** added after auditing `stakeholder-panel-ui.T07`–`T11` for the same class of blocker `T06` hit against Manager — confirmed each of HR/Payroll/IT/Facilities would 403 from `RequestDetail`'s shared data fetch the same way, before their own action panels could ever render. By explicit user decision, built as one task covering all three remaining roles rather than one per consuming `stakeholder-panel-ui` task, since HR's `AC22`-based clause already covers both `T07` and `T11`'s needs.

### AC verification (by ID)

- **`AC19`** — **Pass.** HR: 200 while `Pending: HR` (serves `T07`); 403 on `Pending: Manager` (not yet HR's turn); 200 once all three parallel tasks are `Completed` regardless of the outer status still being `Pending: Payroll, IT, Facilities` (serves `T11`'s final-mapping need); 403 while only 2 of 3 are `Completed` — proving the condition requires *all three*, not "any complete enough" heuristic. Payroll/IT/Facilities (one `it.each` sweep each): 200 while `Pending: Payroll, IT, Facilities` and their own task is still `Pending`; 403 once their own task is already `Completed` (they're done, no longer need to view it for action purposes); Payroll 403 on an unrelated `Pending: HR` request. All of `T03`'s original tests and `T11`'s own Manager carve-out tests re-verified unmodified and still passing — this task only adds new allowed cases, none of the existing conditions were narrowed or altered.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The new code comment explains the four added conditions' rationale and non-person-specific nature — traceability to `T12`/`AC19`, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection/endpoint — four additional boolean conditions on an existing endpoint's existing authorization check. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: exactly the 5 new positive-case tests failed (403 received, 200 expected) against the original code; all 25 existing tests in the file, including `T11`'s own, already passed at that point. |
| `status.md` and spec Status updated same day | Pass | Spec Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Four named booleans (`isEligibleHr`/`isEligiblePayroll`/`isEligibleIt`/`isEligibleFacilities`) combined into one `isEligibleViewer` — same style as `T11`'s own two-boolean pattern, scaled up without introducing a lookup table or role-to-predicate map for what's still a small, fixed, clearly-enumerable set of conditions. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | Not a new endpoint; unaffected. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Each of the four new conditions is independently tested for both its positive case and at least one adjacent negative case (wrong status, or task already `Completed`) — none of them grants access "for the rest of the request's lifetime" once a role's involvement ends, matching `AC23`'s own "still `Pending`" qualifier literally rather than loosely. HR's rule intentionally is not person-specific, matching the already-approved non-routing behavior of `hr-decision`/`hr-final-mapping` — this is a deliberate, previously-approved policy, not a new gap introduced here. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Read-only; no schema change. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | All four new conditions compare server-side JWT-derived `role` against already-fetched document fields — no new filter, no client-supplied value used in a query. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (non-blocking) — this task reopened an already-`In QA` spec, for the third time.** Same honest-regression pattern as `T10`/`T11`'s own reopenings — returns to `In QA` once this task Merges, since it's now the only outstanding task.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements internal-transfer-workflow.T12`.

### Outcome

No Blocking findings. Two routine Notes.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T12` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `internal-transfer-workflow.T12` is Merged — all 12 tasks in this spec are now Merged; Status returns to `In QA`. `stakeholder-panel-ui.T07` remains blocked only on `user-management-console.T07`'s own separate Gate 2 verdict for its Manager-selector needs (`T11`), and is fully unblocked for its own HR-Decision-panel scope now.

---

## internal-transfer-workflow.T13 — Full Report

**Diff reviewed:** `src/services/workflow/TransferRequest.ts` (changed — new enum value), `src/services/workflow/allParallelTasksCompleted.ts` (new), `src/app/api/transfer-requests/[id]/payroll-task/route.ts`, `.../it-task/route.ts`, `.../facilities-task/route.ts` (changed — transition logic), `src/app/api/transfer-requests/[id]/hr-final-mapping/route.ts` (changed — simplified precondition), `src/app/api/transfer-requests/[id]/route.ts` (changed — `pendingStakeholdersFor` new case, `isEligibleHr` simplified), `src/app/api/transfer-requests/mine/route.ts` (changed — HR branch simplified). Test files changed: `TransferRequest.test.ts`, all three task-completion route tests (new AC25 describe blocks), `hr-final-mapping/route.test.ts` (fixtures updated to the new invariant, one new test), `[id]/route.test.ts` (new enum case, HR carve-out tests rewritten), `mine/route.test.ts` (AC22 fixture updated). `internal-transfer-workflow.spec.md` amended (`AC13`/`AC14`/`AC18`/`AC22` text, new `AC25`, `UT13`/`UT14`/`UT22` reworded, new `UT25`; spec reopened `In QA` → `In Development` for this task only).

**Acceptance:** `internal-transfer-workflow.AC13`, `AC14`, `AC18`, `AC22` (all amended 2026-09-20), `AC25` (added 2026-09-20). **All amendments need the Gate 1 reviewer's own re-confirmation** — same standing practice as `AC19`'s and `user-management-console.AC13`'s earlier amendments this session.

**Origin, for reviewer context:** added at the reviewer's own explicit direction during `stakeholder-panel-ui.T11`'s Gate 2 review. That task's own evidence had flagged a non-obvious gating decision: `API02`'s response carried no field showing individual task-completion progress, so the frontend's HR Final Mapping panel could only infer "all 3 tasks done" indirectly, via `T12`'s carve-out only ever letting the fetch succeed once that was true. The reviewer directed that a new status be introduced to make this directly observable instead of inferred.

### AC verification (by ID)

- **`AC25`** (new) — **Pass.** Each of the three task-completion endpoints, tested independently: transitions to `Pending: Transfer` only when it is genuinely the *last* of the three to complete (the other two already `Completed` beforehand); stays `Pending: Payroll, IT, Facilities` when either of the other two is still `Pending`. Confirmed for all three roles (Payroll/IT/Facilities), each triggering the transition correctly regardless of which one happens to finish last — matching AC25's "regardless of completion order" wording.
- **`AC13`/`AC14`** (amended) — **Pass.** `hr-final-mapping` now succeeds only when `status === "Pending: Transfer"` and 409s otherwise — including a new, deliberately adversarial test proving status is now authoritative: all three task fields `Completed` but status artificially still `Pending: Payroll, IT, Facilities` still 409s. This is the test that would have passed incorrectly under the old field-based check, so its presence is itself evidence the simplification is real, not cosmetic.
- **`AC18`** (amended) — **Pass.** `pendingStakeholdersFor("Pending: Transfer")` returns `["HR"]`, verified via the existing exhaustive status/pendingStakeholders `it.each` table in `[id]/route.test.ts`, now covering all 7 statuses.
- **`AC22`** (amended) — **Pass.** `API10`'s HR branch now returns `Pending: HR` and `Pending: Transfer` requests, and correctly excludes one still `Pending: Payroll, IT, Facilities` (2 of 3 tasks done) — the query itself is now two literal status equality checks, no longer a three-field completeness check.
- **Cross-cutting regression check** — `API02`'s HR carve-out (`T12`) was also simplified the same way; re-verified its own full test block (`Pending: HR` → 200, `Pending: Manager` → 403, `Pending: Transfer` → 200, and the new adversarial "all 3 fields Completed but status not yet Transfer" → still 403) all pass. Payroll/IT/Facilities's own carve-out conditions were deliberately left untouched (out of this task's scope) and re-verified unaffected.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Every new/changed comment explains the status's rationale and the "now authoritative, not re-derived" simplification — traceability to `T13`/`AC25`, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | New enum value on an existing collection, not a new collection/module/datastore — no ADR trigger. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: 13 failures across 7 test files, each for the expected reason (enum rejection, wrong status after transition, 200 instead of 409, missing `pendingStakeholders` case) — none was a false Red from an unrelated bug (one self-caught test-authoring mistake, non-ObjectId caller IDs on newly-added tests that reach the audit-log save path, fixed before treating the Red as confirmed — recorded here, not silently corrected). |
| `status.md` and spec Status updated same day | Pass | Spec Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. `status.md`'s entry names the reviewer's own direction as this task's origin. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | `allParallelTasksCompleted` is a genuinely warranted extraction — the exact same 3-field check was about to be tripled across `payroll-task`/`it-task`/`facilities-task`, unlike earlier single-use cases in this project where extraction was deliberately deferred. |

**Existing test fixtures deliberately updated, not silently left inconsistent:** `hr-final-mapping/route.test.ts`'s success-path fixtures previously constructed a `TransferRequest` directly with `status: "Pending: Payroll, IT, Facilities"` and all three task fields already `Completed` — a state the new atomic-transition design should never actually produce. Rather than leave these tests passing for the wrong reason (or failing), `createRequest`'s `status` parameter was made overridable and every success-path fixture updated to `"Pending: Transfer"`, matching the real invariant. The 409 fixtures correctly kept `"Pending: Payroll, IT, Facilities"` as-is.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint; four existing endpoints' internal logic changed, rate limits unaffected. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | No role gains or loses access relative to before this task — `hr-final-mapping`'s gate is logically equivalent to its old one under the now-enforced invariant (status and task fields can never disagree), and `API02`/`API10`'s HR branches are simplified restatements of the same eligibility, not a widening. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Same collection, one new enum value — no new datastore. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | All changed queries/conditions compare against literal status strings or server-computed task-field values — no client input reaches any of them. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** verified with `next build` that all routes still compile with no regressions. Full suite 621/621 (620 after this task's own changes, +1 from `stakeholder-panel-ui.T11`'s own revision test, both verified together).

### Findings

**Note (resolved, no longer blocking) — `AC13`/`AC14`/`AC18`/`AC22`'s amendments and new `AC25` have now been re-confirmed at Gate 1.** Test Reviewer re-confirmed the full batch on 2026-09-20 (see `gate1-review-internal-transfer-workflow.md`'s "Re-confirmation — AC13/AC14/AC18/AC22 amendments and new AC25" section).

**Note (non-blocking) — this task reopened an already-`In QA` spec, for the fourth time this session.** Same honest-regression pattern as `T10`/`T11`/`T12`'s own reopenings — returns to `In QA` once this task Merges.

**Note (non-blocking) — a self-caught test-authoring mistake, recorded not silently fixed.** Newly-added tests in the three task-completion route test files initially used non-ObjectId placeholder strings (`"payroll-user"`, etc.) as the caller id, which fails `AuditLog` validation once the call path actually reaches a successful save (unlike the file's pre-existing 409-path tests, which never reach that code). Fixed by using `new Types.ObjectId().toString()`, matching the file's own existing convention for success-path tests.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements internal-transfer-workflow.T13`.

### Outcome

No Blocking findings. The Gate 1 re-confirmation flagged above is now resolved; routine Notes remain.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `internal-transfer-workflow.T13` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `internal-transfer-workflow.T13` is Merged — all 13 tasks in this spec are now Merged; Status returns to `In QA`. `stakeholder-panel-ui.T11`'s own merge-ordering dependency on this task is now cleared; only `T11`'s own Gate 2 verdict remains outstanding.
