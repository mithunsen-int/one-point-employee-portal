# Gate 2 Evidence — stakeholder-panel-ui

One running file per feature for this gate. Each task gets one appended row below, plus its full findings report in this same file. Never overwritten or removed.

## Summary Table

| Task ID | Date | Reviewer (named human) | Verdict | Blocking findings | Reference |
|---|---|---|---|---|---|
| stakeholder-panel-ui.T01 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit01--full-report) |
| stakeholder-panel-ui.T02 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit02--full-report) |
| stakeholder-panel-ui.T03 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit03--full-report) |
| stakeholder-panel-ui.T04 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit04--full-report) |
| stakeholder-panel-ui.T05 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit05--full-report) |
| stakeholder-panel-ui.T06 | 2026-09-20 | Test Reviewer | Merged | None (`internal-transfer-workflow.T11` Merged 2026-09-20) | [Full report](#stakeholder-panel-uit06--full-report) |
| stakeholder-panel-ui.T07 | 2026-09-20 | Test Reviewer | Merged | None (prerequisite fixes already Merged) | [Full report](#stakeholder-panel-uit07--full-report) |
| stakeholder-panel-ui.T08 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit08--full-report) |
| stakeholder-panel-ui.T09 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit09--full-report) |
| stakeholder-panel-ui.T10 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit10--full-report) |
| stakeholder-panel-ui.T11 | 2026-09-20 | Test Reviewer | Merged | None (revised during review; `internal-transfer-workflow.T13` Merged) | [Full report](#stakeholder-panel-uit11--full-report) |
| stakeholder-panel-ui.T12 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit12--full-report) |
| stakeholder-panel-ui.T13 | 2026-09-21 | Test Reviewer | Merged | None | [Full report](#stakeholder-panel-uit13--full-report) |

---

## stakeholder-panel-ui.T01 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/authService.ts` (new), `src/modules/stakeholder-panel-ui/hooks/useLogin.ts` (new), `src/modules/stakeholder-panel-ui/components/LoginForm.tsx` (new), `src/modules/stakeholder-panel-ui/components/LoginForm.test.tsx` (new), `src/app/(stakeholder)/login/page.tsx` (new).

**Acceptance:** `stakeholder-panel-ui.AC1`, `AC2`. API Contract consumed: `rbac-api-security.API02`.

### AC verification (by ID)

- **`AC1`** — **Pass.** Valid credentials call `rbac-api-security.API02`, persist `{token, expiresAt}` via `admin-panel-ui.T01`'s shared session module (not reimplemented), decode the role, and route accordingly: Employee → `/my-requests` (this panel's own landing screen), Admin → `/dashboard` (`admin-panel-ui`'s), verified as two distinct test cases (`UT01`/`UT01b`).
- **`AC2`** — **Pass.** A 401 response displays an on-screen error via Formik's `status` and does not call `persistSession` — verified `readSession()` returns `null` afterward.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain real decisions (why no `authenticatedFetch`; why no Yup schema) — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/library; reuses `admin-panel-ui.T01`'s already-reviewed shared session module and the established TanStack Query/Formik patterns. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 3 tests failed with `Cannot find module '../services/authService'` before any of the three new files existed. **A real test-quality issue was found and fixed within this same Red→Green cycle:** the original draft asserted on `router.replace`/`readSession()` synchronously right after a simulated click, without waiting for the mutation's async `onSuccess` to actually run — a flaky, order-dependent test. Wrapped the relevant assertions in `waitFor` before relying on the result, so the Red/Green confirmation is against a properly deterministic test. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). `stakeholder-panel-ui.spec.md`'s Status moved `Tasks Generated` → `In Development`, its first task having gone Green — matching this project's standing convention. |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Service/hook/component split matches `admin-panel-ui`'s established pattern; explicit inline comments record two deliberate scope decisions (no `authenticatedFetch`, no Yup) rather than leaving them to guesswork on review. |

**Beyond the checklist:** verified with `next build`, confirming `/login` compiles as a real route with no regression to any existing route.

**`QT02` resolved during Gate 2, before Merge, by explicit user decision:** client-side validation should be introduced. Added a Yup schema (`required` on both `username`/`password`); 2 new tests confirm submission is blocked and the API is never called when either field is empty, added to this same test file. `test_cases.md`'s `QT02` row and its Open QA Question entry both updated to record the resolution, dated. Re-verified all 5 tests in this file pass, 510/510 project-wide, `tsc`/`eslint` clean, `next build` unaffected.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff; the password field is never logged. |
| No secrets/credentials/tokens hardcoded or logged | Pass | The password is sent only in the `POST /auth/login` request body; the token is persisted via the already-reviewed shared session module, never logged. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `rbac-api-security.API02`'s already-decided rate limit (5 failed attempts / 15-minute window). |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | This diff establishes a session, it does not gate access to anything — no authorization decision is made here. `persistSession`'s own storage/expiry semantics were already reviewed under `admin-panel-ui.T01`. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; token storage matches the spec's own already-recorded `localStorage` decision. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T01`.

### Outcome

No Blocking findings. `QT02` raised and resolved within this same review cycle (see above), plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T01` Merged.

---

## stakeholder-panel-ui.T02 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/components/StakeholderPanelLayout.tsx` (new), `src/modules/stakeholder-panel-ui/components/StakeholderPanelLayout.test.tsx` (new).

**Acceptance:** `stakeholder-panel-ui.AC10`, `AC11`.

### AC verification (by ID)

- **`AC10`** — **Pass.** No session → redirected to `/login`, content not rendered. A corrupted stored session (malformed token) also redirects rather than crashing — confirms `admin-panel-ui.T01`'s earlier `readSession()`/`isSessionExpired()` fail-safe fix holds when consumed from this panel too, not just `admin-panel-ui`'s. A full 6-role sweep (Employee/Manager/HR/Payroll/IT/Facilities) confirms the guard imposes **no role restriction** — correct, since unlike `admin-panel-ui`'s guard, this panel serves every non-Admin role equally, not a single one.
- **`AC11`** — **Pass.** Logout clears the session and redirects to `/login`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain the deliberate no-role-restriction difference from `admin-panel-ui`'s guard, and the SSR/hydration timing rationale — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/library; consumes `admin-panel-ui.T01`'s already-reviewed shared session module and this project's shadcn/ui `Button`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 9 tests failed with `Cannot find module './StakeholderPanelLayout'` before the component existed; passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Near-identical structure to `admin-panel-ui.T02`'s `AdminPanelLayout`, differing only in the (correct, deliberate) absence of a role check. |

**One repeat mistake caught and fixed before finalizing this review, worth the reviewer's independent look:** the same `eslint-disable-next-line react-hooks/set-state-in-effect` directive-placement error already made once in `admin-panel-ui.T02` (a multi-line comment pushed the directive away from the actual flagged line) was made again here. Caught via `eslint`'s own exit code, not assumed clean from truncated terminal output, and fixed the same way. Worth noting as a recurring authoring habit to watch for in future tasks using this same pattern.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No token handling occurs in this diff's own code — delegated entirely to the already-reviewed shared session module. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint — pure client-side component. |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Explicitly documented as client-side UX only; no server-side authorization logic is introduced or duplicated. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; consistent with the already-recorded `localStorage` decision. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (worth explicit reviewer attention, non-blocking) — recurring `eslint-disable` placement mistake; see above.** Fixed both times it occurred, but worth flagging as a pattern to watch, not a one-off.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T02`.

### Outcome

No Blocking findings. Two Notes, neither blocking this Merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T02` Merged.

---

## stakeholder-panel-ui.T03 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (new), `src/modules/stakeholder-panel-ui/hooks/useMyRequests.ts` (new), `src/modules/stakeholder-panel-ui/components/MyRequestsList.tsx` (new), `src/modules/stakeholder-panel-ui/components/MyRequestsList.test.tsx` (new), `src/app/(stakeholder)/my-requests/page.tsx` (new), `.ai-context/plans/stakeholder-panel-ui.plan.md` (modified — Route structure correction).

**Acceptance:** `stakeholder-panel-ui.AC2c`. API Contract consumed: `internal-transfer-workflow.API10`.

### AC verification (by ID)

- **`AC2c`** — **Pass.** Every item `API10` returns is rendered, each linking to `/my-requests/{id}`; an explicit test confirms no client-side filtering is applied on top of `API10`'s own server-side role filtering. Also verified: empty-state message, loading state, error state on fetch failure.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain the route-collision fix and the no-client-filtering decision — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/library; reuses the established service/hook/component/`authenticatedFetch` pattern. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 5 tests failed with `Cannot find module '../services/transferRequestsService'` before any of the three new files existed; passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Mirrors `admin-panel-ui`'s service/hook/component shape closely. |

**One real, previously-uncaught cross-plan defect found and fixed before writing any code, worth the reviewer's explicit attention:** `stakeholder-panel-ui.plan.md` and `admin-panel-ui.plan.md` both independently named `transfer-requests/[id]` as a route path. Next.js route groups (`(admin)`/`(stakeholder)`) don't affect the actual URL, so both would have resolved to the identical path — and `admin-panel-ui.T05` already Merged that exact URL for a different (Admin-only, read-only) screen. This was never caught when either plan was drafted, since their route structures were never cross-checked against each other. User chose `/my-requests/[id]` over two other options; `stakeholder-panel-ui.plan.md`'s Route structure line was corrected in place, dated, with the reasoning kept visible rather than silently edited. Verified with `next build`: `/my-requests` and `admin-panel-ui`'s `/transfer-requests/[id]` now coexist with no collision.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `internal-transfer-workflow.API10`'s already-decided rate limit. |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Fetches go through `authenticatedFetch`; the route is wrapped in `StakeholderPanelLayout`'s guard; server-side role-filtering (`API10`'s own contract) is unchanged and not duplicated client-side. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads only the already-approved endpoint. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff; no client-supplied filter exists at all. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Finding 1 (found and fixed before Merge) — the route collision described above.** Recorded in `stakeholder-panel-ui.plan.md` itself, `status.md`, and here, not silently resolved.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T03`.

### Outcome

No Blocking findings. One Finding (a real defect, found and fixed within this same cycle, before any conflicting code was written) plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T03` Merged.

---

## stakeholder-panel-ui.T04 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/orgStructureLookupService.ts` (new), `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (modified — adds `submitRequest`), `src/modules/stakeholder-panel-ui/hooks/useOrgStructureOptions.ts` (new), `src/modules/stakeholder-panel-ui/hooks/useSubmitRequest.ts` (new), `src/modules/stakeholder-panel-ui/components/SubmitRequestForm.tsx` (new), `src/modules/stakeholder-panel-ui/components/SubmitRequestForm.test.tsx` (new), `src/app/(stakeholder)/transfer-requests/new/page.tsx` (new).

**Acceptance:** `stakeholder-panel-ui.AC3`. API Contract consumed: `internal-transfer-workflow.API01` (plus read-only use of `org-structure-management.API04`/`API09`, opened to any authenticated role by the prerequisite `org-structure-management.T03`).

### AC verification (by ID)

- **`AC3`** — **Pass.** The form submits `departmentId`/`location`/`jobRoleId`/`effectiveDate`/optional `reason` to `API01`, redirecting to `/my-requests` on success. A 400 (validation) and a 404 (department/job-role not found) are both displayed on the form via Formik's `status`, not silently dropped. Client-side required-field validation blocks submission before the API is even called.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Comments explain real decisions (the local, minimal lookup service boundary; the Employee-only client check being UX only) — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/library; reuses the established service/hook/component/`authenticatedFetch`/Formik+Yup pattern. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | The original 4 tests failed with `Cannot find module '../services/orgStructureLookupService'` before any of the new files existed; passed on the first Green attempt. **A second, genuine gap was found and closed within this same cycle, before finalizing this review:** the task's own title says "Employee-only," but the first Green implementation rendered the form for any authenticated role — a non-Employee would fill out the entire form before hitting the server's 403. 5 new tests (a full non-Employee role sweep, plus an explicit Employee-renders-fine case) were added and confirmed Red against the ungated version before the client-side role check was added. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | `orgStructureLookupService.ts` follows the exact same "local, minimal, read-only, not shared across panels" boundary already established for `managersLookupService.ts` in the plan. |

**Beyond the checklist:** verified with `next build` that `/transfer-requests/new` coexists cleanly with `admin-panel-ui`'s `/transfer-requests/[id]` — a static segment naturally takes priority over a dynamic one at the same level in Next.js, so this is not a repeat of `T03`'s earlier route collision.

**One prerequisite worth the reviewer's awareness, not a defect in this diff:** this task depended on `org-structure-management.T03` (already Merged) to make `GET /departments`/`GET /job-roles` readable by a non-Admin role at all — without that fix, this form could not have been built as scoped.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `internal-transfer-workflow.API01`'s and `org-structure-management`'s already-decided rate limits. |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | The client-side Employee-only check is explicitly documented as UX only; `API01`'s own 403 for any role other than Employee is unchanged and remains the real enforcement. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads/writes only already-approved endpoints. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Finding 1 (found and fixed within this same cycle) — the missing Employee-only gate; see above.** Recorded in `status.md` and here, not silently added without a trace.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T04`.

### Outcome

No Blocking findings. One Finding (a real gap, found and closed within this same cycle, before Gate 2 was finalized) plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T04` Merged.

---

## stakeholder-panel-ui.T05 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (modified — adds `fetchRequestDetail`/`withdrawRequest`), `src/modules/stakeholder-panel-ui/hooks/useRequestDetail.ts` (new), `src/modules/stakeholder-panel-ui/hooks/useWithdraw.ts` (new), `src/modules/stakeholder-panel-ui/components/RequestDetail.tsx` (new), `src/modules/stakeholder-panel-ui/components/RequestDetail.test.tsx` (new), `src/app/(stakeholder)/my-requests/[id]/page.tsx` (new), `prompts/stakeholder-panel-ui.T05.prompt.md` (modified — stale route reference corrected).

**Acceptance:** `stakeholder-panel-ui.AC4`, `AC5`. API Contract consumed: `internal-transfer-workflow.API02`, `API09`.

### AC verification (by ID)

- **`AC4`** — **Pass.** Status, action history, and pending stakeholders are all rendered from `API02`; an empty `actionHistory` shows an explicit "No actions yet" state rather than a blank section.
- **`AC5`** — **Pass.** Withdraw is shown only while status is `Pending: Manager`, calling `API09` on click; hidden for a full sweep of other statuses (verified with `Pending: HR`).

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one comment explains this component's role as the shared base `T06`–`T11` build on — rationale, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/library; reuses the established service/hook/component/`authenticatedFetch` pattern. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 6 tests failed with `Cannot find module './RequestDetail'` before the component existed. **A genuine test-authoring ambiguity was found and fixed within this same cycle, not an implementation defect:** an early assertion (`screen.getByText(/Manager/)`) matched two elements at once (the "Pending: Manager" status text and the "Manager" pending-stakeholder list item), failing with a "multiple elements found" error rather than a real Red/Green signal. Fixed by scoping the query (`{ selector: "li" }`) to keep the assertion's actual intent, not by loosening what was being checked. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-20). This task's own prompt file had a stale route reference (`/transfer-requests/[id]`, predating the `T03` collision fix) — corrected in place before implementation started, not left inconsistent. |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | `RequestDetail.tsx` is explicitly structured as the shared base for `T06`–`T11`'s upcoming role-specific panels, matching the plan's own "one adaptive screen" design intent — worth the reviewer confirming this shape holds up once those tasks land. |

**Beyond the checklist:** verified with `next build` that `/my-requests/[id]` coexists cleanly with `admin-panel-ui`'s `/transfer-requests/[id]`.

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No new endpoint — consumes `internal-transfer-workflow.API02`/`API09`'s already-decided rate limits. |
| New dependencies vetted | Pass (N-A) | None added. |
| Auth boundaries / least-privilege checked | Pass | `API02`'s own Employee-owner-only 403 and `API09`'s own 409-if-not-`Pending: Manager` enforcement are both unchanged and not duplicated client-side; the Withdraw visibility check here is explicitly UX only. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads/writes only already-approved endpoints. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N-A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T05`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T05` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T05` is Merged. `T06` (Manager Decision panel, plugging into `RequestDetail`'s shared base) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T04` is Merged. `T05` (the adaptive request detail/action screen base — Employee own-status view + Withdraw, at `/my-requests/[id]`) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T03` is Merged. `T04` (Submit Request) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T02` is Merged. `T03` ("My Requests"/"Pending Actions" list) is unblocked next.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T01` is Merged. `T02` (`StakeholderPanelLayout`/guard/logout) is unblocked next.

---

## stakeholder-panel-ui.T06 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (changed — added `submitManagerDecision`), `src/modules/stakeholder-panel-ui/hooks/useManagerDecision.ts` (new), `src/modules/stakeholder-panel-ui/components/ManagerDecisionPanel.tsx` (new), `src/modules/stakeholder-panel-ui/components/ManagerDecisionPanel.test.tsx` (new), `src/modules/stakeholder-panel-ui/components/RequestDetail.tsx` (changed — wires in the panel), `src/modules/stakeholder-panel-ui/components/RequestDetail.test.tsx` (changed — added session login helpers and 3 new tests).

**Acceptance:** `stakeholder-panel-ui.AC6`. API Contract: `internal-transfer-workflow.API03`.

**Depends on:** `internal-transfer-workflow.T11` (Green, Gate 2 drafted, `AC19`'s wording change Gate 1 re-confirmed 2026-09-20 — but not yet Merged; see that spec's own Gate 2 evidence). Without `T11`'s `API02` carve-out, this task's own panel could never render for a Manager at all, since `RequestDetail`'s data fetch would 403 first. **Recommend reviewing `T11` alongside this task, in the same sitting, since one is not meaningfully reviewable in isolation from the other.**

### AC verification (by ID)

- **`AC6`** — **Pass.** The Manager Decision panel renders only when the viewer's role is `Manager` and the request's status is `Pending: Manager` — confirmed absent for the owning Employee viewing the same request, and confirmed absent once status has moved past `Pending: Manager`. Approve calls `API03` with `{ decision: "approve" }`, no reason. Reject is blocked client-side with "Reason is required" until a reason is entered (Yup), matching `API03`'s own server-side conditional-required rule rather than a stricter or looser client rule. A rejected mutation (e.g. the server's own 409/403) surfaces its message via Formik `status`, not silently swallowed.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The two inline comments explain real decisions (Approve deliberately bypassing Formik validation; the panel's gating condition deliberately not re-checking "is this the assigned Manager" since `T11`'s fetch-level carve-out already guarantees it) — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection; a new component and hook inside the already-documented `stakeholder-panel-ui` frontend layer. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: `ManagerDecisionPanel.test.tsx` failed with `Cannot find module './ManagerDecisionPanel'`; the new `RequestDetail.test.tsx` case failed on a wrong `getByRole` assertion (button not found) — both for the right reason, both passed cleanly on the first Green attempt after implementation. |
| `status.md` and spec Status updated same day | Pass | `status.md`'s Daily Execution Log entry explicitly cross-references the `T11` dependency rather than presenting this task as self-contained. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | `useManagerDecision` mirrors `useWithdraw`'s exact shape (mutation + dual query invalidation); the service function mirrors `submitRequest`'s existing error-handling convention. No new abstraction introduced beyond what the existing sibling files already establish. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint — consumes `internal-transfer-workflow.API03`'s already-decided rate limit. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | The panel's client-side gate is explicitly UX only — `API03`'s own server-side assigned-Manager-only 403 and `Pending: Manager`-only 409 are the real enforcement, unchanged and not duplicated or weakened here. The panel's visibility condition (role + status) was deliberately checked against the possibility of a false positive: since `T11` only ever returns 200 to a Manager who is the assigned Manager on a `Pending: Manager` request, no other Manager can reach a state where this panel renders for a request that isn't theirs. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads/writes only the already-approved `TransferRequests` collection via existing endpoints. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** verified with `next build` that `/my-requests/[id]` still compiles alongside every other existing route, no regressions.

### Findings

**Note (worth explicit reviewer attention, non-blocking for this task's own code, but see `T11`'s own Blocking-adjacent finding) — this task is not independently mergeable ahead of `internal-transfer-workflow.T11`.** Merging `T06` without `T11` would ship a Manager Decision panel that never renders in production, since the underlying detail fetch would still 403 for every Manager. Recommend merging both in the same session, or at minimum confirming `T11`'s merge lands first.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T06`.

### Outcome

No Blocking findings against this task's own code. One finding flagged for explicit reviewer attention regarding the `T11` merge-ordering dependency, plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T06` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T06` is Merged, following `internal-transfer-workflow.T11`'s own Merge earlier the same day. `T07` (HR Decision panel, over `internal-transfer-workflow.API04`) is unblocked next — likely to need its own equivalent `API02` carve-out (reusing `AC22`, per `T11`'s deferred note) before it can render for HR the same way `T06` needed `T11` for Manager.

---

## stakeholder-panel-ui.T07 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (changed — added `submitHrDecision`), `src/modules/stakeholder-panel-ui/hooks/useHrDecision.ts` (new), `src/modules/stakeholder-panel-ui/components/HrDecisionPanel.tsx` (new), `src/modules/stakeholder-panel-ui/components/HrDecisionPanel.test.tsx` (new), `src/modules/stakeholder-panel-ui/components/RequestDetail.tsx` (changed — wires in the panel), `src/modules/stakeholder-panel-ui/components/RequestDetail.test.tsx` (changed — 3 new tests).

**Acceptance:** `stakeholder-panel-ui.AC7`. API Contract: `internal-transfer-workflow.API04` (hr-decision).

**Depends on:** `internal-transfer-workflow.T12` and `user-management-console.T07` (both Merged 2026-09-20, found and fixed during the proactive `T07`–`T11` blocker audit run *before* this task started). Unlike `T06`, this task did not itself surface a new blocker — the prerequisite work was already done and Merged ahead of time, so this diff is exactly what the task's own prompt file scoped, with no interpretive gaps found.

### AC verification (by ID)

- **`AC7`** — **Pass.** The HR Decision panel renders only when the viewer's role is `HR` and the request's status is `Pending: HR` — confirmed absent for the owning Employee viewing the same request, and confirmed absent once status has moved to `Pending: Payroll, IT, Facilities` (deliberately gated on this exact status, not "any request HR can currently view" per `AC22`'s broader eligibility — that broader case is `T11`'s Final Mapping panel, a different task). Approve calls `API04`'s hr-decision endpoint with `{ decision: "approve" }`, no reason. Reject is blocked client-side with "Reason is required" until entered (Yup), matching the server's own conditional-required rule. A rejected mutation (e.g. the server's own 409 for the 90-day eligibility check) surfaces its message via Formik `status`, not silently swallowed.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The two inline comments explain real decisions (Approve bypassing Formik validation; the panel's gate deliberately using the narrower `Pending: HR` status rather than the full `AC22` eligibility window) — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection; a new component and hook inside the already-documented `stakeholder-panel-ui` frontend layer. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: `HrDecisionPanel.test.tsx` failed with `Cannot find module './HrDecisionPanel'`; the new `RequestDetail.test.tsx` case failed on a missing `getByRole` button — both for the right reason, both passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | `status.md`'s entry explicitly notes this task needed no new interpretive decisions, since the prerequisite audit had already resolved everything. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | `HrDecisionPanel`/`useHrDecision` are near-identical in structure to `T06`'s `ManagerDecisionPanel`/`useManagerDecision` — intentionally so, since both implement the same "Approve bypasses validation, Reject is Yup-gated" contract shape. No shared abstraction was extracted between them; two small, near-identical components were judged clearer than a parameterized one for a two-instance case, consistent with this project's stated preference against premature abstraction. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint — consumes the hr-decision endpoint's already-decided rate limit. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | The panel's client-side gate is explicitly UX only — the server's own HR-role-only 403, `Pending: HR`-only 409, and 90-day-eligibility 409 are the real enforcement, unchanged and not duplicated or weakened here. Since HR's `API02` carve-out (`T12`) is not person-specific (any HR user, matching this decision endpoint's own existing non-routing rule), no additional "is this the right HR user" check was needed or invented. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads/writes only the already-approved `TransferRequests` collection via existing endpoints. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** verified with `next build` that `/my-requests/[id]` still compiles alongside every other existing route, no regressions. Full suite 582/582.

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T07`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T07` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T07` is Merged. `T08` (Payroll task-completion form, over `internal-transfer-workflow.API05`) is unblocked next — its own `API02` carve-out was already cleared by `internal-transfer-workflow.T12`.

---

## stakeholder-panel-ui.T08 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (changed — added `submitPayrollTask`), `src/modules/stakeholder-panel-ui/hooks/usePayrollTask.ts` (new), `src/modules/stakeholder-panel-ui/components/PayrollTaskForm.tsx` (new), `src/modules/stakeholder-panel-ui/components/PayrollTaskForm.test.tsx` (new), `src/modules/stakeholder-panel-ui/components/RequestDetail.tsx` (changed — wires in the form), `src/modules/stakeholder-panel-ui/components/RequestDetail.test.tsx` (changed — 3 new tests).

**Acceptance:** `stakeholder-panel-ui.AC8` (Payroll portion only — `T09`/`T10` cover IT/Facilities). API Contract: `internal-transfer-workflow.API05`.

**Depends on:** `internal-transfer-workflow.T12` (Merged 2026-09-20), already covering Payroll's `API02` carve-out. No new blocker found for this task — the earlier audit already cleared it.

**Verified directly against the code before designing the form, not assumed from spec prose:** `payroll-task/route.ts` performs **no payload validation at all** — it doesn't even call `request.json()` to inspect the body; any request from an authorized Payroll caller in the right state simply marks `payrollTaskStatus: "Completed"`. This is a pre-existing, already-documented design decision from `internal-transfer-workflow.T06`'s own Gate 2 review ("no payload validation on any of the three endpoints, by design"), not a new finding. This task's own client-side Yup validation exists for the real Payroll user's data-entry experience — ensuring they don't submit an "update" with blank fields — not to satisfy any server-side contract, since the server doesn't enforce or even read one.

### AC verification (by ID)

- **`AC8`** (Payroll portion) — **Pass.** The form renders only when the viewer's role is `Payroll` and the request's status is `Pending: Payroll, IT, Facilities` — confirmed absent for the owning Employee, and confirmed absent once status has moved to `Completed`. Selecting "Update payroll details" (the default) requires all four fields (`salary`/`compensation`/`tax`/`costCenter`) before submit; selecting "No Action Needed" hides those fields entirely and submits with only `{ action: "no_action_needed" }`, no stray empty-string fields included. A rejected mutation (e.g. the server's own 409 if the task was already completed concurrently) surfaces via Formik `status`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one inline comment explains why client-side validation exists despite the server's own leniency — a real, non-obvious design note, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection; a new component and hook inside the already-documented frontend layer. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: `PayrollTaskForm.test.tsx` failed with `Cannot find module './PayrollTaskForm'`; the new `RequestDetail.test.tsx` case failed on a missing `getByRole` button — both for the right reason, both passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | `status.md`'s entry explicitly notes the payload-validation finding was pre-existing and already documented, not newly discovered here. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Uses the same `Field as="select"` dropdown pattern already established in `SubmitRequestForm.tsx`, and the same conditional-fields-by-value pattern is a natural, minimal extension of Formik's render props — no new abstraction introduced for a single conditional block. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements anywhere in the diff — notably, `salary`/`compensation`/`tax` are never logged, consistent with `internal-transfer-workflow.spec.md`'s own Non-Functional Constraint on this exact data. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint — consumes the payroll-task endpoint's already-decided rate limit. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | The panel's client-side gate is UX only — the server's own Payroll-role-only 403 and status/task-status 409 are the real enforcement, unchanged here. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; the payload fields aren't persisted anywhere by the server (confirmed above), consistent with the project's existing, already-reviewed design for this endpoint. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** verified with `next build` that all routes still compile with no regressions. Full suite 590/590.

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T08`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T08` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T08` is Merged. `T09` (IT task-completion form, over `internal-transfer-workflow.API06`) is unblocked next — its own `API02` carve-out was already cleared by `internal-transfer-workflow.T12`.

---

## stakeholder-panel-ui.T09 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (changed — added `submitItTask`), `src/modules/stakeholder-panel-ui/hooks/useItTask.ts` (new), `src/modules/stakeholder-panel-ui/components/ItTaskForm.tsx` (new), `src/modules/stakeholder-panel-ui/components/ItTaskForm.test.tsx` (new), `src/modules/stakeholder-panel-ui/components/RequestDetail.tsx` (changed — wires in the form), `src/modules/stakeholder-panel-ui/components/RequestDetail.test.tsx` (changed — 3 new tests).

**Acceptance:** `stakeholder-panel-ui.AC8` (IT portion only — `T08`/`T10` cover Payroll/Facilities). API Contract: `internal-transfer-workflow.API06`.

**Depends on:** `internal-transfer-workflow.T12` (Merged 2026-09-20), already covering IT's `API02` carve-out. No new blocker found.

**Verified directly against the code before designing the form:** `it-task/route.ts` performs no payload validation, same as `payroll-task` — confirmed rather than assumed from spec prose, consistent with this session's standing practice.

**A first for this project, worth calling out to the reviewer:** `API06`'s contract is the first array-typed payload (`systemsAccess`/`permissions`/`devices`, each `string[]`) any frontend task in this project has had to build a form for. No existing multi-value/repeatable-field UI pattern exists yet to reuse. Chose the simplest option that satisfies the contract: one comma-separated text input per field, split into a trimmed, empty-filtered array on submit — not a `FieldArray`-based repeatable-row UI, since that would be a heavier abstraction for a single, first-time use case with no other consumer in sight. Flagging this as a judgment call rather than a silent choice, in case the reviewer wants a richer input UX for a real user.

### AC verification (by ID)

- **`AC8`** (IT portion) — **Pass.** The form renders only when the viewer's role is `IT` and status is `Pending: Payroll, IT, Facilities` — confirmed absent for the owning Employee, and confirmed absent once status has moved to `Completed`. No "No Action Needed" option, per this task's own scope (that's Payroll-specific only). All three fields are required client-side; submitting blank shows "Systems access is required" and does not call the service. Entering comma-separated values (including one with a trailing space, `"VPN, Email "`) is split, trimmed, and empty-filtered correctly into `["VPN", "Email"]`. A rejected mutation surfaces via Formik `status`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The inline comment explains the no-server-validation finding (already verified directly, not assumed) — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection; a new component and hook inside the already-documented frontend layer. The comma-separated-input choice is a component-level UI decision, not architecturally significant enough for an ADR. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: `ItTaskForm.test.tsx` failed with `Cannot find module './ItTaskForm'`; the new `RequestDetail.test.tsx` case failed on a missing `getByLabelText` match — both for the right reason, both passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | `status.md`'s entry explicitly flags the comma-separated-input choice as a judgment call, not a silent decision. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | `toList()` is a small, named, testable helper rather than inline `.split().map().filter()` repeated three times — the one small abstraction actually warranted here, not over-engineered into a reusable multi-field component for a single consumer. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Client-side gate is UX only — the server's own IT-role-only 403 and status/task-status 409 remain the real enforcement, unchanged. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; payload fields aren't persisted anywhere by the server (confirmed directly, same as `T08`'s finding for Payroll). |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** verified with `next build` that all routes still compile with no regressions. Full suite 597/597.

### Findings

**Note (worth reviewer awareness, non-blocking) — comma-separated text input chosen over a repeatable-field UI for the project's first array-typed form fields.** See the judgment-call callout above. Functionally correct and tested, but a real IT user might prefer add/remove rows over typing commas — worth a future UX pass if this pattern recurs elsewhere.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T09`.

### Outcome

No Blocking findings. One UX judgment call flagged for awareness, plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T09` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T09` is Merged, including the comma-separated-input judgment call as-is. `T10` (Facilities task-completion form, over `internal-transfer-workflow.API07`) is unblocked next — its own `API02` carve-out already cleared by `internal-transfer-workflow.T12`.

---

## stakeholder-panel-ui.T10 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (changed — added `submitFacilitiesTask`), `src/modules/stakeholder-panel-ui/hooks/useFacilitiesTask.ts` (new), `src/modules/stakeholder-panel-ui/components/FacilitiesTaskForm.tsx` (new), `src/modules/stakeholder-panel-ui/components/FacilitiesTaskForm.test.tsx` (new), `src/modules/stakeholder-panel-ui/components/RequestDetail.tsx` (changed — wires in the form), `src/modules/stakeholder-panel-ui/components/RequestDetail.test.tsx` (changed — 3 new tests).

**Acceptance:** `stakeholder-panel-ui.AC8` (Facilities portion only — `T08`/`T09` cover Payroll/IT, completing `AC8`'s three-role coverage). API Contract: `internal-transfer-workflow.API07`.

**Depends on:** `internal-transfer-workflow.T12` (Merged 2026-09-20), already covering Facilities' `API02` carve-out. No new blocker found.

**Verified directly against the code before designing the form:** `facilities-task/route.ts` performs no payload validation, same pattern as `T08`/`T09`'s endpoints — confirmed rather than assumed. Unlike `T09`, `API07`'s three fields (`workspace`/`officeLogistics`/`locationSetup`) are plain strings, so no repeat of `T09`'s comma-separated-input judgment call was needed — a straightforward three-field form, structurally closest to `T08`'s Payroll form minus the action toggle.

### AC verification (by ID)

- **`AC8`** (Facilities portion, completing this AC's three-role coverage across `T08`–`T10`) — **Pass.** The form renders only when the viewer's role is `Facilities` and status is `Pending: Payroll, IT, Facilities` — confirmed absent for the owning Employee, and confirmed absent once status has moved to `Completed`. No "No Action Needed" option, per this task's own scope. All three fields required client-side; submitting blank shows "Workspace is required" and does not call the service. Filled submission calls the service with the exact three fields, no extras. A rejected mutation surfaces via Formik `status`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one inline comment states the no-server-validation finding — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection; a new component and hook inside the already-documented frontend layer. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: `FacilitiesTaskForm.test.tsx` failed with `Cannot find module './FacilitiesTaskForm'`; the new `RequestDetail.test.tsx` case failed on a missing `getByLabelText` match — both for the right reason, both passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | `status.md`'s entry notes this task needed no new judgment call, unlike `T09`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Structurally near-identical to `T08`'s `PayrollTaskForm` (minus the action toggle) — intentional consistency across the three sibling task-completion forms, no shared abstraction extracted for three small, structurally-different-enough forms. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Client-side gate is UX only — the server's own Facilities-role-only 403 and status/task-status 409 remain the real enforcement, unchanged. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; payload fields aren't persisted anywhere by the server (confirmed directly, same finding as `T08`/`T09`). |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** verified with `next build` that all routes still compile with no regressions. Full suite 604/604. All three of `AC8`'s roles (`T08`/`T09`/`T10`) are now complete.

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T10`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T10` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T10` is Merged — `AC8`'s three-role coverage (`T08`/`T09`/`T10`) is now complete. `T11` (HR Final Mapping panel, over `internal-transfer-workflow.API08` plus `user-management-console.API04`'s Manager selector) is unblocked next — the last task in this spec.

---

## stakeholder-panel-ui.T11 — Full Report

**Diff reviewed:** `src/modules/stakeholder-panel-ui/services/transferRequestsService.ts` (changed — added `submitHrFinalMapping`), `src/modules/stakeholder-panel-ui/services/managersLookupService.ts` (new), `src/modules/stakeholder-panel-ui/hooks/useHrFinalMapping.ts` (new), `src/modules/stakeholder-panel-ui/hooks/useManagersList.ts` (new), `src/modules/stakeholder-panel-ui/components/HrFinalMappingPanel.tsx` (new), `src/modules/stakeholder-panel-ui/components/HrFinalMappingPanel.test.tsx` (new), `src/modules/stakeholder-panel-ui/components/RequestDetail.tsx` (changed — wires in the panel), `src/modules/stakeholder-panel-ui/components/RequestDetail.test.tsx` (changed — mocks `managersLookupService`, 3 new tests).

**Acceptance:** `stakeholder-panel-ui.AC9` — the last AC in this spec. API Contract: `internal-transfer-workflow.API08`, `user-management-console.API04` (read-only, `role=Manager` filtered).

**Depends on:** `internal-transfer-workflow.T12` (HR's `API02` carve-out) and `user-management-console.T07` (the `role=Manager` list carve-out), both Merged 2026-09-20 — no new blocker found there, resolved ahead of time during the earlier `T07`–`T11` audit. **Additionally now depends on `internal-transfer-workflow.T13`** (see Revision below), not yet Merged.

**A non-obvious gating decision, originally flagged for reviewer attention — since resolved by reviewer direction, see Revision below.** `RequestDetail`'s `API02` response never included `payrollTaskStatus`/`itTaskStatus`/`facilitiesTaskStatus` — there was no field in that response an HR viewer could check to confirm "all three tasks are actually Completed" before deciding whether to render this panel. The original implementation relied on `internal-transfer-workflow.T12`'s own carve-out logic as an indirect signal (the fetch itself only succeeding once true). Flagged here explicitly as load-bearing for a condition the frontend had no other way to check.

### Revision (2026-09-20, during this Gate 2 review) — at explicit reviewer direction

The reviewer directed two things: (1) introduce a new, directly observable status (`Pending: Transfer`) rather than relying on the indirect carve-out signal, and (2) confirmed the required-Manager-selection judgment call as correct, no change needed. Item (1) was implemented as a new task, `internal-transfer-workflow.T13` (`AC25`, plus amendments to `AC13`/`AC14`/`AC18`/`AC22` — see that spec's own Gate 2 evidence, itself awaiting both Gate 1 re-confirmation and its own Gate 2 verdict). This task's own diff was revised accordingly: `RequestDetail.tsx`'s gate for `HrFinalMappingPanel` changed from `role === "HR" && status === "Pending: Payroll, IT, Facilities"` to `role === "HR" && status === "Pending: Transfer"` — no more indirect inference, the status itself is now the direct, authoritative signal. `RequestDetail.test.tsx`'s three HR-Final-Mapping-panel tests were updated to the new status, plus one new test added proving the panel stays hidden while still `Pending: Payroll, IT, Facilities` (parallel tasks still in progress). All 25 tests in that file re-confirmed Green after the revision; full suite 621/621, `tsc`/`eslint`/`next build` all re-verified clean.

**`internal-transfer-workflow.T13` is now Merged (Test Reviewer, 2026-09-20, including its Gate 1 re-confirmation)** — this task's additional dependency, noted above, is cleared. Only this task's own Gate 2 verdict remains outstanding.

**A second judgment call — confirmed correct by the reviewer, no change made:** `API08`'s own payload treats `newManagerId` as optional (the route completes without a manager update if omitted). This panel requires a selection anyway, since choosing a new manager is `AC9`'s and this panel's entire stated purpose — allowing a silent skip would mean an HR user could "complete" the final mapping step without ever assigning a manager, defeating the feature. Client-side only; the server's own leniency is unchanged.

### AC verification (by ID)

- **`AC9`** — **Pass.** The panel renders only for an HR viewer on a request in `Pending: Transfer` (post-revision) — confirmed absent for the owning Employee, confirmed absent while the same HR viewer is still in the earlier `Pending: HR` decision stage, and confirmed absent while the parallel tasks are still in progress (`Pending: Payroll, IT, Facilities`) — proving `T07`'s and `T11`'s panels don't collide on any status. The Manager selector is populated from `useManagersList`, itself backed by `user-management-console.T07`'s new `role=Manager` filter. Submitting with no manager selected is blocked with "Manager is required"; submitting with one selected calls `API08` with exactly that `newManagerId`. A rejected mutation surfaces via Formik `status`.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. This closes out the last AC (`AC9`) in `stakeholder-panel-ui.spec.md`. |
| No AI-attribution in comments/commit messages | Pass | The two inline comments explain the two judgment calls above — real, non-obvious reasoning, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection; `managersLookupService.ts` follows the exact same "local, read-only, not shared across panels" boundary already established for `orgStructureLookupService.ts`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: `HrFinalMappingPanel.test.tsx` initially failed 2 of its 4 tests, but on inspection those 2 failures were a genuine test-authoring timing bug (asserting on the `<select>` via `findByLabelText`, which resolves before the async `useManagersList` query populates its options) — not the intended Red state. Fixed the test to wait for a specific `option` to appear first, re-ran, and got the correct Red signal before implementing (`Cannot find module './HrFinalMappingPanel'` for the component file; a missing button for the new `RequestDetail.test.tsx` case). This self-caught test bug is recorded here rather than silently fixed, per this project's standing practice around test-authoring mistakes. |
| `status.md` and spec Status updated same day | Pass | `status.md`'s entry notes this is the last task in the spec and both flagged judgment calls. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | `managersLookupService.ts`/`useManagersList.ts` mirror `orgStructureLookupService.ts`/`useOrgStructureOptions.ts`'s exact shape; the panel itself follows the same Formik+Yup structure as every other panel in this module. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Delegated entirely to `authenticatedFetch`, already reviewed. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint — consumes `API08`'s and `API04`'s already-decided rate limits. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Client-side gate is UX only — `API08`'s own HR-role-only 403 and all-tasks-`Completed` 409 remain the real enforcement. The Manager list itself only ever returns the minimal `id`/`username`/`role` shape `user-management-console.T07` already scoped narrowly — no additional data exposure introduced by this consumer. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No new datastore; reads/writes only already-approved endpoints. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** verified with `next build` that all routes still compile with no regressions. Full suite 621/621 (post-revision). **This is the last task in `stakeholder-panel-ui`** — once Merged, all 11 tasks are complete.

### Findings

**Note (resolved via the Revision above) — the original "fetch already enforces eligibility" gating pattern has been replaced with a direct, first-class status check.** No longer a standing concern — `Pending: Transfer` is now the authoritative signal, pending only `internal-transfer-workflow.T13`'s own Merge.

**Note (resolved, confirmed correct) — client-side-required Manager selection, stricter than `API08`'s own optional payload field.** Reviewer confirmed this is the intended behavior; no change made.

**Note (non-blocking) — a self-caught test-authoring timing bug, recorded not silently fixed.** See the Gate 2 Checklist row above for detail.

**Note (resolved) — `internal-transfer-workflow.T13` is now Merged.** The merge-ordering dependency flagged earlier is cleared; this task is now independently mergeable.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T11`.

### Outcome

No Blocking findings. Both original judgment calls resolved (one via a backend revision, one confirmed as-is), a self-caught test bug recorded transparently, and one new merge-ordering dependency on `internal-transfer-workflow.T13` flagged.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T11` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T11` is Merged — **all 11 tasks in this spec are now Merged; Status returns to `In QA`**, following `internal-transfer-workflow.T13`'s own Merge earlier the same day. This completes the full UI build-out for both `admin-panel-ui` and `stakeholder-panel-ui`.

---

## stakeholder-panel-ui.T12 — Full Report

**Diff reviewed:** `src/shared/auth/homeRouteForRole.ts` (new), `src/app/page.tsx` (rewritten — was the unmodified `create-next-app` scaffold), `src/app/page.test.tsx` (new), `src/modules/stakeholder-panel-ui/components/LoginForm.tsx` (changed — uses the new helper, adds an already-authenticated redirect), `src/modules/stakeholder-panel-ui/components/LoginForm.test.tsx` (changed — 2 new tests). `stakeholder-panel-ui.spec.md` amended (new `AC12`, `UT12`/`UT12b`/`UT12c`/`UT12d`; spec reopened `In QA` → `In Development` for this task only). No BRD entry added or changed, by explicit user instruction — recorded as a small extension of `BRD-008`'s already-resolved session/redirect behavior.

**Acceptance:** `stakeholder-panel-ui.AC12` (added 2026-09-20).

**Origin, for reviewer context:** the user asked what the first screen would be when visiting the bare site URL. `src/app/page.tsx` was still the unmodified Next.js scaffold — no spec had ever claimed the root route, so there was no path from the bare URL into either panel at all. Scoped and confirmed with the user before implementation: redirect based on session at both `/` and `/login` itself (an already-authenticated user visiting Login directly was also never redirected away, the same class of gap).

### AC verification (by ID)

- **`AC12`** — **Pass.** `/` with no session redirects to `/login`; with an expired session (`persistSession(..., -1)`) also redirects to `/login`, not treated as valid. `/` with a valid Admin session redirects to `/dashboard`; with a valid non-Admin session, to `/my-requests`. `/login` itself, visited directly while already holding a valid session, redirects to the role's home page without ever rendering the form (verified for both Employee and Admin). `LoginForm`'s own pre-existing fresh-login-success redirect tests (Employee → `/my-requests`, Admin → `/dashboard`) still pass unmodified, now routed through the shared `homeRouteForRole` helper — same behavior, single implementation.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The two inline comments explain why the helper exists and why Login needs its own check — real design notes, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection — one new small helper alongside the already-documented `src/shared/auth/` module, and a rewrite of a page that was never part of any spec's architecture to begin with. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 4 new `page.test.tsx` tests failed against the literal scaffold page (no redirect calls at all); both new `LoginForm.test.tsx` tests failed since no already-authenticated check existed yet. All 11 passed cleanly on the first Green attempt. |
| `status.md` and spec Status updated same day | Pass | Spec Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | `homeRouteForRole` is a one-line, obviously-named extraction of a decision that was about to exist in two places (`page.tsx`, `LoginForm.tsx`) — a genuinely warranted, minimal abstraction, not premature. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | Reuses the already-reviewed `session.ts` module's own read functions; no new credential handling. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint — purely client-side routing. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | Purely a UX convenience redirect — no server-side authorization is granted, changed, or bypassed by this task. A forged/corrupted `localStorage` session degrades to "no session" via `session.ts`'s own already-reviewed fail-safe behavior (`decodeRole`/`isSessionExpired`), not a new risk introduced here. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No data persisted or transmitted by this task. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend/database code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** verified with `next build` that `/` now compiles as a real route (`○ /`, static) alongside every other existing route, no regressions. Full suite 627/627.

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T12`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T12` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `stakeholder-panel-ui.T12` is Merged — **all 12 tasks in this spec are now Merged; Status returns to `In QA`.** The bare site URL now redirects correctly for every visitor.

---

## stakeholder-panel-ui.T13 — Full Report

**Diff reviewed:** `StakeholderPanelLayout.tsx` (nav bar — role-conditional Submit Request link, tracks `role` not just `authorized` now), `LoginForm.tsx`, `MyRequestsList.tsx`, `SubmitRequestForm.tsx`, `RequestDetail.tsx`, `ManagerDecisionPanel.tsx`, `HrDecisionPanel.tsx`, `PayrollTaskForm.tsx`, `ItTaskForm.tsx`, `FacilitiesTaskForm.tsx`, `HrFinalMappingPanel.tsx` (all restyled — all already used shadcn/ui `Button`/`Input`/`Label` primitives, so this was layout/spacing only, no primitive swaps needed, unlike `admin-panel-ui.T09`'s `UserManagement.tsx`). `StakeholderPanelLayout.test.tsx` (6 new tests). `stakeholder-panel-ui.spec.md` amended (new `AC13`, `UT13`/`UT13b`; spec reopened `In QA` → `In Development` for this task only).

**Acceptance:** `stakeholder-panel-ui.AC13` (nav links, added 2026-09-21 — testable). The visual restyling itself has no dedicated AC — cited representatively against `int-standards.nextjs.md`'s already-approved stack, same treatment as `admin-panel-ui.T09`.

**Origin, for reviewer context:** same investigation as `admin-panel-ui.T09` — found all 11 components in this spec had zero styling, and no navigation existed between screens. By explicit user decision: one task per spec, navigation included.

### AC verification (by ID)

- **`AC13`** — **Pass.** `StakeholderPanelLayout` renders a "My Requests" link (`/my-requests`) for every one of the 6 roles. An Employee additionally sees a "Submit Request" link (`/transfer-requests/new`); every other role (Manager/HR/Payroll/IT/Facilities, swept via `it.each`) does not see that link at all — matching `SubmitRequestForm`'s own existing role gate, so no role is ever shown a link to a screen that would just reject them.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one new comment explains why the layout now tracks `role` instead of a plain boolean — real design context, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/dependency — restyling existing screens, adding links to already-existing routes. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 6 new nav-bar tests failed (no nav rendered) before the change. The visual-styling portion has no dedicated new tests, per this task's own prompt file — instead, every existing test file across all 11 components was re-run unmodified after restyling and confirmed still passing. |
| `status.md` and spec Status updated same day | Pass | Spec Status correctly shows `In Development` (reopened), not left stale at `In QA` while this task is unmerged. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Same layout/spacing conventions `admin-panel-ui.T09` established (page container, heading sizes, form-field wrapper spacing, `text-sm text-destructive` for errors) reused verbatim here for a consistent look across both panels, not a second, drifting style. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No endpoint touched — pure frontend markup/navigation. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries / least-privilege checked | Pass | The nav bar only renders once a session is confirmed (same guard as the rest of the layout's content); the role-conditional Submit Request link is UX only — `SubmitRequestForm`'s own existing client-side gate and `API01`'s server-side 403 are unchanged and remain the real enforcement. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | No data handling in this diff. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass (N/A) | No backend code in this diff. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

**Beyond the checklist:** full suite 637/637, `tsc`/`eslint` (project-wide, exit code 0) both clean, `next build` confirms no regressions to any route. **This is the last task in `stakeholder-panel-ui`** — once Merged, both UI specs' visual-polish passes are complete.

### Findings

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements stakeholder-panel-ui.T13`.

### Outcome

No Blocking findings. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `stakeholder-panel-ui.T13` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-21). `stakeholder-panel-ui.T13` is Merged — **all 13 tasks in this spec are now Merged; Status returns to `In QA`.** Both UI specs' visual-polish passes are now complete.
