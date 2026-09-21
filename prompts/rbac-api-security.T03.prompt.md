# Task: rbac-api-security.T03

**Implements:** `rbac-api-security.T03` — Login rate-limiting: 5 failed attempts per username within a rolling 15-minute window, then 429 with `retry_after: 900`.

**Acceptance:** `rbac-api-security.AC13`. Full text in `.ai-context/specs/rbac-api-security.spec.md`. Implementation detail: `.ai-context/plans/rbac-api-security.plan.md`, Sequencing step 3 and its Constitution Check rate-limit decision.

**Scope — build only this:**
- Rate-limiting logic applied to `POST /auth/login` only: 5 failed attempts per `username` in a rolling 15-minute window → 429 with `{ "error": "rate_limited", "retry_after": ... }`.
- Successful logins must not count toward, or be blocked by, the failed-attempt counter.

**Do not touch:**
- `T02`'s login handler logic itself (payload validation, credential lookup, JWT issuance) — only add the rate-limit check around it.
- `rbac-api-security.API01` (the cross-cutting authorization check) — per the plan, it carries no rate limit of its own; do not add one there.
- Any other endpoint — this task's rate limit applies exclusively to `POST /auth/login`.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for rbac-api-security.T03` has produced Red tests for it, confirmed failing for the right reason.
