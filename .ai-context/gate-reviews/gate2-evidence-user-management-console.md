# Gate 2 Evidence — user-management-console

One running file per feature for this gate. Each task gets one appended row below, plus its full findings report in this same file. Never overwritten or removed.

## Summary Table

| Task ID | Date | Reviewer (named human) | Verdict | Blocking findings | Reference |
|---|---|---|---|---|---|
| user-management-console.T01 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#user-management-consolet01--full-report) |
| user-management-console.T02 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#user-management-consolet02--full-report) |
| user-management-console.T03 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#user-management-consolet03--full-report) |
| user-management-console.T04 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#user-management-consolet04--full-report) |
| user-management-console.T05 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#user-management-consolet05--full-report) |
| user-management-console.T06 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#user-management-consolet06--full-report) |
| user-management-console.T07 | 2026-09-20 | Test Reviewer | Merged | None (AC13 Gate 1 re-confirmed 2026-09-20) | [Full report](#user-management-consolet07--full-report) |

---

## user-management-console.T01 — Full Report

**Diff reviewed:** `src/services/users/User.ts` (new), `src/services/users/User.test.ts` (new), `src/services/db/connect.ts` (new), `src/services/db/connect.test.ts` (new), `src/test-utils/mongoServer.ts` (new), `package.json`/`package-lock.json` (adds `mongoose`, `mongodb-memory-server`; adds an `overrides` entry pinning `mongodb` to `~7.2.0`).

**Acceptance:** `user-management-console.AC5`, `AC15` — realized here at the schema/database-index level (the endpoint-level 409 responses these ACs describe belong to `T03`/`T06`, not this task, matching the same "cited representatively" pattern already established by `rbac-api-security.T01`'s Gate 2 review).

### AC verification (by ID)

- **`AC5`** — **Pass, as scoped.** The `username` unique index rejects a second document with a duplicate `username` at the database level — the exact mechanism `T03`'s future `POST /users` handler needs to turn into a 409. This task does not itself return a 409 (no route handler exists yet, correctly out of scope per its own "do not touch" list).
- **`AC15`** — **Pass, as scoped.** The `{ role: "Admin", deletedAt: null }` partial unique index rejects a second active Admin, and — verified directly, not just assumed — correctly *allows* a new Admin once the prior one is soft-deleted (the entire reason a partial index was chosen over a full one). Same "mechanism now, endpoint later" scoping as `AC5`, deferred to `T06`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above, including the explicit scope boundary. |
| No AI-attribution in comments/commit messages | Pass | No comments in `User.ts`/`connect.ts`. `User.test.ts`'s one comment explains why the soft-deleted-Admin case is tested despite no distinct QA row — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `Users` is already the architecture's named collection (referenced by `rbac-api-security`/`internal-transfer-workflow`'s plans); this task fills in its authoritative schema, not a new architectural surface. The `mongodb` version pin is a build/tooling fix for a known upstream driver bug, not a project decision on `ADR-0001`'s scale. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 8 new tests (7 schema + 1 `connect.ts`) failed with `Cannot find module` before their respective files existed. |
| `status.md` and spec Status updated same day | Pass | Both updated same session (2026-09-18). Also caught and pre-emptively avoided the same drift `rbac-api-security`'s Gate 2 review found: the spec's own `## Status` field was moved to `In Development` immediately, not left stale. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Schema fields match the plan's Data Model table exactly, field-for-field. `connect.ts` follows the standard Mongoose-connection-caching pattern; `mongoServer.ts` is clearly separated under `src/test-utils/` (not `src/services/`) specifically so a devDependency (`mongodb-memory-server`) can never be pulled into a production bundle. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | `passwordHash` is stored as an opaque field only (hashing itself is `T02`'s scope); `connect.ts` reads `MONGODB_URI` from the environment only, never hardcoded or logged. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint introduced — schema and connection utility only. |
| New dependencies vetted | Pass | `mongoose` — the standard, widely-used MongoDB ODM (already the project's declared sole-datastore driver in `constitution.md`). `mongodb-memory-server` — dev-only, `src/test-utils/` isolation confirmed above. The `mongodb@~7.2.0` override is a deliberate, documented downgrade from a version with a known regression, not an unvetted dependency. `npm audit`: 0 vulnerabilities. |
| Auth boundaries / least-privilege checked | Pass (N-A) | No authorization logic in this diff — schema only. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the constitution's sole datastore; no new datastore introduced. `MONGODB_URI` (which would carry any transport/auth config, e.g. TLS) is environment-supplied, not hardcoded. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No query-filter code in this diff — `User.create()`/`.validate()` calls in tests use fixed, literal field values, not client input. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities. Same project-wide no-SAST/DAST-tooling gap already noted elsewhere, not new here. |

### Findings

**Note (non-blocking) — `mongodb` driver pinned via `overrides`, tracking an upstream bug.** `package.json` now pins `mongodb` to `~7.2.0` (both `mongoose` and `mongodb-memory-server-core` resolve to it, confirmed via `npm ls mongodb`) to work around [typegoose/mongodb-memory-server#1026](https://github.com/typegoose/mongodb-memory-server/issues/1026), a client-metadata handshake regression in driver `7.6.0` under Jest. Worth revisiting this override once that upstream issue is fixed — not a permanent architectural decision, a temporary, documented workaround.

**Note (non-blocking) — `connect.ts` is unused by any route yet.** Built now as a necessary shared precondition (no schema is usable in production without a connection), but nothing calls it yet — `rbac-api-security`'s `userLookup.ts` stub is the nearest future consumer, once that spec's own follow-up work resumes.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements user-management-console.T01`.

### Outcome

No Blocking findings. Three non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `user-management-console.T01` Merged.

---

## user-management-console.T02 — Full Report

**Diff reviewed:** `src/services/users/passwordHashing.ts` (new), `src/services/users/passwordHashing.test.ts` (new).

**Acceptance:** `user-management-console.AC1`, `AC14` — cited representatively; the full registration/201 flows they describe belong to `T03`/`T06`, not this task (same scoping pattern already established by `T01`'s schema-level citation of the same ACs' database mechanics).

### AC verification (by ID)

- **`AC1`** — **Pass, as scoped.** `hashPassword()` correctly bcrypt-hashes at 12 rounds (verified via `bcrypt.getRounds()`, not just format-guessing), with unique salting per call and round-trip compatibility with `bcrypt.compare` — the exact function `T03`'s future registration handler needs to store a `passwordHash` correctly. This task does not itself create a user record or return 201.
- **`AC14`** — **Pass, as scoped.** Same utility, same verification; `T06`'s future self-registration handler is the actual consumer for the Admin-bootstrap path.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above, with the scope boundary stated explicitly. |
| No AI-attribution in comments/commit messages | Pass | `passwordHashing.ts` has no comments. `passwordHashing.test.ts`'s two comments explain the AC-representative-citation and why verification isn't built here — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | The bcrypt/12-rounds decision was already made and recorded in `user-management-console.plan.md`; this task implements it, introducing no new decision. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 5 tests failed with `Cannot find module './passwordHashing'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-18); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | A single-purpose, minimal wrapper — no scope creep into verification, matching this task's own "do not touch" boundary exactly. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff; raw passwords and hashes are never logged, including in the test file (literal test-only strings, never printed). |
| No secrets/credentials/tokens hardcoded or logged | Pass | No secret/credential handling beyond the hashing operation itself. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint introduced — utility function only. |
| New dependencies vetted | Pass (N-A) | No new dependency — `bcrypt` was already vetted and installed during `rbac-api-security.T02`'s review. |
| Auth boundaries / least-privilege checked | Pass (N-A) | No authorization logic in this diff. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Produces a hash for storage, never the raw password; consistent with the spec's Non-Functional Constraints on password handling. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No MongoDB interaction in this diff — pure function, no query. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — not yet called by any write path.** `hashPassword()` exists and is fully tested in isolation, but no endpoint calls it yet — that's `T03`/`T06`'s scope. No live effect until then. Correct scope boundary, not a defect.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements user-management-console.T02`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `user-management-console.T02` Merged.

---

## user-management-console.T03 — Full Report

**Diff reviewed:** `src/app/api/users/route.ts` (new), `src/app/api/users/route.test.ts` (new). Also, ahead of this diff: `tasks.md` corrected to add the missing `AC5` to this task's own Acceptance line (see Findings).

**Acceptance:** `user-management-console.AC1`–`AC6`, `AC11`. API Contract: `user-management-console.API01`.

### AC verification (by ID)

- **`AC1`** — **Pass.** Admin and HR both successfully register a new Employee with valid data; response excludes `passwordHash` (verified explicitly, not just the documented fields' presence).
- **`AC2`** — **Pass.** Manager, Payroll, IT, and Facilities all correctly rejected 403 attempting to register an Employee (full role sweep, `QT03`).
- **`AC3`** — **Pass.** Admin successfully registers each of HR, Manager, Payroll, IT, Facilities (full sweep, `QT04`).
- **`AC4`** — **Pass, as scoped.** Employee, Manager, Payroll, IT, Facilities all correctly rejected 403 attempting to register a Manager (full sweep, `QT05`). `QT06` (HR's authority over the other five roles) is explicitly out of scope per the spec's own Explicitly Out of Scope — correctly left untested, not silently assumed either way.
- **`AC5`** — **Pass.** Duplicate `username` correctly returns 409 `username_exists`, and a real `User.countDocuments` check confirms no duplicate record was created — not just the response code. This AC's Acceptance-line placement was corrected during this task (see Findings) before these tests were written.
- **`AC6`** — **Pass.** Missing `username`, `password`, `dateOfJoining`, and `managerId` (for `role: Employee`), plus an invalid `role` value, all correctly return 400 with the right field named.
- **`AC11`** — **Pass.** A non-existent `managerId` and a `managerId` referencing an existing Employee (not Manager) both correctly return 404 `manager_not_found`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `route.ts`'s one comment documents the `QT18` placeholder decision (see Findings) — a real, flagged design note, not attribution. `route.test.ts`'s trailing comment block documents deliberately-untested Open Questions — same category. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module, collection, or cross-cutting decision — composes existing pieces (`T01`, `T02`, `rbac-api-security.T04`). |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 25 tests failed with `Cannot find module './route'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-18); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Consistent with `login/route.ts`'s structure (validate → authorize → business logic → typed error branches). `USER_ROLES.filter` reuses `T01`'s exported role list rather than re-declaring it. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Raw password is hashed immediately via `T02`'s utility and never logged or echoed back in the response. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for `API01`–`API05` (authenticated, role-gated administrative actions) — an explicit decision, not an omission. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | 401 (no valid token) is checked before any body parsing; the 403 rule denies by default (`callerIsAllowed` must be explicitly true) rather than allow-by-default. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; nothing new introduced. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `managerId` is validated via `Types.ObjectId.isValid()` before use in a query; `username`/`role`/`dateOfJoining` are used as literal scalar values in a `create()` call, never spread into a filter. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Should-Fix (fixed before this diff was written) — `T03`'s Acceptance line was missing `AC5`.** `T01`'s own Gate 2 review already stated AC5's 409-response half is deferred to this endpoint, but `tasks.md` never actually listed `AC5` under `T03`. Corrected to match the joint-coverage pattern already used correctly for `rbac-api-security.AC10` (`T01`+`T02`), before this task's tests were written — not a defect in this diff, a pre-existing tracking gap caught and closed.

**Note (non-blocking) — design choice: hand-written 403 logic instead of `withAuthorization`.** The `AC2`–`AC4` rule depends on the request body's target `role`, which `rbac-api-security`'s fixed-action `withAuthorization`/`checkPermission` can't see. `T05`'s own Gate 2 review already anticipated this exact situation ("deferred to whichever endpoint has access to the specific record"). `authenticateRequest` (`T04`) is still reused for the 401 layer — only the fine-grained 403 decision is local to this handler. A deliberate, documented design choice, not a missed reuse opportunity.

**Note (non-blocking) — `QT18` placeholder decision.** `managerId` referencing a soft-deleted Manager is an unresolved Open QA Question. This implementation excludes soft-deleted Managers (`deletedAt: null` in the lookup query) as a necessary, concrete choice — flagged here and in the code comment, not a silent resolution. Worth confirming with product/QA once that question is formally answered; a one-line change either way if the answer differs.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements user-management-console.T03`.

### Outcome

No Blocking findings. One Should-Fix caught and corrected ahead of this diff (Acceptance-line gap). Three non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `user-management-console.T03` Merged.

---

## user-management-console.T04 — Full Report

**Diff reviewed:** `src/app/api/users/[id]/route.ts` (new — `PATCH`, `DELETE`), `src/app/api/users/[id]/route.test.ts` (new).

**Acceptance:** `user-management-console.AC7`, `AC8`, `AC12`, `AC13`. API Contract: `user-management-console.API02`, `API03`.

### AC verification (by ID)

- **`AC7`** — **Pass.** Admin successfully edits a Manager's role to HR (`UT09`) and a user's `username` (`QT11`); both return 200 with the updated record.
- **`AC8`** — **Pass.** Admin deletes a user; `deletedAt` is set (verified directly against the stored document, not just the 200 response), record never physically removed.
- **`AC12`** — **Pass.** HR successfully edits an Employee's `managerId` (`UT14`) and deletes an Employee record (`UT15`), both identically to Admin's authority over that record.
- **`AC13`** — **Pass.** HR is rejected 403 attempting to edit or delete each of HR/Manager/Payroll/IT/Facilities/Admin records — full 6-role sweep (`QT20`) for both endpoints, not just the spec's single Manager example.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | No comments in `route.ts`. `route.test.ts`'s trailing comment documents the `API02`/`UT14` field-list discrepancy and the untested Open Questions — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass, with a flagged finding | See Security Checklist below — one Note surfaced there is worth the reviewer's explicit attention. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; reuses `T01`'s schema and `rbac-api-security.T04`'s authentication. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 25 tests failed with `Cannot find module './route'` before the file existed. One test-fixture bug (missing `managerId` on an `Employee` fixture) was caught and fixed in the *test helper* during the same Red pass — not a case of retrofitting the implementation to match a wrong test. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-18); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | `canActOn()` is shared between `PATCH` and `DELETE` (same Admin-any/HR-Employee-only rule for both, per the spec) rather than duplicated. First use of Next 16's async dynamic route `params` in this project — awaited correctly before use. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff — `passwordHash` is never read, set, or returned by either handler. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for `API01`–`API05` (authenticated, role-gated administrative actions) — explicit, not omitted. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | **Flagged — see Note below** | 401/403 are correctly enforced for every tested case, deny-by-default. However: `PATCH`'s `role` field accepts any string coercible to a role with no guard against `role: "Admin"` — a path to the Admin role that bypasses `API06`'s dedicated bootstrap flow when no Admin currently exists. Not a defect *of this diff* (no AC asks for this guard, and inventing one unrequested would be scope creep) — but a real, concrete finding worth the reviewer's explicit decision, not silently left implicit. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; nothing new introduced. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id`/`managerId` are validated via `Types.ObjectId.isValid()` before use in a query; `username`/`role` are assigned as literal scalar values on the fetched document, never spread into a filter. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (worth explicit reviewer attention, non-blocking for this task's own scope) — `PATCH`'s `role` field permits setting `role: "Admin"` with no guard.** No AC in this task's scope (or anywhere in the spec) asks for a restriction here, so this diff does not add one unilaterally — but it is a real gap the reviewer should knowingly accept or flag for a follow-up task, not one that should go unnoticed. The database's partial unique index (`T01`) only prevents a *second* concurrent Admin; it does not stop this endpoint from creating the *first* one outside `API06`'s intended bootstrap path.

**Note (non-blocking) — spec-documentation gap: `API02`'s payload text vs. `UT14`.** `API02`'s Request payload line names only `username`/`role` as defined fields, but `UT14` (a spec-derived Unit Test Case) exercises editing `managerId`. This implementation supports all three, treating the payload line as incomplete rather than `UT14` as wrong — worth a spec amendment to state this explicitly rather than leave it implicit.

**Note (non-blocking) — 404-before-403 check ordering, and soft-deleted-id-is-404, are both implementation choices, not spec-stated orderings.** Neither AC/API section states whether `PATCH`/`DELETE` should check existence or authorization first, nor whether a soft-deleted id counts as "not found" for `PATCH` (only `DELETE`'s text says so explicitly). Both choices are reasonable, consistent extensions of `DELETE`'s own stated behavior — flagged for traceability, not hidden.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements user-management-console.T04`.

### Outcome

No Blocking findings. One finding flagged prominently for the reviewer's own judgment call (the `role: "Admin"` guard gap) rather than silently accepted or silently fixed — **Test Reviewer reviewed this finding and merged anyway**, i.e. knowingly accepted it as a non-blocking gap rather than requiring a fix first; it remains open and should be picked up in a future task (most naturally alongside `T06`'s `API06` work, or as its own small follow-up) rather than considered resolved. Three further non-blocking Notes recorded for awareness.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `user-management-console.T04` Merged.

---

## user-management-console.T05 — Full Report

**Diff reviewed:** `src/app/api/users/route.ts` (modified — adds `GET`; `POST` untouched except `forbidden()`'s signature gained a `message` parameter, with the one existing call site updated to match, no behavior change), `src/app/api/users/route.test.ts` (modified — adds `GET` tests), `src/app/api/users/[id]/route.ts` (modified — adds `GET`; `PATCH`/`DELETE` untouched), `src/app/api/users/[id]/route.test.ts` (modified — adds `GET` tests).

**Acceptance:** `user-management-console.AC9`, `AC10`, `AC12`, `AC13`. API Contract: `API04`, `API05`.

### AC verification (by ID)

- **`AC9`** — **Pass.** Admin's list includes every non-deleted user across all roles, explicitly including the Admin account itself (`QT14`, a confirmed-not-open scenario, distinct from the actually-open questions elsewhere in this test_cases file) and explicitly excluding a soft-deleted user (`QT15`).
- **`AC10`** — **Pass.** Admin's detail view returns all five documented fields (`UT12`); a soft-deleted id correctly 404s (`QT16`) rather than returning stale data.
- **`AC12`** — **Pass.** HR's list is scoped to non-deleted Employee-role records only; HR's detail view succeeds identically to Admin's for an Employee record.
- **`AC13`** — **Pass.** HR is rejected 403 viewing each of the 6 non-Employee roles on the detail endpoint (`QT20` full sweep).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | No new comments introduced by this diff. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; read-only additions to already-covered surfaces. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 17 new tests failed with `TypeError: GET is not a function` before the exports existed — a genuine missing-behavior failure (the module itself already resolved, since `POST`/`PATCH`/`DELETE` were already there), not a setup error. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-18); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Detail-view `GET` reuses `T04`'s `canActOn`/`notFound` helpers rather than reimplementing the scoping rule a third time. List-view `forbidden()` gained a `message` parameter (was previously hardcoded to the registration-specific wording) — a small, backward-compatible widening, not a rewrite; the one existing `POST` call site was updated to pass its original message explicitly, so its behavior is provably unchanged. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Neither `GET` handler touches `passwordHash` — list/detail responses only ever include the documented fields. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for `API01`–`API05` — explicit, not omitted. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Both endpoints deny-by-default (401 with no valid token, 403 for any role other than Admin/HR, then the fine-grained Employee-only scoping for HR) — no broadening of any existing boundary. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Read-only; no new datastore. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | List view's filter is a fixed, code-defined object (`{ deletedAt: null }` or `{ role: "Employee", deletedAt: null }`), never client input. Detail view's `id` is validated via `Types.ObjectId.isValid()` before use, same as `T04`. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements user-management-console.T05`.

**Note (non-blocking, restated) — the `role: "Admin"` guard gap flagged at `T04`'s review remains open.** Not this task's scope to fix, and not newly introduced or worsened by this diff — restated here only so it isn't lost as this feature nears completion (one task, `T06`, remains).

### Outcome

No Blocking findings. Two non-blocking Notes recorded — one new, one a carried-forward reminder of `T04`'s still-open item.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `user-management-console.T05` Merged.

---

## user-management-console.T06 — Full Report

**Diff reviewed:** `src/app/api/admin/self-register/route.ts` (new), `src/app/api/admin/self-register/route.test.ts` (new), `src/services/users/selfRegisterRateLimiter.ts` (new).

**Acceptance:** `user-management-console.AC14`, `AC15`. API Contract: `API06`.

### AC verification (by ID)

- **`AC14`** — **Pass.** First self-registration creates the Admin and returns 201 (`UT17`); a genuine `Promise.all` concurrency test (`QT21`) confirms exactly one of two simultaneous calls succeeds — enforced by `T01`'s database-level partial unique index, not an application check-then-insert (verified via a real `User.countDocuments` check afterward, not just the response codes). A soft-deleted Admin correctly does not block a new self-registration (`QT22`).
- **`AC15`** — **Pass.** A second self-registration once an Admin exists returns 409 `admin_already_exists` (`UT18`). The dedicated 5-request/IP/hour limit is verified at its exact boundary: 5 requests all receive 409 (not yet rate-limited — `QT23`), the 6th receives 429 (`QT24`), with a response shape distinct from the 409.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `route.ts`'s two comments document real, non-obvious decisions (the deliberate absence of an auth check; the `dateOfJoining` default) — not attribution. `selfRegisterRateLimiter.ts`'s comments explain the failures-only-vs-every-request distinction from `rbac-api-security`'s limiter, and the `__resetForTests` rationale. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; `API06`'s unauthenticated design was already documented in the spec's Context section before this task. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 9 tests failed with `Cannot find module './route'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-18); spec Status remains correctly `In Development` pending this Merge decision. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Follows the same duplicate-key-catch pattern as `T03`'s `POST /users`, and the same in-memory-window-Map shape as `rbac-api-security.T03`'s limiter, without literally reusing either (semantics genuinely differ in both cases, explained inline). |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Password is hashed immediately via `T02`'s utility; never logged or echoed. |
| New/changed endpoints have an explicit rate-limit decision | Pass | This task *is* that decision's implementation — 5/IP/hour, matching the plan exactly, distinct from every other endpoint's "none, deferred." |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Correctly, deliberately unauthenticated by design (bootstrap requirement) — verified directly by a test that confirms success with no `Authorization` header at all, rather than merely assuming the absence of an `authenticateRequest` call is enough. The single-Admin invariant is the actual least-privilege boundary here, enforced at the database level. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; nothing new introduced. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No filter-based query in this diff — only a `create()` call with literal scalar fields. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — `dateOfJoining` defaulted to registration time.** `API06`'s payload doesn't collect this field, but `T01`'s schema requires it for every role. Defaulting to `new Date()` at registration is a minimal, reasonable, and explicitly flagged choice (in-code comment and here) — not a silent invention.

**Note (non-blocking) — environment bug found and fixed during test-writing, not a defect in the shipped diff.** `jest.resetModules()` (used to isolate the rate limiter's per-test state) was found to also reset the shared `mongoose` connection singleton for dynamically re-imported routes, causing `insertOne()` buffering timeouts in the concurrency/rate-limit tests. Fixed by giving the rate limiter a dedicated `__resetForTests()` export instead. Worth remembering as a general pattern for this project: any future in-memory-state module tested alongside a real DB-backed route should use the same test-only-reset-hook approach, not `jest.resetModules()`.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements user-management-console.T06`.

**Note (restated, still open, not this task's to fix) — `T04`'s `role: "Admin"` guard gap.** `PATCH /users/{id}` can still set `role: "Admin"` with no restriction, a path around this very endpoint's bootstrap flow. Unchanged by this diff; restated once more since this is the last task in the spec.

### Outcome

No Blocking findings. Four non-blocking Notes recorded, one of them a carried-forward reminder that this spec still has one open item outside any single task's scope.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `user-management-console.T06` Merged.

---

## user-management-console.T07 — Full Report

**Diff reviewed:** `src/app/api/users/route.ts` (changed — `GET` handler), `src/app/api/users/route.test.ts` (changed — 3 new tests). `user-management-console.spec.md` amended (`AC13` text, `API04` contract prose, `UT16a`/`UT16b` added; spec reopened `In QA` → `In Development` for this task only).

**Acceptance:** `user-management-console.AC13`, as amended 2026-09-20. API Contract: `API04`.

**Origin, for reviewer context:** this task did not exist when the spec first reached `In QA`. It was found while auditing `stakeholder-panel-ui.T07`–`T11` for blockers of the same class `T06` hit against `internal-transfer-workflow.API02`: `T11`'s already-approved scope needs a Manager selector via `API04` filtered to `role: "Manager"`, but the real implementation hardcoded `{ role: "Employee" }` for every HR caller with no query-parameter support at all — HR could never retrieve a single Manager record. Unlike `org-structure-management.T03`'s earlier fix, this wasn't just an over-restrictive implementation choice: `AC13`'s original text explicitly forbade HR from viewing *any* non-Employee record, so the fix required amending the AC, the same situation as `internal-transfer-workflow.AC19`. **This amendment needs the Gate 1 reviewer's own re-confirmation — flagging this prominently, same as `internal-transfer-workflow.T11`'s own report did.**

### AC verification (by ID)

- **`AC13`** — **Pass, against the amended text.** HR with `?role=Manager` gets 200 with only Manager-role records, Employee/HR records excluded (`UT16a`). HR with any other explicit `role` value (tested: `HR`) gets 400 naming `role`, not silently ignored or defaulted (`UT16b`) — a client bug surfaces clearly rather than masking as HR's normal Employee-only list. HR with no `role` param keeps the pre-existing default behavior (existing test, unchanged, still passes). Admin's response is confirmed unaffected by the parameter — still all six roles regardless (new test). `AC13`'s other restrictions (`PATCH`/`DELETE`/`GET /users/{id}` for a non-Employee record) are untouched by this diff and their own existing tests (`UT16`, in `[id]/route.test.ts`) still pass unmodified.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one new code comment explains the carve-out's rationale and scope limit — traceability to `T07`/`AC13`, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection/endpoint — one additional query-parameter branch on an existing endpoint's existing authorization check. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: the `?role=Manager` case returned the default Employee-only list (wrong records) and the invalid-value case returned 200 instead of 400, both against the original code; the third new test (Admin unaffected) already passed before the change, confirming it as a genuine regression guard, not a padded assertion. |
| `status.md` and spec Status updated same day | Pass | `user-management-console.spec.md`'s Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Mirrors `internal-transfer-workflow.T11`'s own carve-out style exactly: a narrow, explicitly-commented conditional added to an existing check, no new abstraction for a two-branch condition. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | Not a new endpoint; unaffected. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | The carve-out is deliberately narrow: HR may request exactly `role=Manager` and nothing else — any other value 400s rather than silently widening access, and the response shape is unchanged from what `API04` already returns to Admin (`id`/`username`/`role` only, no new fields). HR still cannot reach `API05`'s detail view for a Manager, and still cannot view HR/Payroll/IT/Facilities records through any endpoint. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Read-only; no schema change. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | The `role` query value is checked against a literal allow-list (`"Manager"` only) before ever reaching the Mongoose filter — an invalid value is rejected with 400 before any query runs, never passed through. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (resolved, no longer blocking) — this task's own `AC13` amendment has now been re-confirmed at Gate 1.** Test Reviewer re-confirmed the `AC13` wording change on 2026-09-20 (see `gate1-review-user-management-console.md`'s "Re-confirmation — AC13 amendment" section). This task's own Gate 2 code review remains the only outstanding sign-off before Merge.

**Note (non-blocking) — this task reopened an already-`In QA` spec.** Same honest-regression pattern already established by `internal-transfer-workflow.T10`/`T11` — returns to `In QA` once this task Merges, since it's now the only outstanding task.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements user-management-console.T07`.

### Outcome

No Blocking findings. The Gate 1 re-confirmation flagged above is now resolved; two routine Notes remain.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `user-management-console.T07` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `user-management-console.T07` is Merged — all 7 tasks in this spec are now Merged; Status returns to `In QA`. `stakeholder-panel-ui.T11`'s Manager-selector need is now unblocked, alongside `T07`–`T10`'s own `API02` needs already cleared by `internal-transfer-workflow.T12`.
