**Invocation:** Reference this file directly and state the value after "for" as the argument — e.g. `@generate-test-cases.md for <feature-slug>`. If no value follows "for," stop and ask the user for the feature slug rather than guessing.

**Argument:** `<feature-slug>` — must identify a spec whose Unit Test Cases table is populated. This is a separate workflow from `generate-tests.md`: it expands the spec's Unit Test Cases table into QA-owned documentation rows, it never writes executable test code — do not conflate the two.

**What to do:** Read `.agent/workflows/generate-test-cases.md` in full, then execute it exactly as written — its Preconditions, then its Steps in order, then its Output — honoring every item under "Do not" without exception. Do not paraphrase or skip a step.

**Single source of truth:** `.agent/workflows/generate-test-cases.md` governs this workflow's behavior. This prompt file must never duplicate, restate, or reconstruct those instructions from memory — always re-read the workflow file itself before executing, so the two cannot drift apart.
