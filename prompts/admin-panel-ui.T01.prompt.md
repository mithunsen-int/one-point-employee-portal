# Task: admin-panel-ui.T01

**Implements:** `admin-panel-ui.T01` — the shared `src/shared/auth/` module: session hook, token read/write plus `expiresAt` check, a guard predicate function, and a logout function.

**Acceptance:** `admin-panel-ui.AC10` (representative citation only — this task has no single dedicated AC of its own in this spec; it implements `stakeholder-panel-ui.AC1`/`AC2b`/`AC11`'s already-Approved contract, per `admin-panel-ui.plan.md`'s explicit cross-spec build-assignment decision). See `stakeholder-panel-ui.spec.md`'s own `AC1`/`AC2b`/`AC11` for the actual behavior this module must satisfy. Implementation detail: `.ai-context/plans/admin-panel-ui.plan.md`, Sequencing step 1.

**Scope — build only this:**
- A function/hook to persist `{ token, expiresAt }` to `localStorage` on login (`expiresAt` computed as `login time + expires_in` seconds).
- A function to read the current session from `localStorage` and decode the role from the stored token.
- A predicate function returning whether the stored `expiresAt` has passed.
- A `clearSession()` function removing the stored token/`expiresAt` from `localStorage` — used by both expiry-triggered force-logout and voluntary logout.
- No UI/component code — this task is pure logic, unit-testable with plain Jest, no React Testing Library needed.

**Do not touch:**
- Any screen, layout, or route — those are `T02` onward.
- `stakeholder-panel-ui`'s own tasks/tests (not yet generated) — this module must match its spec's `AC1`/`AC2b`/`AC11` contract exactly, but this task does not modify anything under a `stakeholder-panel-ui` task ID.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T01` has produced Red tests for it, confirmed failing for the right reason.
