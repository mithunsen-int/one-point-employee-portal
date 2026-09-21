# Gate 1 Review — internal-transfer-workflow

**Reviewer:** Test Reviewer
**Date:** 2026-09-10
**Spec reviewed:** .ai-context/specs/internal-transfer-workflow.spec.md (Status at time of review: Draft v1.0)

## Checklist Walkthrough

- [x] 1. Reviewer ≠ author
- [x] 2. Intent is one unambiguous paragraph
- [x] 3. Every AC is given/when/then and individually IDed
- [x] 4. API Contract complete (payload, success shape, exception table), if applicable
- [x] 5. Out-of-scope items explicit
- [x] 6. Plan checked line-by-line against constitution.md, if a plan is attached
- [x] 7. Related/Builds-on specs are actually in Approved/Released state
- [x] 8. No overlap with an existing spec
- [x] 9. Security/Architecture sign-off obtained where constitution requires it
- [x] 10. Status decision made — Approved or Changes Requested (never left ambiguous)

## Findings

(none — all 10 items passed)

## Outcome

**Verdict:** Approved

## If Changes Requested — revision tracking

N/A — Approved, no revision required.

## Final Outcome

Approved — plan drafting may begin.

---

## Re-confirmation — AC19 amendment (2026-09-20)

**Reviewer:** Test Reviewer
**Date:** 2026-09-20
**Change reviewed:** `internal-transfer-workflow.spec.md`'s `AC19` (and `UT19`/new `UT19a`), amended same day — not a full spec re-review, scoped to this one AC change only.

