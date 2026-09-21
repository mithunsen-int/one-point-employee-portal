# Task: transfer-audit-trail.T02

**Implements:** `transfer-audit-trail.T02` — internal append function (`API01`).

**Acceptance:** `transfer-audit-trail.AC1`. API Contract: `transfer-audit-trail.API01` (internal, not client-facing). Implementation detail: `.ai-context/plans/transfer-audit-trail.plan.md`, Sequencing step 2.

**Scope — build only this:**
- A function `internal-transfer-workflow.T09`'s shared helper calls: takes `actor` (id + role), `action`, creates one `AuditLogs` entry via `T01`'s schema, with `timestamp` set server-side (not client-supplied).
- This is an in-process function call, not an HTTP endpoint — no route, no request/response handling.

**Do not touch:**
- `T01`'s schema/guards themselves (only use them).
- `internal-transfer-workflow.T09`'s call-site logic — that's the other spec's task; this task only builds the function it calls.
- The read side (`T03`) — this task is write-only.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for transfer-audit-trail.T02` has produced Red tests for it, confirmed failing for the right reason.
