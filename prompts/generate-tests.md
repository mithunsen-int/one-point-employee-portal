**Invocation:** Reference this file directly and state the value after "for" as the argument — e.g. `@generate-tests.md for <feature-slug>.T0<n>`. If no value follows "for," stop and ask the user for the task ID rather than guessing.

**Argument:** `<feature-slug>.T0<n>` — a single task ID, not a whole feature. The workflow refuses if implementation code for that task's scope already exists (test-first, never retrofitted) or if the task has no stated Acceptance IDs.

**What to do:** Read `.agent/workflows/generate-tests.md` in full, then execute it exactly as written — its Preconditions, then its Steps in order, then its Output — honoring every item under "Do not" without exception. Do not paraphrase or skip a step.

**Single source of truth:** `.agent/workflows/generate-tests.md` governs this workflow's behavior. This prompt file must never duplicate, restate, or reconstruct those instructions from memory — always re-read the workflow file itself before executing, so the two cannot drift apart.
