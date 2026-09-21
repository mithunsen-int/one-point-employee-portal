# Gate 2 Evidence — org-structure-management

One running file per feature for this gate. Each task gets one appended row below, plus its full findings report in this same file. Never overwritten or removed.

## Summary Table

| Task ID | Date | Reviewer (named human) | Verdict | Blocking findings | Reference |
|---|---|---|---|---|---|
| org-structure-management.T01 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#org-structure-managementt01--full-report) |
| org-structure-management.T02 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#org-structure-managementt02--full-report) |
| org-structure-management.T03 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#org-structure-managementt03--full-report) |

---

## org-structure-management.T01 — Full Report

**Diff reviewed:** `src/services/org-structure/Department.ts` (new), `src/app/api/departments/route.ts` (new), `src/app/api/departments/route.test.ts` (new), `src/app/api/departments/[id]/route.ts` (new), `src/app/api/departments/[id]/route.test.ts` (new).

**Acceptance:** `org-structure-management.AC1`–`AC6`, `AC13`. API Contract: `API01`–`API04`.

### AC verification (by ID)

- **`AC1`** — **Pass.** Admin creates a Department with a valid name → 201.
- **`AC2`** — **Pass.** Full 6-role sweep (Employee, HR, Manager, Payroll, IT, Facilities) blocked 403 from create; Manager specifically also verified blocked from edit and delete (`QT03`).
- **`AC3`** — **Pass.** Duplicate name on create → 409, verified via a real `countDocuments` check that no duplicate was created, not just the response code.
- **`AC4`** — **Pass.** Edit updates the record and returns 200 (`UT04`); editing a name to collide with a *different* existing record also correctly 409s (`QT05`), not just the "same record, unchanged name" trivial case.
- **`AC5`** — **Pass.** Delete removes the record (verified via `findById` returning `null` afterward, a genuine hard delete, not just checking the response) and returns 200; a second delete of the same id correctly 404s (`QT06`).
- **`AC6`** — **Pass.** List returns all records, and correctly returns an empty array when none exist (`QT08`) rather than erroring or omitting the check.
- **`AC13`** — **Pass.** Both a missing `name` and an empty-string `name` correctly 400 naming the field (`UT13`/`QT16`).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `[id]/route.ts`'s one comment explains the `withAuthorization`-plus-dynamic-`context` composition pattern — a real design note, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `Departments` is a new collection within the already-approved MongoDB datastore (no ADR trigger, per the plan); Org Structure Service is already named in `architecture.md`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 25 tests failed with `Cannot find module` before the files existed. |
| `status.md` and spec Status updated same day | Pass | Both updated same session (2026-09-19); spec Status moved `Tasks Generated` → `In Development` in the same edit as this task's work, not left to drift (the exact gap caught retroactively in `rbac-api-security`'s and `user-management-console`'s earlier reviews). |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Straightforward, minimal schema matching the plan's Data Model exactly. Reuses `T05`'s pre-existing `admin.departmentRoleManagement` action rather than inventing a new one. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling — this diff only manages Department names. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for every endpoint here — authenticated, Admin-only, low-volume administrative CRUD — explicit, not omitted. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Every endpoint (`POST`/`GET`/`PATCH`/`DELETE`) is wrapped in `withAuthorization("admin.departmentRoleManagement", ...)` — deny-by-default, verified by explicit 401/403 tests per endpoint, not just assumed from the wrapper's own prior test coverage. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; nothing new introduced. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` is validated via `Types.ObjectId.isValid()` before use; `name` is used as a literal scalar value in `create()`/assignment, never spread into a filter. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — first real use of `withAuthorization`, and a new composition pattern for dynamic routes.** `rbac-api-security.T06`'s Gate 2 review flagged that `withAuthorization` had no consumer yet; this task is that consumer. Since the wrapper only takes a single `request` argument and this route also needs the dynamic `[id]` segment's async `params`, the pattern used here is `withAuthorization(action, async (req) => { const { id } = await context.params; ... })(request)`, closing over `context` from the outer route handler rather than changing the wrapper's signature. Worth adopting as the standard pattern for any future dynamic route that needs both `withAuthorization` and route params (`org-structure-management.T02`'s `JobRoles` routes will need the identical shape).

**Note (non-blocking) — `Departments` deletion is a genuine hard delete, unlike `Users`' soft delete.** Confirmed intentional, per the plan's explicit "otherwise minimal" schema (no `deletedAt` field). The referential-integrity question (a transfer request referencing a deleted Department) remains the same open, cross-spec gap already tracked in the plan's Explicitly Deferred section — unchanged by this diff, not newly introduced.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements org-structure-management.T01`.

