# Gate 2 Evidence — rbac-api-security

One running file per feature for this gate. Each task gets one appended row below, plus its full findings report in this same file. Never overwritten or removed.

## Summary Table

| Task ID | Date | Reviewer (named human) | Verdict | Blocking findings | Reference |
|---|---|---|---|---|---|
| rbac-api-security.T01 | 2026-09-16 | Test Reviewer | Merged | None | [Full report](#rbac-api-securityt01--full-report) |
| rbac-api-security.T02 | 2026-09-17 | Test Reviewer | Merged | None | [Full report](#rbac-api-securityt02--full-report) |
| rbac-api-security.T03 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#rbac-api-securityt03--full-report) |
| rbac-api-security.T04 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#rbac-api-securityt04--full-report) |
| rbac-api-security.T05 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#rbac-api-securityt05--full-report) |
| rbac-api-security.T06 | 2026-09-18 | Test Reviewer | Merged | None | [Full report](#rbac-api-securityt06--full-report) |
| rbac-api-security.T07 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#rbac-api-securityt07--full-report) |
| rbac-api-security.T08 | 2026-09-21 | Test Reviewer | Merged | None | [Full report](#rbac-api-securityt08--full-report) |

---

## rbac-api-security.T01 — Full Report

**Diff reviewed:** `src/services/auth/jwt.ts`, `src/services/auth/jwt.test.ts`, `package.json`/`package-lock.json` (adds `jsonwebtoken`, `@types/jsonwebtoken`), `jest.config.mjs`, `jest.setup.ts` (test infra, first use in this project).

**Acceptance:** `rbac-api-security.AC10` — *"Given valid username/password credentials, when `POST /auth/login` is called, then the API responds 200 with an `access_token`, `token_type` of `"Bearer"`, and `expires_in`."*

### AC verification (by ID)

- **`AC10`** — **Pass, as scoped.** `T01`'s own task entry cites `AC10` representatively (T01 has no dedicated AC of its own — it's infrastructure the login endpoint, `T02`, will complete `AC10` against). `signToken()`/`verifyToken()` correctly produce/consume a token carrying an expiry claim, which is what `T02` needs to construct the full `access_token`/`token_type`/`expires_in` response. `T01` alone does not, and isn't meant to, satisfy `AC10` in full — that requires `T02`'s endpoint to exist. Not a gap in `T01`; the task boundary was deliberate.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Zero comments in either file (house style). No commit exists yet for this work (`git status` confirms everything is still working-tree changes) — noted below as a Note for whenever it is committed. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `architecture.md`'s Auth/RBAC Service entry stays correct at its stated level of abstraction; it deliberately excludes implementation-level detail (its own template instruction). The `jsonwebtoken` library choice is a reversible implementation detail, not a cross-cutting decision on `ADR-0001`'s scale — doesn't warrant its own ADR. |
| Tests written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation from `@generate-tests.md for rbac-api-security.T01`: all 8 tests failed with `Cannot find module './jwt'` before `jwt.ts` existed — a genuine "doesn't exist yet" failure, not a setup error. |
| `status.md` and spec Status updated same day | Pass | Both updated same session (2026-09-16); spec Status moved to `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Clear names (`signToken`/`verifyToken`/`getSecret`), no duplication (`getSecret()` shared by both), typed interfaces (`TokenPayload`, `VerifiedTokenPayload`, `SignTokenOptions`) per `int-standards.nextjs.md`'s TypeScript strictness rule, no `any`. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements exist anywhere in `jwt.ts`. |
| No secrets/credentials/tokens hardcoded or logged | Pass | `JWT_SECRET` is read from `process.env` only, on every call (not cached at import), never logged; no token value is logged. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | `T01` introduces no endpoint — it's a utility. The `/auth/login` endpoint's rate limit is already decided in the plan (5/15-min) and is `T03`'s scope. |
| New dependencies vetted | Pass | `jsonwebtoken` — the standard, widely-audited Node.js JWT library (tens of millions of weekly downloads, actively maintained), a materially safer choice than hand-rolling JWT signing/verification with raw `crypto`, consistent with the project's "vetted, maintained, real" bar. `npm audit`: 0 vulnerabilities. |
| Auth boundaries / least-privilege checked | Pass (N-A) | `T01` performs no authorization decision itself — that's `T04`/`T05`'s scope. Correctly out of this task's boundary. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No data storage at all — JWT is stateless per `ADR-0001`, consistent with the plan's "no new datastore" decision. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | Zero MongoDB interaction in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit` run: 0 vulnerabilities. No SAST/DAST tooling is configured in this project yet — noted as a gap for the project generally, not specific to this task. |

### Findings

**Note (non-blocking) — `signToken()`'s return shape.** It returns only the raw token string. `T02`'s login handler will need to independently derive `expires_in` for its response (e.g., decode the token's `exp` claim, or re-read `T01`'s `DEFAULT_EXPIRES_IN_SECONDS` constant) rather than getting it back directly from `signToken()`. Not incorrect, just worth `T02`'s implementation being aware of — a convenience improvement (e.g. returning `{ token, expiresInSeconds }`), not a defect.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When it is committed, the message should reference `Implements rbac-api-security.T01` (traceability, encouraged per `#14`) — not attribute AI authorship.

### Outcome

No Blocking findings. Two non-blocking Notes recorded above for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `rbac-api-security.T01` Merged.

---

## rbac-api-security.T02 — Full Report

**Diff reviewed:** `src/app/api/auth/login/route.ts` (new), `src/app/api/auth/login/route.test.ts` (new), `src/services/auth/userLookup.ts` (new), `src/services/auth/jwt.ts` (one-line change — exports `DEFAULT_EXPIRES_IN_SECONDS`, no signing/verification logic touched), `package.json`/`package-lock.json` (adds `bcrypt`, `@types/bcrypt`).

**Acceptance:** `rbac-api-security.AC10`, `AC11`, `AC12` — `POST /auth/login` success, invalid-credentials, and validation-error contracts (full text in the spec).

### AC verification (by ID)

- **`AC10`** — **Pass.** Valid credentials → 200 with `access_token` (string), `token_type: "Bearer"`, `expires_in` (number, `DEFAULT_EXPIRES_IN_SECONDS`). Covered by the "success" test; response shape matches the spec's `API02` contract exactly.
- **`AC11`** — **Pass.** Unknown username and wrong password both return 401 `{ "error": "invalid_credentials" }` with no token — identical shape, no enumeration signal, matching `QT21`/`QT22`. The route also folds a soft-deleted user (`user.deletedAt` truthy) into this same 401 branch per the plan's explicit anti-leak decision (`rbac-api-security.plan.md` Data Model) — correctly implemented, though not covered by a dedicated automated test (see Findings).
- **`AC12`** — **Pass.** Missing `username`, missing `password`, and non-string `username` each return 400 `{ "error": "validation_error", "fields": [...] }` naming the correct field(s). Covered by 3 tests (`UT13`/`QT24`, `QT23`, `QT25`).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | No comments in `route.ts`. `userLookup.ts`'s one comment documents a real cross-spec dependency (blocked on `user-management-console.T01`) — traceability/status, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module, collection, or cross-cutting decision introduced — `bcrypt` and the rate-limit number were already decided in prior plans, not new decisions made by this diff. |
| Tests written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 6 tests failed with `Cannot find module '@/app/api/auth/login/route'` before `route.ts` existed — genuine "doesn't exist yet," not a setup error. |
| `status.md` and spec Status updated same day | Pass (fixed during this review) | `status.md` was updated same-session for `T02`. The spec's own `## Status` field, however, was found still reading `Tasks Generated` — a leftover gap from `T01` (its own Gate 2 pass recorded the spec moving to `In Development`, but the field itself was never actually edited). Corrected to `In Development` as part of this review; flagged as a Should-Fix, not blocking `T02`'s own diff. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Consistent with `jwt.ts`'s style (typed interfaces, no `any`, no dead comments). Validation, lookup, and token issuance are each a clear, single-purpose block. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements anywhere in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No secret literals; `password`/`passwordHash` are never logged or included in any response. |
| New/changed endpoints have an explicit rate-limit decision | Pass | `/auth/login` is a new endpoint, and the plan already carries an explicit decision (5 failed attempts/15-min window, 429) — deliberately not enforced yet, since it's `T03`'s own scoped task per the plan's Sequencing, not an omission. |
| New dependencies vetted | Pass | `bcrypt` — the standard native-binding bcrypt implementation for Node.js, widely used and maintained, matches the algorithm/rounds already decided in `user-management-console.plan.md`. `npm audit`: 0 vulnerabilities. |
| Auth boundaries / least-privilege checked | Pass | `/auth/login` is correctly unauthenticated by design (it's how a token is obtained) — no broader authorization surface is touched by this diff. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No data is written by this diff; `findUserForLogin` is read-only (currently stubbed — see Findings). |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `findUserForLogin(username)` takes a single typed string, not a spread of the raw request body — consistent with the project's standing rule. Not yet backed by a real Mongoose query (see Findings), so this is a contract-level pass, not yet an executed one. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities. No SAST/DAST tooling configured in this project yet — the same project-wide gap already noted in `T01`'s evidence, not new here. |

### Findings

**Should-Fix (fixed during this review) — spec Status field drift.** See Gate 2 Checklist row above; corrected `rbac-api-security.spec.md`'s `## Status` from `Tasks Generated` to `In Development` as part of this review.

**Note (non-blocking) — `findUserForLogin` is a deliberate stub, not yet a real datastore query.** `src/services/auth/userLookup.ts` throws "not yet wired to a real datastore — blocked on `user-management-console.T01`" rather than importing a guessed-at `Users` model path. This is the correct scope boundary for `T02` (the `Users` schema is owned elsewhere and doesn't exist yet), and all 6 tests pass because this function is mocked at the test boundary — but it means the endpoint is not yet functionally complete end-to-end in a running system. Tracked, not a defect in this diff.

**Note (non-blocking) — no dedicated test for the soft-deleted-user branch.** The `!user || user.deletedAt` 401 fold is implemented correctly per the plan's Data Model, but (per `generate-tests.md`'s own Do-not #3) no test was written for it at Red time, since it isn't backed by a row in the spec's Unit Test Cases table or `test_cases.md`. Worth a `test_cases.md` amendment via `@generate-test-cases.md` at some point, not blocking here.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff (same state as `T01`). When committed, reference `Implements rbac-api-security.T02`.

### Outcome

No Blocking findings. One Should-Fix caught and corrected during this review (spec Status drift). Three non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `rbac-api-security.T02` Merged.

---

## rbac-api-security.T03 — Full Report

**Diff reviewed:** `src/services/auth/rateLimiter.ts` (new), `src/app/api/auth/login/route.ts` (modified — rate-limit check added around `T02`'s existing validation/lookup/issuance logic, none of which was altered), `src/app/api/auth/login/route.test.ts` (4 new tests appended).

**Acceptance:** `rbac-api-security.AC13` — *"Given login attempts exceeding the (plan-defined) rate-limit threshold, when a further `POST /auth/login` request is made, then the API responds 429 with `{ "error": "rate_limited", "retry_after": ... }`."*

### AC verification (by ID)

- **`AC13`** — **Pass.** 5 failed attempts for one username are each evaluated normally (401); the 6th within the same 15-minute window returns 429 with `{ "error": "rate_limited", "retry_after": 900 }`, matching both the spec's contract shape and the plan's literal threshold/value decision. Verified per-username isolation (`QT29`) and window expiry (`QT30`) — a limited username is evaluated normally again once 15 minutes elapse, not permanently locked.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `rateLimiter.ts` has no comments; `route.ts`'s changes are uncommented code. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | Stays within the existing Auth/RBAC Service module `architecture.md` already names; the in-memory-vs-persisted storage choice is an implementation detail, not a cross-cutting decision on `ADR-0001`'s scale. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: 3 of 4 new tests failed with "Expected 429, Received 401" before `rateLimiter.ts` existed — a genuine missing-behavior failure, not a setup error. The 4th (`QT27`, below-threshold) legitimately passed immediately, since that behavior is identical with or without the limiter — correctly not a false-Red concern. |
| `status.md` and spec Status updated same day | Pass | Both updated same session (2026-09-17); spec Status already correctly `In Development` (fixed during `T02`'s review). |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Consistent style with `jwt.ts`/`userLookup.ts` (typed interfaces, no `any`, no dead comments). `route.ts`'s rate-limit check is inserted as a clean early-return, not interleaved with `T02`'s existing logic. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements anywhere in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No secret/credential handling in this diff — usernames are tracked as rate-limit keys only, not logged. |
| New/changed endpoints have an explicit rate-limit decision | Pass | This task *is* that decision's implementation — 5 failed attempts/15-min window, matching the plan exactly. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass (N-A) | No authorization logic touched — this task only throttles the already-unauthenticated login endpoint. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No data is persisted — the counter is in-process memory only, consistent with the plan introducing no new datastore for this task. Flagged as a Note below (a real, not hidden, scaling limitation). |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No MongoDB interaction in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages added by this task). Same project-wide no-SAST/DAST-tooling gap already noted, not new here. |

### Findings

**Note (non-blocking) — in-memory rate-limit state is per-process, not shared/persisted.** A multi-instance deployment would let each instance track its own counter independently, weakening the 5-attempt guarantee. Not a defect against this task's scope (the plan explicitly introduces no new datastore here) — worth revisiting only if/when the project moves beyond a single instance; no spec or plan currently states that requirement, so not invented here.

**Note (non-blocking) — "successful login doesn't count toward/get blocked by the counter" has no dedicated test.** Named in `T03`'s own prompt-file scope and correctly implemented (`recordFailedAttempt` is only called on invalid-credential branches), but not backed by a row in the spec's Unit Test Cases table or `test_cases.md` — flagged per `generate-tests.md`'s Do-not #3 rather than fabricated as a QA scenario. Same pattern as `T02`'s `deletedAt`-branch Note.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements rbac-api-security.T03`.

### Outcome

No Blocking findings. Three non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `rbac-api-security.T03` Merged.

---

## rbac-api-security.T04 — Full Report

**Diff reviewed:** `src/services/auth/authenticate.ts` (new), `src/services/auth/authenticate.test.ts` (new).

**Acceptance:** `rbac-api-security.AC1` — *"Given a request to any protected endpoint with no valid authenticated identity, when the request is received, then the API responds 401 Unauthenticated and the requested action is not performed."* API Contract: `rbac-api-security.API01`.

### AC verification (by ID)

- **`AC1`** — **Pass.** No `Authorization` header, a header missing the `Bearer ` prefix, an empty token, an expired token (both clearly-past and exact-boundary), a wrong-secret signature, and a tampered payload all correctly produce `{ authenticated: false, response }` with a 401 status and `{ "error": { "code": "UNAUTHENTICATED", "message": "..." } }` body, matching `API01`'s exception contract exactly. A valid token correctly produces `{ authenticated: true, identity: { userId, role } }`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `authenticate.ts` has no comments. `authenticate.test.ts`'s one comment documents the positive-path test's provenance (not backed by a distinct QT row) — transparency, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | Stays within the existing Auth/RBAC Service module; no new cross-cutting decision — this task implements what `ADR-0001` already covers. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 8 tests failed with `Cannot find module './authenticate'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Both updated same session (2026-09-18); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Consistent with `jwt.ts`/`rateLimiter.ts` style (typed union return, no `any`, no dead comments). Delegates verification entirely to `T01`'s `verifyToken` rather than reimplementing any JWT logic, per this task's own scope boundary. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | The bearer token is parsed and passed to `verifyToken`, never logged; no secret literals. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | This task introduces no endpoint — it's cross-cutting middleware logic, not yet wired to any route (`T06`'s scope). |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | This *is* the authentication boundary — correctly scoped to identity-verification only; no role/permission (403) decision made here, per the task's own "do not touch" list (`T05`'s scope). |
| Data-at-rest / in-transit matches `constitution.md` | Pass (N-A) | No data storage in this diff. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No MongoDB interaction in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide no-SAST/DAST-tooling gap already noted, not new here. |

### Findings

**Note (non-blocking) — not yet wired into any route.** `authenticateRequest()` exists and is fully tested in isolation, but no endpoint calls it yet — that's explicitly `T06`'s scope (wiring the middleware into every protected endpoint, excluding `user-management-console.API06`). Until `T06` lands, this diff has no live effect on any running endpoint. Correct scope boundary, not a defect.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements rbac-api-security.T04`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `rbac-api-security.T04` Merged.

---

## rbac-api-security.T05 — Full Report

**Diff reviewed:** `src/services/auth/permissions.ts` (new), `src/services/auth/permissions.test.ts` (new).

**Acceptance:** `rbac-api-security.AC2`–`AC9` — the per-role permitted-action boundary and the Admin/HR employee-registration carve-out (full text in the spec).

### AC verification (by ID)

- **`AC2`** — **Pass.** `checkPermission` denies by default for any role/action combination not explicitly listed, and for a missing/unknown role (`QT08`/`QT09`) — "not permitted" is the safe default, never inferred as allowed.
- **`AC3`** — **Pass.** Employee permitted for `transfer.initiate`/`viewOwnStatus`/`withdrawOwnPendingManager`; denied for `transfer.reviewAsManager` (`UT03`).
- **`AC4`** — **Pass.** Manager permitted for `transfer.reviewAsManager`; denied for `transfer.validateEligibilityAsHR` (`UT04`) and `user.registerEmployee` (`UT09`).
- **`AC5`** — **Pass.** HR permitted for its three transfer-review actions plus the `AC9` carve-out; denied for Payroll/IT/Facilities actions (`UT05`/`QT13`).
- **`AC6`** — **Pass.** Payroll permitted for its two actions; denied for IT (`UT06`) and Facilities (`QT14`) actions.
- **`AC7`** — **Pass.** IT permitted for its action; denied for Facilities (`UT07`) and Payroll (`QT15`) actions.
- **`AC8`** — **Pass.** Facilities permitted for its action; denied for `user.registerEmployee` (`UT08`) and Payroll/IT (`QT16`) actions.
- **`AC9`** — **Pass.** Admin permitted for all three admin action categories (`UT10`/`QT18`) and `user.registerEmployee`; HR also permitted for `user.registerEmployee` (the stated carve-out); Manager, Employee, Payroll, IT, and Facilities all denied for it (`UT09`/`QT17` full sweep).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `permissions.ts` has no comments. The one comment block in `permissions.test.ts` documents a real scope boundary (`QT10`–`QT12` need resource-level context this task doesn't have) — transparency, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | Stays within the existing Auth/RBAC Service module; the action-catalog naming is an implementation detail, not a cross-cutting architectural decision. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 26 tests failed with `Cannot find module './permissions'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-18); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Consistent typed-union style with `authenticate.ts`; the per-role `Set` structure is easy to audit against the spec's own per-role AC list, one-to-one. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No secret/credential handling — this diff only maps roles to action categories. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint introduced — this is a pure function, not yet wired to any route (`T06`'s scope). |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Deny-by-default for unknown roles/actions is the least-privilege-correct default; each role's set is scoped exactly to its spec-stated actions, no broader. |
| Data-at-rest / in-transit matches `constitution.md` | Pass (N-A) | No data storage — code/config-defined per the plan's explicit Data Model decision (no new collection). |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No MongoDB interaction in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — not yet wired into any route.** `checkPermission()` exists and is fully tested in isolation, but no endpoint calls it yet — that's `T06`'s scope (wiring both this and `T04`'s `authenticateRequest` into every protected endpoint). No live effect on any running endpoint until then. Correct scope boundary, not a defect.

**Note (non-blocking) — `QT10`–`QT12` require resource-level context out of this task's scope.** Ownership/state-dependent scenarios (a request not belonging to the acting Employee/Manager, or in the wrong state) cannot be resolved by a pure `(role, action)` check — flagged for whichever endpoint owns that record (chiefly `internal-transfer-workflow`) to layer its own check on top of this one, per Do-not #3 rather than fabricated here.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements rbac-api-security.T05`.

### Outcome

No Blocking findings. Three non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `rbac-api-security.T05` Merged.

---

## rbac-api-security.T06 — Full Report

**Diff reviewed:** `src/services/auth/withAuthorization.ts` (new), `src/services/auth/withAuthorization.test.ts` (new).

**Acceptance:** `rbac-api-security.AC1`, `AC2` — realized in practice, not just unit-verified in isolation as `T04`/`T05` already did.

### AC verification (by ID)

- **`AC1`** — **Pass, as scoped.** A request with no valid bearer token is rejected 401 `UNAUTHENTICATED` before the wrapped handler is ever invoked, delegating entirely to `T04`'s `authenticateRequest`. As noted under Findings, this AC is not yet realized *in production* anywhere, since no route currently calls this wrapper — that is an honest, flagged limitation of the codebase's current state (only `POST /auth/login` exists, and it's the one endpoint excluded by design), not a defect in this task's own diff.
- **`AC2`** — **Pass, as scoped.** An authenticated request whose role fails `T05`'s `checkPermission` is rejected 403 `FORBIDDEN` before the wrapped handler is invoked. Same production-realization caveat as `AC1` above.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above, including the honest scope caveat. |
| No AI-attribution in comments/commit messages | Pass | `withAuthorization.ts` has no comments. `withAuthorization.test.ts`'s one comment explains why this is tested against a stand-in handler rather than a real route — transparency, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | Pure composition of `T04`+`T05`, both already covered; no new cross-cutting decision. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 3 tests failed with `Cannot find module './withAuthorization'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-18); spec Status remains correctly `In Development` — appropriately not yet `Tasks Generated`'s successor state, since no other spec's tasks are complete. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Thin composition, no duplicated logic from either `T04` or `T05` — matches this task's own "do not touch their internals" boundary exactly. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No new secret/credential handling — delegates entirely to already-reviewed `T04`/`T05`. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint introduced by this diff itself. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Fails closed in both directions (401 before 403, both before the handler runs) — the handler is structurally unreachable unless both checks pass. |
| Data-at-rest / in-transit matches `constitution.md` | Pass (N-A) | No data storage in this diff. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No MongoDB interaction in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking, worth the reviewer's attention) — `AC1`/`AC2` are not yet realized on any live endpoint.** This is the last task in `rbac-api-security`, and it completes that spec's own scope in full — but the *system-wide* guarantee "every protected endpoint enforces this" (the spec's own Intent statement) genuinely cannot be true yet, since no other spec has built any endpoint. This is not a gap in this diff; it is the expected, correctly-sequenced state of a multi-spec project where the security mechanism is built before its consumers exist. Tracked in `rbac-api-security.tasks.md`'s Coverage Gaps section so it isn't lost once this spec is marked complete elsewhere in `status.md`.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements rbac-api-security.T06`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded — one of them (production-realization) worth carrying forward as each future spec's endpoints get built, so `withAuthorization` actually gets applied rather than silently forgotten.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `rbac-api-security.T06` Merged.

---

## rbac-api-security.T07 — Full Report

**Diff reviewed:** `src/services/auth/userLookup.ts` (modified — stub replaced with a real implementation), `src/services/auth/userLookup.test.ts` (new).

**Acceptance:** `rbac-api-security.AC10`, `AC11`, `AC12`. Same ACs `T02` already covers — completes that task's own deferred scope, no new behavior.

**Origin:** a project-wide test-coverage audit found this stub — deliberately left open at `T02`'s own Merge, blocked on `user-management-console.T01` — was never revisited after that blocking dependency Merged on 2026-09-18, despite being explicitly tracked in `status.md` twice. As shipped before this task, `POST /auth/login` threw on every real request; `login/route.test.ts` only ever passed because it mocks `userLookup` entirely, so this was never caught by the existing suite.

### AC verification (by ID)

- **`AC10`/`AC11`/`AC12`** (login success/failure/JWT issuance) — **Pass.** `findUserForLogin` now queries the real `User` model by `username`, returning the exact shape `login/route.ts` already expects (`userId`, `username`, `passwordHash`, `role`, `deletedAt`). Verified directly with a new, unmocked test file hitting a real `mongoServer`-backed `Users` collection: existing user found, soft-deleted user's `deletedAt` is non-null (so `route.ts`'s existing check still rejects them), and no-match returns `null`. Also reconfirmed `login/route.test.ts`'s own 24 tests (which mock this function) still pass unmodified — this task changed what the mock was standing in for, not the route's own logic.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one comment references `rbac-api-security.T07`/`T02` by ID — traceability, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; this task only fills in a previously-stubbed read against an already-documented `Users` collection. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 3 new tests failed with the stub's own thrown error before the fix (cross-checked against the recorded Red-confirmation); a genuine test-fixture bug (Employee role requiring `managerId`, the same recurring class of bug seen elsewhere in this project) was caught and fixed in the *test file* during the same Red→Green cycle, not the implementation. |
| `status.md` and spec Status updated same day | Pass | `rbac-api-security.spec.md`'s Status moved `In QA` → `In Development` same day this task was added, reflecting the real state (an unmerged task exists) rather than left stale. |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Matches the same lookup-function shape and error-free/null-returning convention used by every other Mongoose-backed lookup in this project. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | `passwordHash` is passed through, never logged; comparison against the plaintext password still happens in `route.ts`, unchanged by this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint changed — this is the lookup function `login/route.ts` already called. |
| New dependencies vetted | Pass (N-A) | None introduced. |
| Auth boundaries / least-privilege checked | Pass | This function only reads; no authorization decision is made here — `route.ts`'s own password-comparison and `deletedAt` check are unchanged. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Reads only the already-approved `Users` collection; no new datastore. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass | The only query is `User.findOne({ username })`, where `username` is already validated as a non-empty string by `route.ts` before this function is ever called. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (worth explicit reviewer attention, non-blocking) — this closes a real, previously-live defect, not a cosmetic gap.** Before this task, every real login request would have thrown an unhandled error in production. This wasn't caught by `rbac-api-security.T02`'s own Gate 2 (which correctly reviewed the diff *as scoped*, with the stub explicitly and visibly deferred) — it surfaced only via a project-wide audit run well after both this spec and its blocking dependency were already `In QA`. Worth normalizing project-wide: a tracked "revisit once unblocked" note in `status.md` is not the same as actually revisiting it.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements rbac-api-security.T07`.

### Outcome

No Blocking findings. One Note flagging the real-world severity of what this task closes, plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `rbac-api-security.T07` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `rbac-api-security.T07` is Merged — all 7 tasks in this spec are now Merged; Status returns to `In QA`.

---

## rbac-api-security.T08 — Full Report

**Diff reviewed:** `src/instrumentation.ts` (new), `src/instrumentation.test.ts` (new). `.env.local` also created (gitignored, not part of this diff) with `MONGODB_URI`/`JWT_SECRET` for local dev. `rbac-api-security.spec.md` reopened `In QA` → `In Development` for this task only.

**Acceptance:** rbac-api-security's own Non-Functional Constraint ("MongoDB is the sole approved datastore") — cited representatively, no dedicated AC.

**Origin, for reviewer context — this is a severity-significant finding, read before the checklist below:** discovered while investigating a real `500` the user hit on `POST /admin/self-register` against a running dev server. `src/services/db/connect.ts`'s `connectToDatabase()` — correct, already tested — was never called by anything in the entire codebase. Every one of this project's 627 (at the time) Jest tests passed regardless, because `src/test-utils/mongoServer.ts` connects Mongoose directly to a real in-memory `mongodb-memory-server` instance for the whole test run, bypassing `connect.ts` entirely. That means **every previous Gate 2 review in this project's history — every one — verified real, working Mongoose queries in tests, while the actual deployable app had zero database connection.** Confirmed directly from server logs before any fix: `MongooseError: Operation \`users.insertOne()\` buffering timed out after 10000ms`.

### AC verification

- **Representative NFR** — **Pass.** `register()` calls `connectToDatabase()` exactly once (unit-tested, mocked). **Beyond the unit test, live-verified against the user's own real Docker MongoDB**, not just asserted in isolation: killed and restarted the dev server fresh, called `POST /admin/self-register` — `201` in ~340ms (previously hung ~10s then `500`'d) — then called it again, correctly `409 admin_already_exists`, proving both the write path and the schema's own unique-index invariant now work against a real database, not just the in-memory test one.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass (N/A — representative) | See above; no dedicated AC exists for infrastructure plumbing. |
| No AI-attribution in comments/commit messages | Pass | The comment explains why tests never exercise this path and why failures should propagate — real design context, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new datastore — MongoDB was already the approved datastore; this task only opens the connection to it that was always supposed to exist. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: both new tests failed with `Cannot find module '@/instrumentation'` before the file existed, passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | Spec Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | One function, one call, matching Next.js's own documented `instrumentation.ts`/`register()` convention exactly — no invented abstraction. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | `MONGODB_URI`/`JWT_SECRET` are read from `process.env` only, via the already-reviewed `connect.ts`/`jwt.ts`; the new `.env.local` is gitignored (`.env*`), never committed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | Not an endpoint — a server-startup hook. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass (N/A) | No authorization logic in this diff. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Connects to the already-approved MongoDB datastore; no new datastore introduced. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No query in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** full suite 629/629, `tsc`/`eslint` (project-wide, exit code 0) both clean, `next build` confirms `instrumentation.ts` compiles with no regressions to any route.

### Findings

**Note (worth explicit reviewer attention, BLOCKING-SEVERITY IN PRACTICE, though the code fix itself is small and low-risk) — every previously-Merged task in this entire project shipped against an app with no real database connection.** This is not specific to `self-register` — it is every endpoint in every spec that touches MongoDB. The fix here is minimal and low-risk (one new file, one call), but the finding itself deserves explicit sign-off: recommend the reviewer treat this as confirmation that the project's test suite, while thorough at the unit/integration level against a real (in-memory) MongoDB, was never sufficient on its own to catch a wiring gap between "the app" and "a real deployment" — worth a standing note for future work, not just this one fix.

**Note (non-blocking) — `.env.local` was created alongside this fix, not part of the reviewed diff.** Contains `MONGODB_URI` (pointed at the user's own Docker MongoDB) and a freshly-generated `JWT_SECRET`, for local dev only. Gitignored, never committed, no review action needed on it specifically.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements rbac-api-security.T08`.

### Outcome

No Blocking findings against the code itself. One finding flagged for explicit reviewer attention regarding the severity/scope of what this closes project-wide, plus routine Notes.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `rbac-api-security.T08` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-21). `rbac-api-security.T08` is Merged — **all 8 tasks in this spec are now Merged; Status returns to `In QA`.** Every real deployment of this app now actually connects to MongoDB at startup.
