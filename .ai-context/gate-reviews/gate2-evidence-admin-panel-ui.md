# Gate 2 Evidence — admin-panel-ui

One running file per feature for this gate. Each task gets one appended row below, plus its full findings report in this same file. Never overwritten or removed.

## Summary Table

| Task ID | Date | Reviewer (named human) | Verdict | Blocking findings | Reference |
|---|---|---|---|---|---|
| admin-panel-ui.T01 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit01--full-report) |
| admin-panel-ui.T02 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit02--full-report) |
| admin-panel-ui.T03 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit03--full-report) |
| admin-panel-ui.T04 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit04--full-report) |
| admin-panel-ui.T05 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit05--full-report) |
| admin-panel-ui.T06 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit06--full-report) |
| admin-panel-ui.T07 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit07--full-report) |
| admin-panel-ui.T08 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit08--full-report) |
| admin-panel-ui.T09 | 2026-09-21 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit09--full-report) |
| admin-panel-ui.T10 | 2026-09-21 | Test Reviewer | Merged | None | [Full report](#admin-panel-uit10--full-report) |

---

## admin-panel-ui.T01 — Full Report

**Diff reviewed:** `src/shared/auth/session.ts` (new), `src/shared/auth/session.test.ts` (new).

**Acceptance:** `admin-panel-ui.AC10` (representative citation — this task's own prompt file states it implements `stakeholder-panel-ui.AC1`/`AC2b`/`AC11`'s already-Approved contract, not a dedicated AC of its own in this spec). Reviewed against those three ACs directly, per the task's own stated scope.

### AC verification (by ID)

- **`stakeholder-panel-ui.AC1`** — **Pass.** `persistSession` stores the token and a computed `expiresAt` (`login time + expires_in`); `readSession` decodes `role` from the stored token for the caller to use in a routing decision. Building-block only — the actual Login screen and role-based redirect are `stakeholder-panel-ui.T01`'s scope, not this task's.
- **`stakeholder-panel-ui.AC2b`** — **Pass.** `isSessionExpired` correctly distinguishes future vs. past `expiresAt`, and treats "no session" and "corrupted storage" both as expired (fail-safe, not fail-open). The actual pre-API-call check and redirect-to-Login are `T02`'s scope (this panel) and `stakeholder-panel-ui.T02`'s scope (that panel) — both consume this module rather than reimplement it.
- **`stakeholder-panel-ui.AC11`** — **Pass.** `clearSession` removes both stored values; this is the exact function both the expiry force-logout path and the voluntary Logout control (`T02`) call — one implementation, not two.
- **`admin-panel-ui.AC10`** (representative) — **Pass**, with the same building-block caveat: full end-to-end satisfaction requires `T02`'s guard to actually call these functions before/around API calls; this task alone provides correct, tested infrastructure, not the complete user-visible behavior.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above — verified against the 3 `stakeholder-panel-ui` ACs this module actually implements, per the task's own prompt file, not just the representative `admin-panel-ui.AC10` citation. |
| No AI-attribution in comments/commit messages | Pass | The one substantive comment explains a real, non-obvious decision (client-side decode is a UX read, never a trust boundary; must degrade gracefully, not throw) — traceability/rationale, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `architecture.md`'s Client State section already describes the Zustand/TanStack Query split at the level this project documents architecture (roles, not individual module files); no other service/hook file in this project has been separately added to `architecture.md` either — consistent with precedent, not a gap unique to this task. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 7 original tests failed with `Cannot find module './session'` before the file existed. **A second, genuine Red→Green cycle happened within this same review, before Merge:** while verifying AC coverage against this session's own newly-written `test_cases.md` scenarios (`admin-panel-ui.QT17`/`QT19`, `stakeholder-panel-ui.QT22` — corrupted token/session handling), a real bug was found — `decodeRole` threw on a malformed token instead of degrading to "no session," and a non-numeric `expiresAt` compared as `NaN`, which is always `false`, silently treating a corrupted session as *never* expired (fail-open, not fail-safe). 3 new tests added, confirmed Red against the existing implementation (2 threw, 1 returned the wrong boolean), then fixed and confirmed Green. This is a real defect caught and closed before Merge, not retrofitted around. |
| `status.md` and spec Status updated same day | Pass | `admin-panel-ui.spec.md`'s Status is `In Development` (moved from `Tasks Generated` when `T01` first went Green, 2026-09-19); `status.md` will be updated same day (2026-09-20) with this Gate 2 outcome once recorded. |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Small, single-purpose functions; naming (`persistSession`/`readSession`/`isSessionExpired`/`clearSession`) matches the vocabulary already used in both UI specs' own ACs, so a future reader can trace code to spec without translation. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements anywhere in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | The token is read/written to `localStorage` only, per `stakeholder-panel-ui.spec.md`'s own explicit, already-accepted decision (that spec's Non-Functional Constraints already document the XSS trade-off plainly) — not re-litigated here, and not logged anywhere in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint — pure client-side module. |
| New dependencies vetted | Pass (N-A) | None added. The JWT payload decode is hand-written (5 lines, base64url + `JSON.parse`) rather than pulling in a dependency for a trivial, non-security-sensitive operation — a deliberate choice to avoid unnecessary supply-chain surface for functionality this small. |
| Auth boundaries / least-privilege checked | Pass | The module explicitly never verifies the JWT signature client-side and its own code comment states this is a UX read only, never a trust boundary — consistent with `constitution.md`'s "role-based authorization is enforced server-side" rule; nothing in this diff could be mistaken for an authorization decision point. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; `localStorage` usage matches the spec's own already-recorded, explicit decision. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted elsewhere, not new here. |