**Origin:** discovered while building `stakeholder-panel-ui.T06` that `AC19`'s original wording ("given any other non-Admin role, the system rejects with 403") blocked even the legitimately assigned Manager from viewing the one request they're assigned to decide on, since it drew no distinction between an unrelated Manager (the scenario `UT19` actually illustrates) and the assigned one. Amended `AC19` to carve out "the currently-relevant assigned stakeholder for that specific request," reusing `AC21`–`AC23`'s already-approved per-role eligibility rule rather than inventing a new one, and preserving `AC24`'s "no Admin carve-out" precedent. Implemented as `internal-transfer-workflow.T11` (Manager only, for now; HR/Payroll/IT/Facilities deferred to `T07`–`T10`'s own equivalent need), Green with Gate 2 drafted in `gate2-evidence-internal-transfer-workflow.md`, itself still awaiting a Gate 2 verdict.

### Checklist Walkthrough (scoped to the amendment)

- [x] 1. Reviewer ≠ author
- [x] 2. The amended AC text is still one unambiguous given/when/then, individually IDed
- [x] 3. The carve-out reuses an already-Approved rule (`AC21`–`AC23`) rather than introducing new, unreviewed logic
- [x] 4. `UT19` correctly repointed to the scenario it actually tests (an unrelated Manager); `UT19a` added for the new carve-out case
- [x] 5. No unrelated AC or scope was touched under cover of this change
- [x] 6. Status decision made — Approved

### Findings

(none — the amendment is a narrow, well-reasoned reuse of already-approved logic, not a new policy)

### Outcome

**Verdict:** Approved (Test Reviewer, 2026-09-20). `AC19`'s amended wording stands as the spec's contract. `internal-transfer-workflow.T11`'s own Gate 2 verdict (code review) remains separately required before Merge — this re-confirmation covers the spec-content change only, not the implementation.

---

## Re-confirmation — AC13/AC14/AC18/AC22 amendments and new AC25 (2026-09-20)

**Reviewer:** Test Reviewer
**Date:** 2026-09-20
**Change reviewed:** `internal-transfer-workflow.spec.md`'s `AC13`, `AC14`, `AC18`, `AC22` (amended) and new `AC25` — the largest single amendment batch this spec has had, scoped to this one change (the new `Pending: Transfer` status), not a full spec re-review.

**Origin:** directed by the reviewer directly, during `stakeholder-panel-ui.T11`'s Gate 2 review — `API02`'s response had no field indicating individual task-completion progress, so the frontend's HR Final Mapping panel could only infer "all 3 tasks done" indirectly via `internal-transfer-workflow.T12`'s carve-out. The reviewer directed introducing a new, directly observable status instead. Implemented as `internal-transfer-workflow.T13`: `AC25` (new) defines the automatic transition once all 3 parallel tasks complete; `AC13`/`AC14` (amended) gate `hr-final-mapping` on the new status instead of the 3 task fields directly; `AC18` (amended) extends the status-display rule to cover it; `AC22` (amended) simplifies HR's `API10` eligibility to the new status directly. `T13` itself Green with Gate 2 drafted in `gate2-evidence-internal-transfer-workflow.md`, itself still awaiting a Gate 2 verdict at the time of this re-confirmation.

### Checklist Walkthrough (scoped to the amendment)

- [x] 1. Reviewer ≠ author (the reviewer directed the change; the agent drafted the spec text and implementation)
- [x] 2. Each amended/new AC is still one unambiguous given/when/then, individually IDed
- [x] 3. `AC25`'s transition rule is unambiguous and testable (regardless of completion order); `AC13`/`AC14`/`AC22`'s simplifications are logically equivalent restatements under the new invariant, not silent behavior changes
- [x] 4. `UT13`/`UT14`/`UT22` correctly reworded to the new status; new `UT25` added
- [x] 5. No unrelated AC or scope touched under cover of this change — `AC19`'s Manager carve-out, `AC20`/`AC21`/`AC23`/`AC24` all confirmed untouched
- [x] 6. Status decision made — Approved

### Findings

(none — the new status closes a real, previously-flagged gap, and the amended ACs are simplifications enabled by it, not new policy)

### Outcome

**Verdict:** Approved (Test Reviewer, 2026-09-20). `AC13`/`AC14`/`AC18`/`AC22`'s amended wording and the new `AC25` stand as the spec's contract. `internal-transfer-workflow.T13`'s own Gate 2 verdict (code review) remains separately required before Merge — this re-confirmation covers the spec-content change only, not the implementation.

---

## Re-confirmation — AC19 (third amendment), AC21/AC22/AC23 (one amendment each), via HOTFIX-2026-0921-stakeholder-lost-view-after-action (2026-09-21)

**Reviewer:** Test Reviewer
**Date:** 2026-09-21
**Change reviewed:** `internal-transfer-workflow.spec.md`'s `AC19` (third amendment) and `AC21`–`AC23` (one amendment each), all part of the same hotfix — scoped to these four AC changes only, not a full spec re-review.

**Origin:** two rounds of real usage found via `HOTFIX-2026-0921-stakeholder-lost-view-after-action`. First, a stakeholder (Manager/HR/Payroll/IT/Facilities) permanently lost the ability to even view a request the moment they acted on it — `AC19`'s "currently-relevant assigned stakeholder" wording never covered a stakeholder who already acted, only one who hasn't yet. Amended `AC19` a third time to add a historical-actor carve-out: any such user with a real `AuditLog` entry recording their own prior action on that specific request may still view it, permanently, regardless of current status, read-only. Second, after that fix shipped, the user reported the same `Completed` request had become undiscoverable in HR's "My Requests" list — root-caused to `GET /transfer-requests/mine` (`API10`, governed by `AC21`–`AC23`) never having received the same carve-out, and confirmed that list is `AC2c`'s only navigation path into the detail screen the first fix touched. Amended `AC21` (Manager), `AC22` (HR), and `AC23` (Payroll/IT/Facilities) to each add the identical historical-actor carve-out `AC19` already defines, rather than inventing a new rule. Implemented directly in this same hotfix: `isHistoricalActor` in `[id]/route.ts` (`API02`) and `auditedRequestIds()` in `mine/route.ts` (`API10`), both scoped to the specific person via the audit trail, not their whole role. Both Green — 649/649 project-wide, `tsc`/`eslint`/`next build` all clean — with the hotfix's own Gate 2 evidence drafted in its own spec file (`.ai-context/hotfixes/hotfix-2026-0921-stakeholder-lost-view-after-action.spec.md`), itself still awaiting a Gate 2 verdict at the time of this re-confirmation.

### Checklist Walkthrough (scoped to the amendments)

- [x] 1. Reviewer ≠ author
- [x] 2. Each amended AC is still one unambiguous given/when/then, individually IDed
- [x] 3. `AC21`–`AC23`'s carve-outs reuse the identical rule `AC19` already defines, rather than introducing new, unreviewed logic; `AC19` itself is amended consistently with its own prior two amendments
- [x] 4. `UT21a`/`UT22a`/`UT23a` added to the spec's test table for the list-view carve-out; `AC19`'s own historical-actor test cases already existed from its prior amendment
- [x] 5. No unrelated AC or scope was touched under cover of this change — `AC20` (Employee, already unconditional) and `AC24` (Admin, always 403) confirmed untouched
- [x] 6. Status decision made — Approved

### Findings

(none — both amendments are a narrow, consistent extension of an already-approved rule to a second endpoint with the identical need, not a new policy)

### Outcome

**Verdict:** Approved (Test Reviewer, 2026-09-21). `AC19`'s third amendment and `AC21`–`AC23`'s amended wording stand as the spec's contract. The hotfix's own Gate 2 verdict (code review, covering all three of its bundled fixes) remains separately required before it can be marked Merged — this re-confirmation covers the spec-content changes only, not the implementation.
