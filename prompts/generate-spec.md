**Invocation:** Reference this file directly and state the value after "for" as the argument — e.g. `@generate-spec.md for BRD-007`. If no value follows "for," stop and ask the user for the BRD entry ID rather than guessing.

**Argument:** `<BRD-#>` — the source BRD entry's own ID (e.g., `BRD-007`), not a feature-slug. The workflow locates the entry directly by this ID and determines the resulting spec's feature-slug itself.

**What to do:** Read `.agent/workflows/generate-spec.md` in full, then execute it exactly as written — its Preconditions, then its Steps in order, then its Output — honoring every item under "Do not" without exception. Do not paraphrase or skip a step.

**Single source of truth:** `.agent/workflows/generate-spec.md` governs this workflow's behavior. This prompt file must never duplicate, restate, or reconstruct those instructions from memory — always re-read the workflow file itself before executing, so the two cannot drift apart.