### Findings

**Finding 1 (resolved during this review, before Merge) — corrupted-storage handling was missing, found via this session's own `test_cases.md`.** See the Gate 2 Checklist row above for the full account: a malformed token or non-numeric `expiresAt` would have thrown or silently fail-opened. 3 new tests added (`admin-panel-ui.QT17`/`QT19`, `stakeholder-panel-ui.QT22` support), confirmed Red against the original implementation, then fixed. `decodeRole` now returns `null` on any parse failure instead of throwing; `readSession` treats a `null` role or `NaN` `expiresAt` as "no session"; `isSessionExpired` therefore correctly reports `true` (fail-safe) for corrupted storage rather than `false` (fail-open). Recorded here as raised-and-resolved within this same review cycle, not silently fixed and erased from the record.

**Note (worth explicit reviewer attention, non-blocking) — this task's Green state means correct, tested infrastructure, not yet a complete user-visible behavior.** `admin-panel-ui.T02` and `stakeholder-panel-ui.T01`/`T02` must all actually call into this module for `AC1`/`AC2b`/`AC8`–`AC11` to be demonstrable end-to-end. This is expected and by design (this task's own prompt file states it builds shared infrastructure `AC8`–`AC11` depend on), not a gap in this diff.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements admin-panel-ui.T01`.

### Outcome

No Blocking findings. One real defect found and fixed within this same review cycle (Finding 1), plus one Note flagging that full end-to-end behavior depends on downstream tasks (by design), plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T01` Merged.

---

## admin-panel-ui.T02 — Full Report

