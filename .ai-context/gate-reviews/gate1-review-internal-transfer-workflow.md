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
