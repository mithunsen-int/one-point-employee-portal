# Task: admin-panel-ui.T02

**Implements:** `admin-panel-ui.T02` — `AdminPanelLayout` (route guard for non-Admin/no-session, plus a Logout control), consuming `T01`'s shared `src/shared/auth/` module.

**Acceptance:** `admin-panel-ui.AC8`, `admin-panel-ui.AC9`, `admin-panel-ui.AC10`, `admin-panel-ui.AC11`. Implementation detail: `.ai-context/plans/admin-panel-ui.plan.md`, Sequencing step 1.

**Scope — build only this:**
- `AdminPanelLayout` component wrapping every screen in this spec (`T03`–`T08`).
- Route guard: reads the session via `T01`'s module; redirects to Login if none exists (`AC9`), or if the decoded role isn't Admin (`AC8`).
- Consumes `T01`'s expiry predicate: if `expiresAt` has passed when any wrapped screen attempts an API call, force-logout via `T01`'s `clearSession()` and redirect to Login (`AC10`).
- A Logout control (button/menu item) visible at all times inside this layout, calling `T01`'s `clearSession()` and redirecting to Login (`AC11`).
- Client-side gating only — do not add any server-side check here; every consumed endpoint already enforces its own 401/403 (per `admin-panel-ui.plan.md`'s Constitution Check).

**Do not touch:**
- `T01`'s module internals — only call its exported functions.
- Any of `T03`–`T08`'s screen content — this task only builds the wrapping layout/guard/logout, not what's inside it.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T02` has produced Red tests for it, confirmed failing for the right reason.
