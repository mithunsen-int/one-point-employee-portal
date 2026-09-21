# Task: stakeholder-panel-ui.T12

**Implements:** `stakeholder-panel-ui.T12` — root route (`/`) redirect, plus the same already-authenticated check on Login.

**Acceptance:** `stakeholder-panel-ui.AC12` (added 2026-09-20). Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 9.

**Origin:** this task did not exist when the spec first reached `In QA`. The user asked what the first screen would be when visiting the bare site URL — `src/app/page.tsx` (the Next.js root route, outside any route group) was still the unmodified `create-next-app` scaffold, never assigned to any spec, with no path from it into either panel. By explicit user instruction, this is recorded as a spec amendment only (no BRD entry), since it's a small extension of `BRD-008`'s already-resolved session/redirect behavior, not a new capability.

**Scope — build only this:**
- New shared helper, `src/shared/auth/homeRouteForRole.ts`: `homeRouteForRole(role: string | undefined): string`, returning `"/dashboard"` for `"Admin"` and `"/my-requests"` for anything else (including `undefined`). This is the exact Admin-vs-everyone-else decision `LoginForm.tsx` already makes inline — extract it there too so both call sites share one implementation.
- Rewrite `src/app/page.tsx`: a `"use client"` component that, on mount, checks `readSession()`/`isSessionExpired()` and calls `router.replace(...)` — to `/login` if there's no valid session, or to `homeRouteForRole(role)` if there is. Render nothing meaningful while the redirect is in flight (a loading state is enough; this route is never meant to be seen).
- Update `LoginForm.tsx`: (1) use the new `homeRouteForRole` helper in its own `onSuccess` handler instead of the inline ternary; (2) on mount, if `readSession()` already holds a valid (non-expired) session, redirect immediately to `homeRouteForRole(role)` instead of rendering the form.

**Do not touch:**
- `StakeholderPanelLayout`'s existing no-session guard (`AC10`) — unrelated, that guard is for authenticated-only screens, not Login or root.
- `admin-panel-ui`'s own `AdminPanelLayout` or any of its routes.
- The shared `session.ts`/`authenticatedFetch.ts` modules themselves — only a new, separate helper file is added alongside them.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T12` has produced Red tests for it, confirmed failing for the right reason. At minimum: no/expired session visiting `/` redirects to `/login`; an Admin session visiting `/` redirects to `/dashboard`; a non-Admin session visiting `/` redirects to `/my-requests`; an already-authenticated session visiting `/login` directly redirects to the role's home page without rendering the form; `LoginForm`'s existing fresh-login-success redirect tests still pass unmodified (now routed through the shared helper, same behavior).
