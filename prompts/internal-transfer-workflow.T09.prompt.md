# Task: internal-transfer-workflow.T09

**Implements:** `internal-transfer-workflow.T09` — Audit-trail integration: a shared helper invoked after every successful transition in `T02`–`T08`, calling `transfer-audit-trail.API01`.

**Acceptance:** `internal-transfer-workflow.AC1` (representative citation only — this task has no single dedicated AC of its own in this spec; it implements the Non-Functional Constraint "every transition is expected to be logged by `transfer-audit-trail`"). See `transfer-audit-trail.spec.md`'s own `AC1` for the actual logging behavior this task triggers. Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Sequencing step 9.

**Scope — build only this:**
- One shared helper function, called at the end of every successful transition across `T02` (submit), `T04` (manager decision), `T05` (HR decision), `T06` (each of the 3 task completions), `T07` (final mapping), `T08` (withdraw) — ten call sites total, one helper.
- The helper calls `transfer-audit-trail.API01` in-process (per that spec's own design — internal, not an HTTP call), passing `actor` (id + role, snapshotted per `transfer-audit-trail.plan.md`'s decision), `action`, `timestamp`.
- **Only successful transitions call this helper** — a rejected/failed attempt (400/403/409 response) must never append an entry, per `transfer-audit-trail.test_cases.md`'s QT02.

**Do not touch:**
- `transfer-audit-trail`'s own schema or append-function internals (`transfer-audit-trail.T01`/`T02`) — only call the function they expose.
- Any of `T02`–`T08`'s core business logic — this task only adds one call at the end of each, it doesn't change what they otherwise do.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T09` has produced Red tests for it, confirmed failing for the right reason.
