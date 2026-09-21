# Task: stakeholder-panel-ui.T02

**Implements:** `stakeholder-panel-ui.T02` — `StakeholderPanelLayout`: route guard (no-session redirect to Login) and a Logout control, both consuming the already-built shared `src/shared/auth/` module.

**Acceptance:** `stakeholder-panel-ui.AC10`, `stakeholder-panel-ui.AC11`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 1.

**Scope — build only this:**
- `StakeholderPanelLayout` component wrapping every screen in this spec except Login (`T03`–`T11`).
- Route guard: reads the session via the shared module (built by `admin-panel-ui.T01`); redirects to Login if none exists (`AC10`).
- A Logout control visible at all times inside this layout, calling the shared module's logout function and redirecting to Login (`AC11`).
- Client-side gating only — every consumed endpoint already enforces its own 401/403/409 server-side, per this plan's Constitution Check.

**Do not touch:**
- The shared `src/shared/auth/` module's internals (`admin-panel-ui.T01`) — only call its exported functions.
- `T01`'s Login screen, or any of `T03`–`T11`'s content.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T02` has produced Red tests for it, confirmed failing for the right reason.
