# Workflow: /generate-tasks

> **Methodology reference:** sdd-methodology.md **#10** (Step 3 — tasks generated from the plan's Sequencing section, one per step), **#9** (stable ID scheme: `<feature-slug>.T0#`), **#16** (Prompt Engineering — "prompt by identity, not by description"; "one task, one prompt"; "state the acceptance criteria ID the agent should self-check against").

**Purpose:** Generates `.ai-context/tasks/<feature-slug>.tasks.md` from a plan's Sequencing section, and — for each task — a standalone, identity-scoped prompt file under `prompts/<feature-slug>.T0#.prompt.md`. Tasks are generated from the plan, never hand-written from memory; prompts reference IDs, never re-describe the feature.

**Usage:** `/generate-tasks <feature-slug>` — or, since this project does not use slash commands, via its prompt file: `@generate-tasks.md for <feature-slug>`.

## Preconditions

1. `.ai-context/plans/<feature-slug>.plan.md` does not exist — stop.
2. The plan's own Constitution Check lists any unaddressed gap (an item not ticked, or ticked without justification) — stop and report it; do not generate tasks against a plan that hasn't cleared its own review.
3. The plan's Sequencing section is empty or missing — stop; there is nothing to decompose.

## Steps

1. Read the plan's Sequencing section, in order.
2. For each sequencing step, generate one task with ID `<feature-slug>.T0#` (sequential, zero-padded). If a step bundles more than one independently-verifiable unit of work, split it into separate tasks rather than preserving the bundle.
3. For each task, write an explicit "Acceptance: `<AC IDs>`" line, pulling real AC IDs from `.ai-context/specs/<feature-slug>.spec.md` — never invent a placeholder AC number.
4. Confirm every AC in the spec is covered by at least one task. Report any uncovered AC as a Coverage Gap rather than silently leaving it untested.
5. For each task, generate a standalone prompt file at `prompts/<feature-slug>.T0#.prompt.md`. Each prompt file must, per **#16**:
   - Reference the task by ID only — e.g., "Implement `<feature-slug>.T03`" — never re-describe the feature from memory.
   - State exactly which `<AC IDs>`, and API Contract ID(s) if applicable, this task must satisfy.
   - Explicitly state what not to touch: sibling tasks already Merged, and any file or module outside this task's declared scope.
   - Contain instructions for that task only — one task, one prompt file. Never batch multiple tasks' instructions into a single prompt.
6. Set every generated task's initial state to `Not Started`.

## Output

- `.ai-context/tasks/<feature-slug>.tasks.md` — per **#29**'s tasks skeleton: `- [ ] <feature-slug>.T0# — <description> — Acceptance: <AC IDs>`.
- One `prompts/<feature-slug>.T0#.prompt.md` file per task.
- A Coverage Gaps section (may be empty, but must be present) listing any spec AC with no corresponding task.

## Do not

1. Do not generate tasks from a plan carrying an unresolved Constitution Check gap.
2. Do not batch multiple tasks into a single prompt file.
3. Do not let a prompt file re-describe the feature from memory instead of citing stable IDs.
4. Do not invent an AC ID that doesn't exist in the spec.
5. Do not write implementation code or tests as a side effect of this workflow.
