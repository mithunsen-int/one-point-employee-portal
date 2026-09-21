# Task: stakeholder-panel-ui.T01

**Implements:** `stakeholder-panel-ui.T01` — the Login screen: form, submit handler, invalid-credential error display.

**Acceptance:** `stakeholder-panel-ui.AC1`, `stakeholder-panel-ui.AC2`. API Contract consumed: `rbac-api-security.API02`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 1.

**Scope — build only this:**
- `authService.ts`: a thin fetch wrapper calling `POST /auth/login`.
- `useLogin` mutation hook wrapping that call.
- The Login page/form: username/password fields, submit handler. On success, call the already-built shared `src/shared/auth/` module's session-write function (from `admin-panel-ui.T01`) to persist `{ token, expiresAt }`, then route to `admin-panel-ui` if the decoded role is Admin, or into this panel's landing screen (`T03`) otherwise (`AC1`).
- On a 401 response, display an on-screen error and do not establish a session (`AC2`).

**Do not touch:**
- The shared `src/shared/auth/` module's internals (`admin-panel-ui.T01`) — only call its exported session-write function.
- `T02`'s layout/guard/logout, or any screen beyond Login.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T01` has produced Red tests for it, confirmed failing for the right reason.