**Diff reviewed:** `src/shared/auth/authenticatedFetch.ts` (new), `src/shared/auth/authenticatedFetch.test.ts` (new), `src/shared/auth/redirectToLogin.ts` (new), `src/modules/admin-panel-ui/components/AdminPanelLayout.tsx` (new), `src/modules/admin-panel-ui/components/AdminPanelLayout.test.tsx` (new — this project's first RTL component test file).

**Acceptance:** `admin-panel-ui.AC8`, `AC9`, `AC10`, `AC11`.

**Note on how this was reached:** implemented autonomously during a scheduled loop tick, as a direct continuation of `T02`'s already-Red-confirmed state — the tests (written and confirmed Red in the prior turn) fully specified the required behavior, so no new product decision was needed to reach Green. Flagged here for reviewer transparency, not because it changes the review itself.

### AC verification (by ID)

- **`AC8`** — **Pass.** Full 6-role sweep (`Employee`/`Manager`/`HR`/`Payroll`/`IT`/`Facilities`, via `it.each`) — every non-Admin role is redirected to `/login`, content never rendered. Also covers a corrupted/unparseable token collapsing safely into the same redirect path (a direct consequence of `T01`'s own corrected `readSession()` returning `null` rather than throwing — confirms that fix holds end-to-end, not just at the unit level).
- **`AC9`** — **Pass.** No session present → redirected, content not rendered.
- **`AC10`** — **Pass.** `authenticatedFetch` checks `isSessionExpired()` before sending — on an expired or absent session, the network call is skipped entirely, the session is cleared, and `redirectToLogin()` is called; a `401` response (session looked valid but the server disagreed) triggers the identical fallback, per `stakeholder-panel-ui.AC2b`'s own contract.
- **`AC11`** — **Pass.** Logout control renders inside the authorized state, clears the session, and redirects on click.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain real decisions (SSR/hydration timing, the non-React-caller constraint on `redirectToLogin`) — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; `AdminPanelLayout` is the Admin Panel UI module's first concrete component, already anticipated by `architecture.md`'s existing module table. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the prior turn's recorded Red-confirmation: all 13 original tests failed with `Cannot find module` before either file existed. **A real test-infrastructure bug was found and fixed within this same Green pass, not silently worked around:** the original `authenticatedFetch.test.ts` tried to mock `window.location.href` directly, but jsdom 30's `Location` object silently resists reassignment — the test's own assertions were passing against jsdom's real, unmocked `href` (`"http://localhost/"`), not the intended value. Extracted `redirectToLogin.ts` as its own `jest.mock`-able module and rewrote the 3 affected assertions to check the mock was called, instead of inspecting `window.location.href` directly. This is a fix to the test's own validity, confirmed by re-running before/after — not a change to what behavior was being asserted. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | `AdminPanelLayout` follows the same client-component mount-guard pattern documented in its own inline comments; `authenticatedFetch`/`redirectToLogin` are both small, single-purpose functions consistent with `T01`'s own style. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements anywhere in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | The token is only ever attached to the `Authorization` header, never logged. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint — pure client-side code. |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Every gate in this diff (`AdminPanelLayout`'s guard, `authenticatedFetch`'s expiry/401 checks) is explicitly documented as client-side UX only; the diff introduces no server-side authorization logic and doesn't purport to. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; consistent with the already-recorded `localStorage` decision. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Finding 1 (resolved during this Green pass, before Gate 2 was finalized) — a real test-infrastructure bug in the original Red tests.** See the Gate 2 Checklist row above for the full account: the original `authenticatedFetch.test.ts` asserted against `window.location.href`, which jsdom 30 doesn't actually let tests reassign — the assertions were checking jsdom's real, untouched value, not the code's actual behavior. Fixed by extracting `redirectToLogin.ts` and asserting the mock was called instead. Recorded here as raised-and-resolved within the same cycle, not silently rewritten.

**Note (worth explicit reviewer attention, non-blocking) — two `eslint-disable` comments were needed, both individually justified inline, not blanket-suppressed.** `react-hooks/set-state-in-effect` on `AdminPanelLayout`'s mount-check (the session read is `localStorage`-backed and must happen post-mount to avoid an SSR hydration mismatch — this is the documented, correct pattern for adopting external/browser-only state, not the anti-pattern the rule is designed to catch) and `@next/next/no-location-assign-relative-destination` on `redirectToLogin` (this function exists specifically for non-React callers with no `useRouter()` available). Both disable comments were initially misplaced one line away from the flagged line during editing (an `eslint-disable-next-line` only suppresses the literal next line) and corrected before this report — worth a reviewer's independent look given how easy that placement mistake is to make silently.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T02`.

### Outcome

No Blocking findings. One test-infrastructure defect found and fixed within this same cycle (Finding 1), plus two Notes (the justified lint suppressions, worth independent review; the routine commit-message note).

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T02` Merged.

---

## admin-panel-ui.T03 — Full Report

**Diff reviewed:** `src/modules/admin-panel-ui/services/dashboardService.ts` (new), `src/modules/admin-panel-ui/hooks/useDashboard.ts` (new), `src/modules/admin-panel-ui/components/Dashboard.tsx` (new), `src/modules/admin-panel-ui/components/Dashboard.test.tsx` (new), `src/shared/providers/QueryProvider.tsx` (new), `src/app/layout.tsx` (modified — wraps `children` in `QueryProvider`), `src/app/(admin)/dashboard/page.tsx` (new), `package.json`/`package-lock.json` (new dependency: `@tanstack/react-query`).

**Acceptance:** `admin-panel-ui.AC1`. API Contract consumed: `transfer-admin-oversight.API01`.

### AC verification (by ID)

- **`AC1`** — **Pass.** `userCounts`, `totalTransferRequests`, and `statusBreakdown` are all fetched via `useDashboard` and rendered. Verified: the happy path (`UT01`), all-zero counts rendered as `0`s rather than blank/omitted (`QT01`), a loading state before data resolves, and an error state (not a crash) on fetch failure (`QT03`).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain real decisions (why the service calls `authenticatedFetch` not raw `fetch`; why `QueryProvider` lives at the app root, not per-module) — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `@tanstack/react-query` is not a new architectural decision — `constitution.md`'s Architectural Constraints have named it as the required server-state mechanism since project kickoff; this task is simply its first actual installation and use, not a new library choice requiring an ADR. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 4 tests failed with `Cannot find module '../services/dashboardService'` before any of the three new files existed (cross-checked against the recorded Red-confirmation). Hit, and fixed with the already-established pattern, the same `jest.mock`+`@/`-alias resolution issue documented earlier this project (a relative path in `jest.mock(...)` instead of the alias). |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Service/hook/component split matches `admin-panel-ui.plan.md`'s own Architecture Approach exactly. |

**Beyond the checklist, worth noting explicitly:** this diff goes further than the task's own minimum test-passing bar because it touches the shared app root (`layout.tsx`) — verified with a full `next build`, not just `jest`/`tsc`/`eslint`, confirming `/dashboard` compiles as a real route and no other route regressed.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | `dashboardService.ts` never touches the token directly — `authenticatedFetch` (already reviewed under `T02`) handles that. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `transfer-admin-oversight.API01`'s already-decided rate limit. |
| New dependencies vetted | Pass | `@tanstack/react-query` — the official TanStack package, already named as this project's approved server-state library in `constitution.md`; `npm audit` reports 0 vulnerabilities after installation. |
| Auth boundaries / least-privilege checked | Pass | Fetches go through `authenticatedFetch`, which already enforces expiry/401 handling; the route itself is wrapped in `AdminPanelLayout`'s guard. Server-side enforcement is unchanged, per `API01`'s own existing 403 contract. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads only the already-approved dashboard endpoint. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities after adding `@tanstack/react-query`. |

### Findings

**Note (worth explicit reviewer attention, non-blocking) — a previously-undetected gap: TanStack Query had never actually been installed in this project, despite being named as required infrastructure since `constitution.md` was first written.** Neither `T01` nor `T02` needed server-state fetching, so this went unnoticed until `T03`. Installed now as this task's own prerequisite; flagged so the reviewer understands why `package.json` changed in what might otherwise look like a pure-UI task's diff.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T03`.

### Outcome

No Blocking findings. One Note flagging the newly-discovered missing dependency (now resolved, not a defect in this diff), plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T03` Merged.

---

## admin-panel-ui.T04 — Full Report

**Diff reviewed:** `src/modules/admin-panel-ui/services/monitoringService.ts` (new), `src/modules/admin-panel-ui/hooks/useTransferRequestsList.ts` (new), `src/modules/admin-panel-ui/components/MonitoringList.tsx` (new), `src/modules/admin-panel-ui/components/MonitoringList.test.tsx` (new), `src/app/(admin)/transfer-requests/page.tsx` (new).

**Acceptance:** `admin-panel-ui.AC2`. API Contract consumed: `transfer-admin-oversight.API02`.

### AC verification (by ID)

- **`AC2`** — **Pass.** Every request from `API02` is rendered, each row linking to `/transfer-requests/{id}` by `id` (`UT02`). Also verified: an empty array renders an explicit empty-state message rather than a blank table (`QT04`), a loading state before data resolves, and a fetch failure renders an error state rather than crashing (`QT06`).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one comment documents the deliberate no-filtering decision, traceable to the spec's own Explicitly Out of Scope — not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/library; reuses the exact service/hook/component pattern and `authenticatedFetch`/TanStack Query infrastructure already established and reviewed under `T02`/`T03`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 4 tests failed with `Cannot find module '../services/monitoringService'` before any of the three new files existed (cross-checked against the recorded Red-confirmation). |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Mirrors `T03`'s Dashboard structure closely (service → hook → component, same loading/error-state shape) — a consistent, predictable pattern for future screens to follow. |

**Beyond the checklist:** verified with `next build`, confirming `/transfer-requests` compiles as a real route with no regression to any other route.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | `monitoringService.ts` never touches the token directly — delegated to `authenticatedFetch`. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `transfer-admin-oversight.API02`'s already-decided rate limit. |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Fetches go through `authenticatedFetch`; the route is wrapped in `AdminPanelLayout`'s guard; server-side enforcement is unchanged. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads only the already-approved endpoint. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff; no client-supplied filter exists at all, consistent with `API02`'s own no-filtering contract. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T04`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T04` Merged.

---

## admin-panel-ui.T05 — Full Report

**Diff reviewed:** `src/modules/admin-panel-ui/services/monitoringService.ts` (modified — adds `fetchTransferRequestDetail`), `src/modules/admin-panel-ui/hooks/useTransferRequestDetail.ts` (new), `src/modules/admin-panel-ui/components/TransferRequestDetail.tsx` (new), `src/modules/admin-panel-ui/components/TransferRequestDetail.test.tsx` (new), `src/app/(admin)/transfer-requests/[id]/page.tsx` (new).

**Acceptance:** `admin-panel-ui.AC3`. API Contract consumed: `transfer-admin-oversight.API03`.

### AC verification (by ID)

- **`AC3`** — **Pass.** Every field `API03` returns is rendered, plus the full `actionHistory` list, not a partial projection (`UT03`/`QT08` — verified with a 3-entry history, all 3 rendered). Also verified: an empty `actionHistory` renders an explicit "No actions yet" state rather than a blank section (`QT07`); a `404` (the service's own `null` encoding, covering both the malformed-`id` and missing-`id` cases identically, per `QT09`) renders a distinct not-found state rather than a crash; a loading state; and a generic fetch failure renders an error state.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain real decisions (why `fetchTransferRequestDetail` returns `null` for 404 specifically, rather than throwing like the list endpoint does) — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/library; reuses the established service/hook/component pattern and `authenticatedFetch`/TanStack Query infrastructure. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 5 tests failed with `Cannot find module './TransferRequestDetail'` before the component existed (cross-checked against the recorded Red-confirmation). |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Follows the same service/hook/component shape as `T03`/`T04`; the dynamic route's `params` handling matches the async-`params` convention every backend route in this project already uses. |

**Beyond the checklist:** verified with `next build`, confirming `/transfer-requests/[id]` compiles as a real dynamic route with no regression to any other route — this is also the first screen actually reachable via a real in-app link (`T04`'s `MonitoringList` rows), not just a directly-navigated URL.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `transfer-admin-oversight.API03`'s already-decided rate limit. |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Fetches go through `authenticatedFetch`; the route is wrapped in `AdminPanelLayout`'s guard; server-side enforcement (403 for non-Admin, 404 for a bad `id`) is unchanged and this diff doesn't attempt to duplicate it client-side. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads only the already-approved endpoint. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff; the `id` is a route param passed straight through to the already-reviewed API. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T05`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T05` Merged.

---

## admin-panel-ui.T06 — Full Report

**Diff reviewed:** `src/modules/admin-panel-ui/services/usersService.ts` (new), `src/modules/admin-panel-ui/hooks/useUsers.ts` (new), `src/modules/admin-panel-ui/components/UserManagement.tsx` (new), `src/modules/admin-panel-ui/components/UserManagement.test.tsx` (new), `src/app/(admin)/users/page.tsx` (new), `package.json`/`package-lock.json` (new dependencies: `formik`, `yup`).

**Acceptance:** `admin-panel-ui.AC4`, `AC5`. API Contract consumed: `user-management-console.API01`–`API04` (see Finding 1 — `API05` was cited in this task's own Acceptance line but never actually needed).

### AC verification (by ID)

- **`AC4`** — **Pass.** Every user from `API04` is listed (`UT04`).
- **`AC5`** — **Pass.** Create submits the entered fields to `API01`; a client-side Yup rule requires `managerId` when `role: "Employee"` is selected, mirroring `API01`'s own 400 validation rule rather than inventing a new one; a duplicate-username 4xx (the spec's own named example) is displayed on the form via Formik's `status`, not silently dropped. Edit calls `API02` with the new role. Delete calls `API03`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain real decisions (why the error-parsing helper handles multiple body shapes) — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `formik`/`yup` are not new architectural decisions — already named in `int-standards.nextjs.md` #11 as this project's required form library since kickoff; this task is their first actual installation and use, same treatment as `T03`'s TanStack Query discovery. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 6 tests failed with `Cannot find module '../services/usersService'` before any of the three new files existed; passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Service/hook/component split matches `T03`–`T05`'s established pattern; the mutation hooks' query-invalidation-on-success convention matches `admin-panel-ui.plan.md`'s own stated approach. |

**Beyond the checklist:** verified with `next build`, confirming `/users` compiles with no regression to any other route.

**Two interpretive gaps found and resolved explicitly, worth the reviewer's independent look:**

1. **`API05` was cited in this task's own Acceptance line, but neither `AC4`/`AC5` nor the task's own Scope bullets mention it.** Treated as an imprecise range citation left over from task-generation time, not a real requirement — this diff implements list/create/edit/delete (`API01`–`API04`) only, and `tasks.md`'s own citation has been corrected to match. If the reviewer intends a detail-view fetch before editing, this is a real, separate scope addition, not something silently dropped from an already-agreed requirement.
2. **`API02`'s payload is documented as `{ "role": "string" }`, with prose noting "and/or other account fields defined by this spec only (username/role)."** Genuinely ambiguous whether `username` is also editable. Implemented Edit as role-only, matching the literal JSON example rather than the looser prose — the more conservative reading, since inventing a username-edit capability the concrete contract doesn't show would be the riskier assumption. Flagged for confirmation rather than guessed silently.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff; the create form's password field is never logged. |
| No secrets/credentials/tokens hardcoded or logged | Pass | The entered password is sent only in the `POST /users` request body over `authenticatedFetch`, never logged or stored client-side beyond the form's own transient state. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `user-management-console`'s already-decided rate limits. |
| New dependencies vetted | Pass | `formik`/`yup` — both long-standing, widely-used packages already named in this project's own frontend standard; `npm audit` reports 0 vulnerabilities after installation. |
| Auth boundaries / least-privilege checked | Pass | Fetches go through `authenticatedFetch`; the route is wrapped in `AdminPanelLayout`'s guard; server-side role/permission enforcement (403s per `API01`–`API03`'s own contracts) is unchanged. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads/writes only the already-approved `Users` collection via its existing API. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities after adding `formik`/`yup`. |

### Findings

**Finding 1 (flagged, not a defect) — see the two interpretive gaps documented above** (`API05` citation mismatch; `API02`'s username-editability ambiguity). Both resolved with the more conservative, literal reading, explicitly recorded rather than guessed silently.

**Note (worth explicit reviewer attention, non-blocking) — a second previously-undetected missing dependency, same pattern as `T03`'s TanStack Query discovery.** `formik`/`yup` had never been installed despite being named as required infrastructure since `int-standards.nextjs.md` was first written. Worth a project-wide check for any other named-but-never-installed dependency before more form-heavy tasks (`T07`/`T08`) proceed.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T06`.

### Outcome

No Blocking findings. One Finding (two interpretive gaps, both resolved conservatively) plus two Notes (the recurring missing-dependency pattern, worth a proactive check; the routine commit-message note).

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T06` Merged.

---

## admin-panel-ui.T07 — Full Report

**Diff reviewed:** `src/modules/admin-panel-ui/services/orgStructureService.ts` (new, Departments portion), `src/modules/admin-panel-ui/hooks/useDepartments.ts` (new), `src/modules/admin-panel-ui/components/DepartmentManagement.tsx` (new), `src/modules/admin-panel-ui/components/DepartmentManagement.test.tsx` (new), `src/app/(admin)/departments/page.tsx` (new), plus `zustand`, `@base-ui/react`, `class-variance-authority`, `cn`, `components.json`, `src/components/ui/{button,input,label,table}.tsx`, `src/lib/utils.ts` (dependency/tooling setup from the prior turn, first consumed here).

**Acceptance:** `admin-panel-ui.AC6`. API Contract consumed: `org-structure-management.API01`–`API04` (not `API05` — see Finding 1).

### AC verification (by ID)

- **`AC6`** — **Pass, with scope narrowed by explicit decision.** List (`API04`), create (`API01`, including a duplicate-name 4xx surfaced on the form via Formik's `status`, mirroring `T06`'s established pattern), edit (`API02`), and delete (`API03`) are all verified. No detail view — see Finding 1.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain real decisions (why no detail view; why Zustand wasn't used here) — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `zustand`/`shadcn/ui` are not new architectural decisions — named in `constitution.md` since kickoff; this is their first actual use, same treatment as `T03`'s TanStack Query and `T06`'s Formik/Yup discoveries. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 5 tests failed with `Cannot find module '../services/orgStructureService'` before any of the three new files existed; passed cleanly on the first Green attempt, including with real shadcn/ui component integration. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Mirrors `T06`'s service/hook/component/error-parsing pattern closely, substituting shadcn/ui primitives for plain HTML — a reasonable, low-risk first adoption. |

**Beyond the checklist:** verified with `next build`, confirming `/departments` compiles with no regression to any other route, including the shared `globals.css`/font changes shadcn's init made in the prior turn.

**Two decisions worth the reviewer's explicit attention, both flagged rather than made silently:**

1. **Finding 1 — no detail view.** `org-structure-management.API05` was confirmed, directly against the code (`src/app/api/departments/[id]/route.ts` exports only `PATCH`/`DELETE`), to have never been built — matching that spec's own "Not yet set — deferred" text. This task's own Scope originally asked for a detail view against it. User chose to skip the detail view and build only what the backend supports, rather than inventing a new endpoint contract or blocking this task entirely. `tasks.md`'s own citation corrected to `API01`–`API04`.
2. **Finding 2 — Zustand deliberately not used in this task, despite the "adopt from `T07` onward" decision.** Re-examined that decision against this task's actual content and found no genuine global/cross-cutting state need — the only local state (`editingId`) is correctly `useState`, per `int-standards.nextjs.md`'s own "avoid unnecessary global state" rule. Using Zustand here would have been an artificial insertion to check a box, not a real architectural fit. The "adopt when needed" reading is applied, not "force into every task regardless of fit" — flagged explicitly so this isn't mistaken for skipped work.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `org-structure-management`'s already-decided rate limits. |
| New dependencies vetted | Pass | `zustand` (installed, not yet used — see Finding 2) and the shadcn/ui tooling (`@base-ui/react`, `class-variance-authority`, `cn`) are all long-standing, widely-used packages already named in this project's own approved stack; `npm audit` reports 0 vulnerabilities. |
| Auth boundaries / least-privilege checked | Pass | Fetches go through `authenticatedFetch`; the route is wrapped in `AdminPanelLayout`'s guard; server-side enforcement is unchanged. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads/writes only the already-approved `Departments` collection via its existing API. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities. |

### Findings

**Finding 1 (flagged, not a defect) — no detail view; see above.** Resolved by explicit user decision, recorded here and in `status.md`/`tasks.md`.

**Finding 2 (flagged, not a defect) — Zustand deliberately unused in this task; see above.** A reasoned scope judgment, not an oversight.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T07`.

### Outcome

No Blocking findings. Two Findings (both deliberate, reasoned scope decisions, not defects) plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T07` Merged.

---

## admin-panel-ui.T08 — Full Report

**Diff reviewed:** `src/modules/admin-panel-ui/services/orgStructureService.ts` (modified — adds the Job Role portion), `src/modules/admin-panel-ui/hooks/useJobRoles.ts` (new), `src/modules/admin-panel-ui/components/JobRoleManagement.tsx` (new), `src/modules/admin-panel-ui/components/JobRoleManagement.test.tsx` (new), `src/app/(admin)/job-roles/page.tsx` (new).

**Acceptance:** `admin-panel-ui.AC7`. API Contract consumed: `org-structure-management.API06`–`API09`.

### AC verification (by ID)

- **`AC7`** — **Pass.** List (`API09`), create (`API06`), edit (`API07`), delete (`API08`) all verified, plus an explicit assertion that no per-row "view detail" action is rendered — no detail endpoint (`API10`) exists for this entity, matching the API layer exactly, per this task's own explicit instruction.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one comment explains why there's no detail view/action — a real, spec-traceable decision, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/library; reuses `T07`'s exact pattern and shadcn/ui components. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 6 tests failed with `Cannot find module './JobRoleManagement'` before the component existed; passed cleanly on the first Green attempt. `T07`'s own `DepartmentManagement.test.tsx` was re-run as a regression check since the shared `orgStructureService.ts` file changed — still passes unmodified, confirming the Department portion was genuinely untouched per this task's own "Do not touch." |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). This is the last task in the spec — `admin-panel-ui.spec.md`'s Status should move `In Development` → `In QA` once this task Merges, matching every other spec's established convention; not done yet, correctly, since this task isn't Merged. |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Near-identical structure to `T07`'s `DepartmentManagement` (service/hook/component/error-parsing), differing only in field name (`title` vs `name`) and the absence of a detail view — a predictable, low-risk pattern repetition. |

**Beyond the checklist:** verified with `next build`, confirming `/job-roles` compiles with no regression to any other route. **This is the last task in `admin-panel-ui` — all 6 screens the spec ever called for now exist as real, working routes.**

**One finding worth explicit reviewer attention, resolved correctly, not glossed over:** the duplicate-title error test uses the API's *real* returned error code, `"name_exists"`, not the spec's literal-but-inaccurate `"title_exists"` — confirmed directly against `src/app/api/job-roles/route.ts`'s actual 409 handler before writing the test, rather than trusting `org-structure-management.spec.md`'s "identical to API01, substituting `title` for `name`" wording, which describes intent, not what was actually implemented. This is the same discrepancy already flagged (unresolved) in that spec's own Active Specs note — this diff doesn't fix the backend, it just displays whatever the real API actually returns, correctly.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `org-structure-management`'s already-decided rate limits. |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Fetches go through `authenticatedFetch`; the route is wrapped in `AdminPanelLayout`'s guard; server-side enforcement is unchanged. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads/writes only the already-approved `JobRoles` collection via its existing API. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (worth explicit reviewer attention, non-blocking) — the `name_exists`/`title_exists` discrepancy is displayed correctly here but remains unresolved at its source.** This diff is not the place to fix `org-structure-management`'s own spec-vs-implementation mismatch; flagged again here only so it isn't lost, consistent with that spec's own still-open clarification note.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T08`.

### Outcome

No Blocking findings. Two routine Notes, neither blocking this Merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T08` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `admin-panel-ui.T08` is Merged — all 8 tasks in this spec are now Merged. Spec Status moved `In Development` → `In QA`.

---

## admin-panel-ui.T09 — Full Report

**Diff reviewed:** `AdminPanelLayout.tsx` (nav bar + shadcn `Button` for Logout), `Dashboard.tsx`, `MonitoringList.tsx`, `TransferRequestDetail.tsx` (all restyled, plain HTML → Tailwind + shadcn `Table` where tabular), `UserManagement.tsx` (restyled, plus its form upgraded from raw HTML to shadcn `Label`/`Input`/`Button`/`Table` for consistency with `DepartmentManagement`/`JobRoleManagement`), `DepartmentManagement.tsx`, `JobRoleManagement.tsx` (spacing/layout only — already used shadcn primitives). `AdminPanelLayout.test.tsx` (2 new tests). `admin-panel-ui.spec.md` amended (new `AC12`, `UT12`; spec reopened `In QA` → `In Development` for this task only).

**Acceptance:** `admin-panel-ui.AC12` (nav links, added 2026-09-21 — testable). The visual restyling itself has no dedicated AC — cited representatively against `int-standards.nextjs.md`'s already-approved Tailwind + shadcn/ui stack.

**Origin, for reviewer context:** the user asked why the Dashboard rendered with zero styling. Found this was true of every one of this spec's 7 components, and that the panel had no navigation between screens at all — only a Logout button. By explicit user decision: one task per spec (not one per screen), navigation included alongside the styling.

### AC verification (by ID)

- **`AC12`** — **Pass.** `AdminPanelLayout` renders a nav bar, once authorized, linking to all 5 screens by their real routes (`/dashboard`, `/transfer-requests`, `/users`, `/departments`, `/job-roles`) via `next/link` (client-side navigation, not a full page reload) — confirmed via accessible link name and `href`. The nav bar does not render before authorization resolves (same guarded pattern the layout already used for its content).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one new comment names the AC the nav links satisfy — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection/dependency — restyling existing screens and adding client-side links to already-existing routes. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: the new nav-bar test failed (`getByRole("link", ...)` found nothing) before the nav existed. The visual-styling portion has no dedicated new tests (there's no meaningful assertion for "looks nice," per this task's own prompt file) — instead, every existing test file across all 7 components was re-run unmodified after the restyle and confirmed still passing, proving no tested behavior or accessible content was silently changed. |
| `status.md` and spec Status updated same day | Pass | Spec Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Reused the already-adopted shadcn/ui `Table`/`Button`/`Input`/`Label` primitives everywhere tabular/form content exists, rather than inventing a second styling approach; `NAV_LINKS` is a small, named, readable data array rather than repeated JSX. |

**Self-caught mistake, recorded not silently fixed:** an early draft of `Dashboard.tsx`'s restyle split `"{role}: {count}"` into two separate `<span>` elements for visual polish — this would have broken an existing test's regex (`getAllByText(/:\s*0/)`), which depends on both parts being in the same text node. Caught by reading the existing test file before assuming the restyle was safe, not by the test failing first; reverted to a single text node styled as one block instead of two separately-styled spans.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No endpoint touched — pure frontend markup/navigation. |
| New dependencies vetted | Pass (N/A) | None added — reuses already-approved Tailwind/shadcn-ui. |
| Auth boundaries / least-privilege checked | Pass | The nav bar only ever renders once `authorized` is true (same guard as the rest of the layout's content) — it doesn't expose any link or content to an unauthenticated or non-Admin viewer that wasn't already reachable (by URL) before this task. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No data handling in this diff. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** full suite 631/631, `tsc`/`eslint` (project-wide, exit code 0) both clean, `next build` confirms no regressions to any route.

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T09`.

### Outcome

No Blocking findings. One self-caught mistake recorded transparently, plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T09` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-21). `admin-panel-ui.T09` is Merged — **all 9 tasks in this spec are now Merged; Status returns to `In QA`.**

---

## admin-panel-ui.T10 — Full Report

**Diff reviewed:** `UserManagement.tsx` (Manager field: free-text `Input` → `<select>` filtered from `useUsers()`'s already-fetched data), `UserManagement.test.tsx` (1 existing test updated, 1 new test added).

**Acceptance:** `admin-panel-ui.AC5` (directly — no new AC). A usable create-user action implies a usable way to supply `managerId`, which `user-management-console.API01` already requires for `role: "Employee"`.

**Origin:** explicit user request — the Manager field required typing a raw Manager `id` by hand; should be a selector of available Managers instead.

### AC verification (by ID)

- **`AC5`** — **Pass.** With role `Employee` selected, the Manager field renders as a `<select>` listing every user with `role: "Manager"` from the already-fetched list, by `username` (the option value is the Manager's `id`); non-Manager users (e.g. an Employee already in the list) are correctly excluded from the options. Selecting a Manager and submitting sends that Manager's `id` as `managerId` in the create payload — the pre-existing test covering this was updated from `user.type(...)` to `user.selectOptions(...)` against a mocked list that now includes a Manager, not silently left passing against the old widget. The pre-existing "blocks submission when managerId is left empty" test (which uses an empty user list) continues to pass unmodified — an empty selector still correctly blocks submission via the same Yup rule.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | No new comment needed — the change is self-evident from the existing `.filter((candidate) => candidate.role === "Manager")` line. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new endpoint/service/dependency — reuses data already fetched by this same component's existing `useUsers()` call. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: both the updated and the new test failed against the original free-text input (no `option` elements existed to query) before the change, passed cleanly on the first Green attempt after. |
| `status.md` and spec Status updated same day | Pass | Spec Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Same `Field as="select"` pattern already used for the Role field two lines above it in the same form — no new pattern introduced. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint — reuses `GET /users`'s already-decided rate limit via the existing `useUsers()` call. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | No change to who can call `GET /users` or `POST /users` — Admin already receives the full unfiltered user list via the existing, already-reviewed `useUsers()` hook; this task only changes how that already-available data is presented in one form field. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new data flow — same already-fetched response, filtered client-side. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** full suite 638/638, `tsc`/`eslint` (project-wide, exit code 0) both clean, `next build` confirms no regressions.

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements admin-panel-ui.T10`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `admin-panel-ui.T10` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-21). `admin-panel-ui.T10` is Merged — **all 10 tasks in this spec are now Merged; Status returns to `In QA`.**

**Verdict:** Merged (Test Reviewer, 2026-09-20). `admin-panel-ui.T07` is Merged. `T08` (Job Role Management — the last task in this spec) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `admin-panel-ui.T06` is Merged. `T07` (Department Management — the first screen to adopt Zustand and shadcn/ui, per the standing decision) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `admin-panel-ui.T05` is Merged. `T06` (User Management screen) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `admin-panel-ui.T04` is Merged. `T05` (Transfer Request Detail screen) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `admin-panel-ui.T03` is Merged. `T04` (Transfer Request Monitoring list) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `admin-panel-ui.T02` is Merged. `T03` (Dashboard screen) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `admin-panel-ui.T01` is Merged. `T02` (`AdminPanelLayout`/route guard/Logout control, consuming this module) is unblocked, as are `stakeholder-panel-ui.T01`/`T02`.
