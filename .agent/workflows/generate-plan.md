# Workflow: /generate-plan

> **Methodology reference:** sdd-methodology.md **#10** (Step 2 — the plan, derived from an Approved spec), **#13** (Architecture Standards — "every plan is checked against constitution.md before task generation... a plan that violates a non-negotiable is a Gate 1 rejection, not a Gate 2 comment"; "no plan skips straight from spec to code"), **#8** ("a plan that's silent on a constitution rule isn't neutral — it's a gap"), **#9** (ADR global-ID rule). Grounded against this project's `.ai-context/constitution.md` (MongoDB via Mongoose as sole datastore; no messaging infrastructure; Next.js/Zustand/TanStack Query frontend stack) and `.agent/rules/int-standards.nextjs.md` (Database Layer).

**Purpose:** Drafts `.ai-context/plans/<feature-slug>.plan.md` from an Approved spec only — the technical approach later decomposed into tasks. Every constitution rule is checked line-by-line with justification, never assumed compliant by omission.

**Usage:** `/generate-plan <feature-slug>` — or, since this project does not use slash commands, via its prompt file: `@generate-plan.md for <feature-slug>`.

## Preconditions

1. `.ai-context/specs/<feature-slug>.spec.md` does not exist — stop.
2. The spec's Status field is not exactly `Approved` (or a later state, e.g. already `Plan Drafted` if this is a revision) — stop and report the actual Status; per **#13**, no plan skips straight from spec to code.
3. Any spec named in this spec's "Builds on" / "Related" context is not itself Approved or Released — stop and name the blocking dependency (**#12.2** Dependency check).
4. `.ai-context/constitution.md` cannot be read — stop; the Constitution Check cannot be performed without it.

## Steps

1. Read the Approved spec in full.
2. Read `.ai-context/constitution.md` in full.
3. Read `.agent/rules/int-standards.nextjs.md` (or whichever stack-standards file actually exists under `.agent/rules/` for this project) for stack-level conventions — the Architecture Approach must be consistent with these, not propose a different pattern.
4. Draft **Architecture Approach** — name the actual components touched, referencing the module names already defined in `.ai-context/architecture.md` (do not invent new module names). State explicitly whether each is new or existing.
5. Draft **Data Model** — Mongoose schema-level changes only (collections, subdocuments, validators, indexes), since MongoDB via Mongoose is the sole approved datastore. Any data-integrity rule that would be a relational check-constraint must be stated as a Mongoose schema validator or `$jsonSchema` rule, per int-standards.nextjs.md's Database Layer section — document this explicitly, since it is an application-layer guarantee, not a database-engine-enforced one.
6. For every endpoint defined in the spec's API Contract, state an explicit rate-limit decision — literally "Rate limit: `<decision>`" — even when the decision is "none, deferred, because `<reason>`." A plan silent on this for any endpoint is a gap, not a pass.
7. Produce the **Constitution Check** as a literal checklist: one line per constitution.md rule that plausibly applies to this feature, each checked with a one-sentence justification of how the plan satisfies it. A rule left unaddressed is listed as an open gap — never silently dropped or blindly ticked.
8. If the plan would require a new datastore, a new external integration, or any capability constitution.md's Architectural Constraints currently prohibits (e.g., messaging/queue infrastructure, an external system) — do not silently design around the prohibition. Stop drafting that portion and flag explicitly: "This requires an ADR before the plan can proceed," per constitution.md's own "no new datastore without an ADR approved by the Architect" rule.
9. Draft **Explicitly Deferred** — name anything the spec left open or out of scope, and confirm this plan does not scope-creep into it.
10. Draft **Sequencing** — the ordered, high-level build steps. This section is the sole input to `/generate-tasks`; keep each step atomic enough to become one task.
11. Set the spec's Status forward to `Plan Drafted` only after this plan file is written — this workflow drafts the plan, it does not itself grant Plan Reviewed (that is a human Gate 1-continuation review).

## Output

`.ai-context/plans/<feature-slug>.plan.md`, following the **#29** plan skeleton: Derived From, Architecture Approach, Data Model, Constitution Check, Explicitly Deferred, Sequencing.

## Do not

1. Do not draft a plan from a spec whose Status isn't Approved (or later).
2. Do not blindly tick a Constitution Check item without a stated justification.
3. Do not leave any API endpoint's rate-limit decision unstated.
4. Do not introduce a new datastore, messaging system, or external integration without flagging the ADR requirement — never decide around a constitutional prohibition.
5. Do not generate tasks or implementation code as a side effect of this workflow.
