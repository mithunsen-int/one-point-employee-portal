# Workflow: /generate-test-cases

> **Methodology reference:** sdd-methodology.md **#19.1** ("A single master test_cases.md was workable for a handful of features; past roughly a dozen active specs, it becomes an unreviewable monolith... split it" — per-feature `test_cases/<feature-slug>.test_cases.md`, largely a QA-expanded version of the spec's own Unit Test Cases table, same IDs, more scenario coverage), **#19.2** (standing rules: "test cases derive from acceptance criteria, not from reading finished code"; "generated tests are a starting point QA validates, not a substitute for QA judgement").

**Purpose:** Expands a spec's Unit Test Cases table into the QA-owned `.ai-context/test_cases/<feature-slug>.test_cases.md` file: data variations, negative paths, boundary cases, and role-matrix sweeps the spec's own AC didn't spell out. This is a separate workflow from `/generate-tests` — different purpose, different output. This workflow produces documentation rows for QA to validate; `/generate-tests` writes executable test code. Do not conflate them.

**Usage:** `/generate-test-cases <feature-slug>` — or, since this project does not use slash commands, via its prompt file: `@generate-test-cases.md for <feature-slug>`.

## Preconditions

1. `.ai-context/specs/<feature-slug>.spec.md` does not exist, or its Unit Test Cases table is empty — stop; there is nothing to expand. (A feature with no API/AC-testable surface legitimately has no table to expand; that is not an error, just nothing for this workflow to do.)
2. This workflow is being invoked to produce executable test code — stop and redirect to `/generate-tests` instead; this workflow never writes code.

## Steps

1. Read every Acceptance Criterion and its corresponding Unit Test Cases row from the spec, not from reading any existing implementation — expansion derives from acceptance criteria only, per **#19.2**.
2. For each AC, expand coverage:
   - Data-volume / data-shape variations
   - Negative and invalid-input paths the AC didn't spell out
   - Boundary cases (exact threshold values, off-by-one conditions)
   - Role-matrix sweeps — does this behavior differ per role named in the spec or constitution.md?
3. Assign each expanded scenario a row keyed to its originating AC ID — never a disconnected, orphaned ID scheme.
4. Where the correct expected behavior for an expanded scenario is genuinely ambiguous — the spec doesn't say, and a reasonable engineer could defend two different correct answers — do not guess. Record it under a distinct "Open QA Questions" section, phrased as a specific, answerable question, and note explicitly that it routes back toward a spec amendment, not a QA-invented default.
5. Confirm every row traces to a real AC ID present in the spec.

## Output

`.ai-context/test_cases/<feature-slug>.test_cases.md`:
```
# Test Cases: <feature-name>
## Derived From
.ai-context/specs/<feature-slug>.spec.md

## QA-Expanded Test Cases
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|

## Open QA Questions
<one row per genuinely ambiguous scenario, or "None identified" — the section header is always present so its emptiness is visibly deliberate>
```

## Do not

1. Do not write executable test code — that is `/generate-tests`'s responsibility.
2. Do not guess an expected result for a genuinely ambiguous scenario — record it as an Open QA Question instead.
3. Do not derive expanded scenarios by reading an existing implementation instead of the spec's acceptance criteria.
4. Do not duplicate the spec's own Unit Test Cases table verbatim without adding genuinely expanded coverage.
5. Do not invent a scenario disconnected from any AC in the spec.
