# Spec: HOTFIX-2026-0921-stakeholder-lost-view-after-action

## Status
**Emergency-Merged → Retro-Documented (2026-09-21).** Gate 2 verdict recorded below (Test Reviewer, 2026-09-21) — Merged same day.

## Related
.ai-context/specs/internal-transfer-workflow.spec.md (AC19 — amended a third time by this hotfix; AC21–AC23 — amended once by this hotfix)
.ai-context/specs/stakeholder-panel-ui.spec.md (AC4/AC6–AC9 — the request detail screen that broke; AC5 — the Withdraw action's own visibility; AC2c — the "My Requests"/"Pending Actions" list, this hotfix's only navigation path into the detail screen)

## What Was Broken
Three related issues, all in the "a stakeholder should still be able to see a request after they've acted on it" area, found across two rounds of real usage:

1. The moment a Manager, HR, Payroll, IT, or Facilities user completed their own action on a request (approve/reject/complete-task), they permanently lost the ability to even *view* that request afterward — the screen showed "Something went wrong loading your request" instead of a read-only view of what they'd already acted on.
2. Separately, in the same component: the Withdraw button (meant for the requesting Employee only) had no client-side role check, so a Manager/HR/etc. legitimately viewing a request they're currently eligible to decide on would also see a Withdraw button that isn't theirs to use.
3. Found after issues 1–2 were already fixed: `GET /transfer-requests/mine` (`API10`, the "My Requests"/"Pending Actions" list) never gained the same historical-actor carve-out. Since this list is `AC2c`'s *only* navigation path into the detail screen, issue 1's fix was reachable in theory but undiscoverable in practice — an HR user who'd completed a request no longer saw it anywhere and had no way to click into it, even though `API02` would have returned it correctly. Reported directly by the user: "as an HR, I cannot see the read-only request in 'my request' section... it shows 'No requests to show right now.'"

## Root Cause
1. `GET /transfer-requests/{id}`'s eligibility check (`src/app/api/transfer-requests/[id]/route.ts`) was written entirely as "can this caller *currently act* on this request" — each role's condition requires the request to still be in that role's own pending stage (e.g. Manager requires `status === "Pending: Manager"`). The moment a stakeholder acts, the status moves on and their own condition stops matching, so the fetch 403s. This was true from the moment each carve-out was built (`internal-transfer-workflow.T11`/`T12`) — the design only ever considered "can I decide," never "can I look back at what I decided." `internal-transfer-workflow.AC19`'s own text ("the *currently*-relevant assigned stakeholder") reflects and causes this — a literal reading never permits historical, read-only access.
2. The Withdraw button in `RequestDetail.tsx` was gated on `data.status === "Pending: Manager"` alone, with no `readSession()?.role === "Employee"` check — an omission from `stakeholder-panel-ui.T05`, never caught because no existing test rendered the component as a non-Employee role during `Pending: Manager` (the only tests exercising that status render it as the owning Employee). The server-side endpoint (`withdraw/route.ts`) already correctly restricts this to the owning Employee (`employeeId.toString() !== authResult.identity.userId`), so this was a confusing-UX bug, not a security hole.
3. `GET /transfer-requests/mine` (`src/app/api/transfer-requests/mine/route.ts`) has the identical "currently actionable only" design as issue 1's root cause, in a second endpoint — `AC21`–`AC23` were never amended alongside `AC19` when the detail-view carve-out was added, since the detail view (`API02`) and the list (`API10`) are separate endpoints with separately-stated ACs, and the list's own gap wasn't checked at the time.

