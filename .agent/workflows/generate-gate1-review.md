# Workflow: /generate-gate1-review

> **Methodology reference:** sdd-methodology.md **#12** (Gate 1 Spec Peer Review — the checklist, turnaround, and outcomes), **#12.1** ("Named reviewer, never the author"), **#12.3** (Approved / Changes Requested outcomes — a revision bumps the Draft minor version, e.g. `Draft v1.1`, and re-enters the Checklist Walkthrough), **#21.1** (spec lifecycle states), **#5** (Principle 1 — "no implementation task runs without an approved spec... approved by a named peer reviewer who isn't the author").

**Purpose:** Records an already-completed Gate 1 reviewer's verdict and findings into `.ai-context/specs/<feature-slug>.spec.md`'s Status field, a running evidence file under `.ai-context/gate-reviews/`, and `.ai-context/status.md` — following the fixed structure in this file's Steps below. This workflow never performs the review itself and never decides the verdict; it only transcribes a verdict a named human reviewer, who is not the spec's author, has already reached.

**Usage:** `/generate-gate1-review <feature-slug>` — or, since this project does not use slash commands, via its prompt file: `@generate-gate1-review.md for <feature-slug>`.

## Preconditions

1. `.ai-context/specs/<feature-slug>.spec.md` does not exist — stop.
2. The reviewer's name, and a pass/fail determination for all 10 checklist items (with evidence, reasoning, and required fix for any failing item) have not been supplied by the invoker — stop and ask for them. This workflow does not perform the review or generate findings itself.
3. The named reviewer is the same person as the spec's author (the accountable human who drove/commissioned the spec — never this agent) — stop and refuse; ask for a genuinely independent reviewer (#12.1).
4. Fewer than all 10 checklist items have a resolved pass/fail determination — stop; a verdict cannot be recorded on a partial walkthrough ("All 10 must be checked before a verdict is recorded").

## Steps

1. Read `.ai-context/specs/<feature-slug>.spec.md`'s current Status field, to record as "Status at time of review."
2. Check whether `.ai-context/gate-reviews/gate1-review-<feature-slug>.md` already exists. If so, this is a subsequent round (a resubmission after `Changes Requested`) — the new round is appended as a `## Round N — <date>` section below the existing file's content; the prior round's content is never removed or overwritten. If not, this is Round 1 — no heading is needed for a single-round file.
3. Transcribe the reviewer-supplied verdict into this fixed structure:

   ```
   # Gate 1 Review — <feature-slug>

   **Reviewer:** <name>
   **Date:** <YYYY-MM-DD>
   **Spec reviewed:** .ai-context/specs/<feature-slug>.spec.md (Status at time of review: <Draft vX.X | Changes Requested>)

   ## Checklist Walkthrough
   - [x/ ] 1. Reviewer ≠ author
   - [x/ ] 2. Intent is one unambiguous paragraph
   - [x/ ] 3. Every AC is given/when/then and individually IDed
   - [x/ ] 4. API Contract complete (payload, success shape, exception table), if applicable
   - [x/ ] 5. Out-of-scope items explicit
   - [x/ ] 6. Plan checked line-by-line against constitution.md, if a plan is attached
   - [x/ ] 7. Related/Builds-on specs are actually in Approved/Released state
   - [x/ ] 8. No overlap with an existing spec
   - [x/ ] 9. Security/Architecture sign-off obtained where constitution requires it
   - [x/ ] 10. Status decision made — Approved or Changes Requested (never left ambiguous)

   ## Findings
   <one block per item that did NOT pass; "(none — all 10 items passed)" if none>

   ## Outcome
   **Verdict:** <Approved | Changes Requested>

   ## If Changes Requested — revision tracking
   <bump instructions if Changes Requested; "N/A — Approved, no revision required." if Approved>

   ## Final Outcome
   <Approved — plan drafting may begin | Changes Requested — spec must be revised and resubmitted>
   ```

   All 10 checklist boxes are checked exactly as supplied by the reviewer.

4. For every item marked failing, add one `### Item <#> — <short title>` block under Findings with **Verdict:** Fail, **Evidence:** (the specific quote/reference from the spec), **Reasoning:**, and **Required Fix:** — exactly as supplied by the reviewer, never invented or embellished. Items that passed get no entry.
5. Record the Outcome verdict (`Approved` or `Changes Requested`) exactly as the reviewer stated it — never inferred from the checklist by this workflow's own judgment.
6. If `Changes Requested`: leave the spec's Status field at its current Draft version. Fill "If Changes Requested — revision tracking" noting the author must bump to the next minor version (e.g. `Draft v1.1`) upon revision and resubmit for another Checklist Walkthrough (#12.3).
7. If `Approved`: set the spec's Status field to `Approved`.
8. Write (or append, per Step 2) the completed round to `.ai-context/gate-reviews/gate1-review-<feature-slug>.md`.
9. Update `.ai-context/status.md`: the Active Specs row (Status column matching the outcome; Notes referencing the reviewer, date, and this evidence file) and a Daily Execution Log entry.
10. Close with the Final Outcome line exactly as the fixed structure specifies: `Approved — plan drafting may begin` or `Changes Requested — spec must be revised and resubmitted`.

## Output

- `.ai-context/gate-reviews/gate1-review-<feature-slug>.md`, fully populated per Step 3's structure (one running file per feature for this gate — a resubmission appends a new round, never a new file).
- The spec's Status field updated to `Approved`, or left at its Draft version with revision tracking noted, matching the recorded verdict.
- `.ai-context/status.md` updated to match.

## Do not

1. Do not perform the review or generate checklist findings/verdicts yourself — only transcribe what a named human reviewer has actually supplied.
2. Do not proceed if the named reviewer is the spec's author.
3. Do not record a verdict on a partial (fewer than 10 items resolved) checklist.
4. Do not set Status to `Approved` on a `Changes Requested` verdict, or vice versa.
5. Do not overwrite a prior round's findings in `gate1-review-<feature-slug>.md` — append a new dated round instead.
