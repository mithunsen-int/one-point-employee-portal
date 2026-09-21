**Invocation:** Reference this file directly and state the value after "for" as the argument — e.g. `@generate-gate1-review.md for <feature-slug>`. If no value follows "for," stop and ask the user for the feature slug rather than guessing.

**Argument:** `<feature-slug>` — must identify an existing `.ai-context/specs/<feature-slug>.spec.md`. This workflow also requires the reviewer's name and their actual pass/fail determination on all 10 checklist items to already be supplied — it does not perform the review itself, and refuses if the named reviewer is the spec's own author.

**What to do:** Read `.agent/workflows/generate-gate1-review.md` in full, then execute it exactly as written — its Preconditions, then its Steps in order, then its Output — honoring every item under "Do not" without exception. Do not paraphrase or skip a step.

**Single source of truth:** `.agent/workflows/generate-gate1-review.md` governs this workflow's behavior. This prompt file must never duplicate, restate, or reconstruct those instructions from memory — always re-read the workflow file itself before executing, so the two cannot drift apart.
