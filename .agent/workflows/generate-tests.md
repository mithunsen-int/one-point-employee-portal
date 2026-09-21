# Workflow: /generate-tests

> **Methodology reference:** sdd-methodology.md **#5** (Principle 3 — test-first: "no implementation code before the corresponding tests exist, are reviewed, and are confirmed to fail"), **#28** (Anti-Patterns — "Retrofitting tests after implementation... Inverts the Red-phase check that catches wrong-behaviour-by-design"), **#19.1** (spec's own Unit Test Cases are the acceptance-level minimum; the QA-expanded set lives in test_cases/), **#18** ("Agents nail the happy path; error handling, null/undefined edge cases, and partial-failure states need explicit acceptance criteria or they get skipped"). Frameworks per `.ai-context/constitution.md`'s Testing Discipline and `.agent/rules/int-standards.nextjs.md` **#12** (Jest + React Testing Library).

**Purpose:** Writes the actual failing (Red) test code for one named task, strictly before any implementation exists for it. Confirms and records that each new test fails for the expected reason before this workflow stops.

**Usage:** `/generate-tests <feature-slug>.T0<n>` — or, since this project does not use slash commands, via its prompt file: `@generate-tests.md for <feature-slug>.T0<n>`.

## Preconditions

1. Implementation code for `<feature-slug>.T0<n>`'s scope already exists — stop; do not generate tests to retrofit against it (**#28**). Report which files appear to already implement the task's behavior.
2. `<feature-slug>.T0<n>` is not found in `.ai-context/tasks/<feature-slug>.tasks.md`, or has no "Acceptance: `<AC IDs>`" line — stop.
3. Any task `<feature-slug>.T0<n>` depends on (per its tasks.md entry) is not yet `Merged` — stop and name the blocking task.

## Steps

1. Resolve `<feature-slug>.T0<n>`'s linked `<AC IDs>` from its tasks.md entry.
2. Pull the corresponding rows from the spec's own Unit Test Cases table (`.ai-context/specs/<feature-slug>.spec.md`) — the acceptance-level minimum.
3. Pull the corresponding QA-expanded rows for the same `<AC IDs>` from `.ai-context/test_cases/<feature-slug>.test_cases.md`. If that file, or rows for this AC, don't exist yet, report the gap explicitly — do not fabricate QA-level scenarios in their place; that is `/generate-test-cases`'s responsibility, not this workflow's.
4. Per **#18**, explicitly check whether boundary and failure-path scenarios (null/undefined input, partial failure, permission-denied) are backed by an AC or a QA-expanded row. If a boundary/failure case has no such backing, flag it rather than silently writing a test for behavior nothing actually specifies.
5. Write test code covering every pulled scenario, using Jest (+ React Testing Library for frontend) per constitution.md's Testing Discipline and int-standards.nextjs.md **#12** — including, where relevant, a check that a Mongoose schema validator or `$jsonSchema` rule is actually enforced, not just that the endpoint responds.
6. Run the generated tests. Confirm each one fails, and confirm the failure reason is genuinely "the behavior doesn't exist yet" — not a setup error, missing import, or misconfigured mock.
7. Record the Red confirmation per test, with the observed failure reason.
8. Stop here. Do not write implementation code — that is a separate, later step outside this workflow's scope.

## Output

- Generated test files, colocated or placed per the project structure conventions in int-standards.nextjs.md.
- A Red-confirmation report: test name → linked scenario (spec UT ID or test_cases.md row) → failure reason observed.
- A list of any boundary/failure-path gap found in step 4, and any spec/test_cases.md coverage gap found in step 3.

## Do not

1. Do not write or generate implementation code in this workflow, under any circumstance.
2. Do not proceed if implementation for `<feature-slug>.T0<n>`'s scope already exists.
3. Do not invent test scenarios beyond what the spec's Unit Test Cases table and test_cases/<feature-slug>.test_cases.md actually state.
4. Do not mark a test Red without actually executing it and recording the observed failure reason.
