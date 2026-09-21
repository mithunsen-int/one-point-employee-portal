**Invocation:** Reference this file directly and state the value after "for" as the argument — e.g. `@generate-tasks.md for <feature-slug>`. If no value follows "for," stop and ask the user for the feature slug rather than guessing.

**Argument:** `<feature-slug>` — must identify an existing `.ai-context/plans/<feature-slug>.plan.md` with a populated Sequencing section and a Constitution Check carrying no unaddressed gap; the workflow itself checks this and refuses otherwise.

**What to do:** Read `.agent/workflows/generate-tasks.md` in full, then execute it exactly as written — its Preconditions, then its Steps in order, then its Output — honoring every item under "Do not" without exception. Do not paraphrase or skip a step.

**Single source of truth:** `.agent/workflows/generate-tasks.md` governs this workflow's behavior. This prompt file must never duplicate, restate, or reconstruct those instructions from memory — always re-read the workflow file itself before executing, so the two cannot drift apart.
