# auto-log.md

> **Methodology reference:** Per `sdd-methodology.md` **#15** — "the instruction that makes the agent append to `prompt_history.md` after every completed task, so the audit trail exists without relying on the engineer remembering to write it." Distinct from `status.md`'s human-curated daily summary (**#22**) — this is the agent's own session-level record.

## Standing Rule

After completing any task prompted from `prompts/<feature-slug>.T0#.prompt.md`, append an entry to `.ai-context/prompt_history.md` in this format, before ending the session:

```
### <date> — <feature-slug>.T0#
**Prompted from:** prompts/<feature-slug>.T0#.prompt.md
**Acceptance criteria targeted:** <AC IDs from the task's "Acceptance:" line>
**Summary of what was generated:** <one or two sentences, no code dump>
**Tests:** <confirmed Red before Green? state explicitly>
**Deviations from the prompt, if any:** <state explicitly, or "none">
**Status after this session:** <Not Started / In Progress / In Review>
```

## Rules governing this log

- **Do not editorialize or attribute authorship to AI in a way that violates constitution.md** — this file is an internal audit trail, not a commit message or code comment; it never leaks into comments/commits itself (per **#5.4**, **#14**'s "no agent-signature suffixes" rule — that rule is about commits/comments, this file is the _correct_ place for that information instead).
- **Do not log secrets, credentials, or PII** encountered during the session, even accidentally pasted into a prompt — redact before logging (per **#20**, "secrets and PII never enter a spec, plan, task, prompt, or prompt_history.md — no exceptions").
- **One entry per completed task**, appended, never overwritten — this file only grows; it is the session-level counterpart to `status.md`'s daily, human-curated summary, and the two should be consistent but are not the same document (**#22**).
- **If a task was abandoned or significantly deviated from its prompt**, log that fact explicitly rather than silently — this is exactly the kind of signal that should trigger a human decision (re-prompt vs. fix the spec/plan) per **#16**'s "don't iterate-and-hope" rule, and the log is where that decision point becomes visible later.