## Correct Behaviour (Acceptance Criteria)
1. Given a Manager, HR, Payroll, IT, or Facilities user who has an `AuditLog` entry recording that they personally acted on a specific request (any role/action), when they later request that same request's detail (`API02`), then the system returns it — permanently, regardless of the request's current status — but with no action panel available to them (each panel's own existing status-based gate already prevents this once their stage has passed; unchanged by this hotfix).
2. Given any non-Employee viewer of a request currently `Pending: Manager`, the Withdraw button is not rendered for them — only the owning Employee sees it, matching `stakeholder-panel-ui.AC5`'s own stated scope.
3. Every existing test in `route.test.ts` (internal-transfer-workflow's detail endpoint), `RequestDetail.test.tsx`, `mine/route.test.ts`, and every role-panel test file still passes — this is an additive eligibility carve-out and one added role check on each of two endpoints, not a change to any existing allowed/denied case.
4. Given a Manager, HR, Payroll, IT, or Facilities user who has an `AuditLog` entry recording that they personally acted on a specific request, when they later request `API10` (`GET /transfer-requests/mine`), then that request is included in the results — permanently, regardless of its current status, read-only — so it remains reachable through the same list that was always their only way in.

## Fix Summary
**Backend, detail view** (`src/app/api/transfer-requests/[id]/route.ts`): add one new eligibility clause, `isHistoricalActor`, OR'd into the existing `isEligibleViewer` — true when an `AuditLog` entry exists for this `transferRequestId` with `actorId` equal to the caller's own `userId` (a targeted `AuditLog.exists(...)` check, not a full fetch — the full `actionHistory` fetch used for the response body is unchanged and happens as before). Scoped to the specific person who acted, not their whole role — least-privilege, and precisely what a real audit trail already proves. No change to any existing "can I currently act" condition.

**Frontend** (`src/modules/stakeholder-panel-ui/components/RequestDetail.tsx`): add `readSession()?.role === "Employee"` to the Withdraw button's existing `data.status === "Pending: Manager"` condition.

**Backend, list view** (`src/app/api/transfer-requests/mine/route.ts`): the identical historical-actor pattern, applied to `API10` — a small `auditedRequestIds(userId)` helper (a genuinely warranted extraction, since the same "find every request this specific person has an audit entry for" lookup is now needed by both the Manager, HR, Payroll, IT, and Facilities branches, not duplicated five times) returning the caller's own audited request ids, OR'd via `{ _id: { $in: historicalRequestIds } }` into each of those five branches' existing query. Employee's branch (`AC20`, already unconditional) and Admin's (`AC24`, always 403) are untouched.

**Spec amendments**: `internal-transfer-workflow.spec.md`'s `AC19` amended a third time (detail view, `API02`); `AC21`–`AC23` amended once each (list view, `API10`) — all four dated. **Gate 1 re-confirmed for all four (Test Reviewer, 2026-09-21)** — see `gate-reviews/gate1-review-internal-transfer-workflow.md`'s new re-confirmation section.

Respects `constitution.md`: no new dependency, no datastore/schema change (reads the already-approved `AuditLog` collection via its own already-indexed `transferRequestId` field on both endpoints), no PII exposed beyond what the viewer could already see about their own action, test-first discipline applies to all three changes.

---

## Gate 2 Review

*(Recorded here, in this same file, per this hotfix's own compressed chain — no separate `gate-reviews/` file for a single-incident hotfix.)*

**Diff reviewed:** `src/app/api/transfer-requests/[id]/route.ts` (new `isHistoricalActor` eligibility clause), `src/app/api/transfer-requests/[id]/route.test.ts` (6 new tests), `src/modules/stakeholder-panel-ui/components/RequestDetail.tsx` (Withdraw button role check), `src/modules/stakeholder-panel-ui/components/RequestDetail.test.tsx` (1 new test), `src/app/api/transfer-requests/mine/route.ts` (new `auditedRequestIds` helper, OR'd into 5 of the 6 role branches), `src/app/api/transfer-requests/mine/route.test.ts` (4 new tests). `internal-transfer-workflow.spec.md` amended (`AC19`, third amendment; `AC21`–`AC23`, one amendment each; spec reopened `In QA` → `In Development` for this hotfix only).

**Coverage note (added post-implementation, before Gate 2 sign-off):** the user asked whether the carve-out also holds for a fully `Completed` request, not just the intermediate `Pending:` statuses the original 4 tests covered. Verified first via two temporary, uncommitted tests (run, confirmed 200, then discarded) — the code needed no change, since `isHistoricalActor` never inspects `transferRequest.status` at all. Then added 2 permanent regression tests to the same `describe` block: a Manager who approved can still view a `Completed` request, and the HR user who performed the final mapping (the action that itself sets `Completed`) can also still view it afterward. No Red state applied here — this is test-coverage hardening of already-correct, already-Green behavior, not a new fix; both new tests passed on the first run.

**Scope note (added after that, before Gate 2 sign-off):** the user then reported the completed request they'd just verified was reachable via `API02` was invisible in "My Requests" — root-caused to `API10` never having received the same carve-out, and confirmed that list is `AC2c`'s only navigation path into the detail screen. Fixed as AC4 above (new `route.test.ts` describe block for `mine/route.ts`: 4 new tests, Red confirmed first — 3 failed for the right reason, `toContain` on an empty array; the 4th, a different-actor negative case, correctly already passed since the request was already absent — then Green after implementing `auditedRequestIds`). 649/649 project-wide, `tsc`/`eslint` (project-wide, exit code 0) both clean, `next build` re-confirmed clean.

### AC verification (by ID, against this hotfix's own Correct Behaviour section above)

- **AC1 (historical-actor view carve-out)** — **Pass.** A Manager who already approved can still view the request once it's `Pending: HR`; an HR user who already approved can still view it once it's `Pending: Payroll, IT, Facilities`; a Payroll user who already completed their task can still view it once it's `Pending: Transfer`; a Manager and, separately, the HR user who performed the final mapping can each still view the request once it has reached the terminal `Completed` status — each confirmed via a real `AuditLog` entry matching the caller's own `actorId`. A *different* HR user with no audit entry on that specific request still gets 403, confirming the carve-out is scoped to the specific person, not their whole role. This confirms AC1's "permanently, regardless of current status" wording holds at the terminal status too, not just mid-workflow. No action panel is granted by this — each panel's own status-based gate is unchanged and was not touched by this diff.
- **AC2 (Withdraw button role check)** — **Pass.** A Manager viewing a `Pending: Manager` request (legitimately, via the already-existing "can currently decide" carve-out) no longer sees a Withdraw button; the owning Employee still does, unchanged.
- **AC3 (no regression)** — **Pass.** Full suite 649/649 (610 prior + 39 new/changed across both endpoints and their tests), `tsc`/`eslint` (project-wide, exit code 0) both clean, `next build` confirms no regressions to any route. Every pre-existing test in all four changed test files — including several using non-ObjectId placeholder caller IDs (`"hr-1"`, `"payroll-1"`, etc.) for negative cases — still passes, confirming the `Types.ObjectId.isValid` guards (both on `API02`'s `isHistoricalActor` and `API10`'s `auditedRequestIds`) correctly prevent a cast-error crash on those fixtures rather than silently passing for the wrong reason.
- **AC4 (list-view historical-actor carve-out)** — **Pass.** A Manager who approved, an HR user who performed the final mapping, and a Payroll user who completed their task can each still find their own now-`Completed` request in `GET /transfer-requests/mine`'s results. A *different* HR user with no audit entry on that request does not see it — same person-specific scoping as `AC1`, confirmed by the identical negative-case pattern. This closes the practical gap `AC1`'s fix left open: the request was viewable by direct link, but this is the only screen that actually links to it.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | Both new code comments explain the carve-out's scope and the ObjectId-validity guard's purpose — real, non-obvious reasoning, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N/A) | No new module/collection — reads the already-approved `AuditLog` collection via its own already-indexed `transferRequestId` field. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: the 3 new positive-case backend tests failed 403≠200 against the original code; the new frontend test failed by finding a Withdraw button that shouldn't render. All passed cleanly on the first Green attempt after implementation. |
| `status.md` and spec Status updated same day | Pass | `internal-transfer-workflow.spec.md`'s Status correctly shows `In Development` (reopened) while this hotfix's code isn't yet Merged. |
| Standard PR review (readability, naming, DRY) | Pass | `isHistoricalActor` follows the exact same named-boolean style as every other eligibility clause in this file; the Withdraw fix is a one-line addition to an existing condition, no new structure introduced. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets, credentials, or tokens hardcoded or logged | Pass | No credential handling. |
| All new/changed endpoints have an explicit rate-limit decision | Pass (N/A) | No new endpoint — the existing endpoint's already-decided rate limit is unaffected. |
| New dependencies vetted | Pass (N/A) | None added. |
| Auth boundaries and least-privilege checked, not assumed | Pass | The carve-out is deliberately scoped to the *specific person* who has a real audit entry — not their role, not a time window, not "anyone who was ever eligible." Explicitly read-only: verified no action endpoint's own eligibility was touched by this diff. The Withdraw fix is a *narrowing* (removing an unintended over-exposure), not a widening. |
| Data-at-rest and in-transit handling matches `constitution.md` | Pass | No new datastore; reads only the already-approved, already-indexed `AuditLog` collection. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Outcome

No Blocking findings. All three issues are fixed and verified: the original detail-view carve-out and the incidentally-found Withdraw-button gap (per explicit user confirmation to bundle it), plus the list-view carve-out found afterward when the user reported the fixed request was still undiscoverable — same root cause, same mechanism, folded into this same hotfix per the user's explicit direction.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark this hotfix Merged.

**Gate 1 re-confirmation:** Approved (Test Reviewer, 2026-09-21) — covers all four amendments (`AC19` third amendment, `AC21`–`AC23` one each). See `gate-reviews/gate1-review-internal-transfer-workflow.md`.

**Gate 2 verdict (this hotfix's own code review):** **Verified — Merged (Test Reviewer, 2026-09-21).** No changes requested. All three bundled fixes (detail-view historical-actor carve-out, Withdraw button role check, list-view historical-actor carve-out) are Merged together as this one hotfix.