### Outcome

No Blocking findings. Three non-blocking Notes recorded, one of them establishing a reusable pattern for `T02`.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `org-structure-management.T01` Merged.

---

## org-structure-management.T02 — Full Report

**Diff reviewed:** `src/services/org-structure/JobRole.ts` (new), `src/app/api/job-roles/route.ts` (new), `src/app/api/job-roles/route.test.ts` (new), `src/app/api/job-roles/[id]/route.ts` (new), `src/app/api/job-roles/[id]/route.test.ts` (new).

**Acceptance:** `org-structure-management.AC7`–`AC13`. API Contract: `API06`–`API09`.

### AC verification (by ID)

- **`AC7`** — **Pass.** Admin creates a Job Role with a valid title → 201.
- **`AC8`** — **Pass.** Full 6-role sweep blocked 403 from create (`QT10`); Manager specifically also verified blocked from edit and delete (`QT11`).
- **`AC9`** — **Pass.** Duplicate title on create → 409, verified via `countDocuments` that no duplicate was created.
- **`AC10`** — **Pass.** Edit updates the record and returns 200 (`UT10`); editing to collide with a *different* record's title also 409s (`QT13`).
- **`AC11`** — **Pass.** Delete removes the record (hard delete, verified via `findById` → `null`) and returns 200; a second delete of the same id 404s.
- **`AC12`** — **Pass.** List returns all records, including the empty-list case (`QT15`).
- **`AC13`** — **Pass.** Missing and empty-string `title` both 400 naming the field.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | No new comments introduced (structure mirrors `T01`, whose comment already explains the composition pattern). No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `JobRoles` is a new collection within the already-approved datastore, same as `T01`'s `Departments` — no ADR trigger. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 25 tests failed with `Cannot find module` before the files existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19). |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Reuses `T01`'s exact `withAuthorization`+closed-over-`context` composition pattern verbatim, as that review's own Note recommended — no drift between the two structurally-identical entities' implementations. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling — this diff only manages Job Role titles. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Same plan-level "none, deferred" decision already covering this endpoint set (`API06`–`API09` are listed alongside `API01`–`API04` in the plan's single rate-limit statement). |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Every endpoint wrapped in `withAuthorization("admin.departmentRoleManagement", ...)`, same as `T01`; verified with explicit 401/403 tests per endpoint. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; nothing new introduced. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` validated via `Types.ObjectId.isValid()`; `title` used as a literal scalar value, never spread into a filter. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — 409 error code intentionally kept as `"name_exists"` for Job Role conflicts, not `"title_exists"`.** `API06`/`API07`'s spec text ("identical shapes... substituting title for name") is genuinely ambiguous about whether that substitution extends to the literal error code string. `QT13`, a concrete QA-derived test case, explicitly expects `{ "error": "name_exists" }` for a Job Role title conflict — followed as the more concrete, authoritative source. Worth a spec clarification so this isn't left to inference the next time a similar "identical shapes, substituting X for Y" endpoint is built.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements org-structure-management.T02`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `org-structure-management.T02` Merged.

---

## org-structure-management.T03 — Full Report

**Diff reviewed:** `src/app/api/departments/route.ts` (modified — `GET` handler), `src/app/api/departments/route.test.ts` (modified — list-view auth test), `src/app/api/job-roles/route.ts` (modified — `GET` handler), `src/app/api/job-roles/route.test.ts` (modified — list-view auth test).

**Acceptance:** `org-structure-management.AC6`, `AC12`.

**Origin:** found while scoping `stakeholder-panel-ui.T04` — an Employee submitting a transfer request needs to read both lists to populate required dropdowns (`internal-transfer-workflow.API01`), but both were Admin-only, confirmed directly against the route code (`withAuthorization("admin.departmentRoleManagement", ...)` on the `GET` handlers, not just the mutations). Checked the spec's own ACs before proposing a fix: `AC2`/`AC8` restrict only create/edit/delete to Admin; `AC6`/`AC12` (the list-view ACs) never state an Admin-only restriction — the 403 was an implementation choice stricter than what was ever specified, not a decided requirement being weakened.

### AC verification (by ID)

- **`AC6`/`AC12`** — **Pass.** Both list endpoints now return 200 for any authenticated role (verified via a full 6-role sweep: Employee/Manager/HR/Payroll/IT/Facilities) and 401 with no token. `POST`/`PATCH`/`DELETE` are unchanged — still Admin-only, per `AC2`/`AC8`, not touched by this diff.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Both route comments explain the fix and cite the ACs that justify it — traceability, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; a permission-scope correction on an already-existing endpoint, not a new capability. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | The new 6-role-sweep tests (replacing each file's old single "403 for non-Admin" test) were confirmed Red — all 12 failed with `403` received where `200` was expected — against the original implementation, before the fix. **A pre-existing, explicit test assertion was deliberately changed, not silently weakened:** each file's old "responds 403 for a non-Admin caller" test encoded an assumption stricter than any AC ever required; replaced with a fuller, more accurate assertion per the same ACs, not removed or loosened without cause. |
| `status.md` and spec Status updated same day | Pass | `org-structure-management.spec.md`'s Status moved `In QA` → `In Development` same day this task was added, reflecting the real state (an unmerged task exists) rather than left stale. |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Matches the plain `authenticateRequest` pattern already used elsewhere in the project for endpoints needing authentication without a specific role/permission gate. |

**One transient test-infra flake observed and ruled out, worth recording for awareness:** a single full-suite run showed 24 failures across 2 unrelated suites with a much longer-than-normal runtime (77s vs. the usual ~12s); an immediate re-run passed cleanly at the normal runtime. Treated as `mongodb-memory-server` resource contention on that one run, not a regression from this diff — the same suite has since passed cleanly multiple times.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling changed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint; existing rate-limit posture (none, deferred — authenticated internal endpoints) unchanged. |
| New dependencies vetted | Pass (N-A) | None introduced. |
| Auth boundaries / least-privilege checked | Pass, deliberately widened | This is the one Gate 2 item where the change *is* a boundary change: reads are now open to any authenticated role, by explicit user decision, weighed against the alternative (a second, narrower endpoint) and against leaving `stakeholder-panel-ui.T04` blocked. Mutations remain fully Admin-gated, unchanged. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; same collections, same fields returned. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass | Both `GET` handlers take no client-supplied filter at all — unchanged `find()` with no arguments. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (worth explicit reviewer attention, non-blocking) — this is a genuine access-control widening, not a bug fix in the usual sense.** Flagged explicitly in the Security Checklist above rather than folded in as a routine Pass, since "who can read this data" is exactly the kind of change that deserves a deliberate second look, even though it was resolved by explicit user decision after considering alternatives.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements org-structure-management.T03`.

### Outcome

No Blocking findings. One Finding-level Note flagging the deliberate access-control widening for explicit reviewer sign-off, plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `org-structure-management.T03` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `org-structure-management.T03` is Merged — all 3 tasks in this spec are now Merged; Status returns to `In QA`.
