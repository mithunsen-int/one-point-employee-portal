**Invocation:** Reference this file directly and state the value after "for" as the argument — e.g. `@code-review.md for <feature-slug>.T0<n>`. If no value follows "for," stop and ask the user for the task ID rather than guessing.

**Argument:** `<feature-slug>.T0<n>` — a single task ID with an existing diff and a stated Acceptance IDs line. This workflow drafts the Gate 2 + Security review; it never marks a task Merged — only a named human reviewer can do that.

**What to do:** Read `.agent/workflows/code-review.md` in full, then execute it exactly as written — its Preconditions, then its Steps in order, then its Output — honoring every item under "Do not" without exception. Do not paraphrase or skip a step.

**Single source of truth:** `.agent/workflows/code-review.md` governs this workflow's behavior. This prompt file must never duplicate, restate, or reconstruct those instructions from memory — always re-read the workflow file itself before executing, so the two cannot drift apart.
