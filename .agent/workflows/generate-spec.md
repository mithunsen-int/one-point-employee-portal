# Workflow: /generate-spec

> **Methodology reference:** sdd-methodology.md **#7** (Discovery & Consulting — "a spec should never be the first place a requirement is written down"), **#9** (Naming & Identifiers), **#11** (Specification Standards, including **#11.4**'s template and **#11.3**'s conditional API Contract rule), **#12** (Gate 1 is a human review this workflow cannot complete), **#19.1** (spec-level Unit Test Cases are the acceptance-level minimum; broader QA scenarios live in test_cases/, generated separately).

**Purpose:** Drafts `.ai-context/specs/<feature-slug>.spec.md` from a `.ai-context/BRD.md` entry identified directly by its own ID, following the **#11.4** template exactly. Produces a Draft for human Gate 1 review — it never grants that review itself.

**Usage:** `/generate-spec <BRD-#>` — or, since this project does not use slash commands, via its prompt file: `@generate-spec.md for <BRD-#>`.

## Preconditions

1. No entry headed `BRD-<NNN>` matching the given ID exists in `.ai-context/BRD.md` — stop and ask the user to check the ID or author the entry first (**#7**).
2. The located BRD entry, or the matching section of `.ai-context/discovery-analysis.md`, contains an unresolved open item or an explicitly-labeled placeholder assumption that would need to be guessed to draft an acceptance criterion — stop and list each one rather than guessing.
3. The resulting feature-slug (see Step 4) collides with an existing spec for a materially different feature, or violates **#9**'s slug rules (3–5 words, kebab-case, verb-free, unique for the project's life) — stop and report the conflict.
4. `.ai-context/constitution.md` cannot be read — the Non-Functional Constraints section cannot be drafted responsibly without it.

## Steps

1. Locate the entry headed `### BRD-<NNN>: ...` in `.ai-context/BRD.md` matching the given ID. If not found, stop per Precondition 1.
2. Read the located BRD entry in full.
3. Read the matching section of `.ai-context/discovery-analysis.md` for the full discovery record — this spec's Intent and acceptance criteria must not contradict it.
4. Determine the feature-slug: check whether this BRD entry already has an associated slug elsewhere in the project (an existing spec whose "Linked BRD" cites this ID, or a row in `.ai-context/status.md`'s Active Specs table naming this BRD ID) and reuse it exactly. If none exists, derive a fresh slug from the entry's title per **#9**'s rules (3–5 words, kebab-case, verb-free, unique for the project's life).
5. Draft **Intent**: one unambiguous paragraph — what changes, for whom, under what condition. No adjective standing in for a testable condition ("secure," "robust," "fast").
6. Draft **Context**: reference `.ai-context/architecture.md` and any related spec by path — do not paste their content (**#11.2**).
7. If the feature exposes or consumes an API, draft **API Contract** (**#11.3**) — request/response payload shapes, success status code, and an exception table that is exhaustive, not just the happy path plus one error. If the feature has no API surface, omit this section entirely.
8. Draft **Acceptance Criteria**, individually IDed `<feature-slug>.AC1`, `<feature-slug>.AC2`, … — each a given/when/then statement two competent engineers could not build materially differently from.
9. Draft the **Unit Test Cases** table, each row mapped to an AC ID via `<feature-slug>.UT0#`. This table is the acceptance-level minimum only — do not expand it with data-volume variations, negative-path sweeps, or role-matrix coverage; that expansion belongs in `.ai-context/test_cases/<feature-slug>.test_cases.md`, produced by the separate `/generate-test-cases` workflow, not duplicated here.
10. Draft **Explicitly Out of Scope** — name what this feature will specifically be tempted to also fix.
11. Draft **Non-Functional Constraints**, sourced only from `.ai-context/constitution.md`. Where the constitution states a constraint is not yet set, the spec must say the same — do not silently invent a number the constitution itself declines to state.
12. Set **Status** to `Draft v1.0`. Never Approved, never any Gate-1-passed state.
13. Write the file to `.ai-context/specs/<feature-slug>.spec.md`.

## Output

- `.ai-context/specs/<feature-slug>.spec.md`, fully populated per **#11.4**'s template, Status `Draft v1.0`.
- A short self-check summary: the feature-slug used (reused or freshly derived) and which sections are fully populated vs. which carry an explicit "not yet set" / "deferred" note — not a Gate 1 verdict, since only a named human reviewer can issue one (**#12.1**).

## Do not

1. Do not set Status to anything beyond `Draft v1.0`.
2. Do not invent acceptance criteria, payload shapes, or NFR numbers not grounded in `BRD.md`, `discovery-analysis.md`, or `constitution.md`.
3. Do not expand the spec's Unit Test Cases table into QA-level scenario coverage — that is `/generate-test-cases`'s job.
4. Do not draft a plan or generate tasks as a side effect — those require an Approved spec (**#13**).
5. Do not silently resolve an open item found in `discovery-analysis.md` or `BRD.md` — report it and stop.
