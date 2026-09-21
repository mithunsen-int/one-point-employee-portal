# Task: stakeholder-panel-ui.T13

**Implements:** `stakeholder-panel-ui.T13` — navigation bar + visual-polish pass across every screen/panel in this spec.

**Acceptance:** `stakeholder-panel-ui.AC13` (added 2026-09-21, the nav links — testable). The visual styling itself has no dedicated AC — cited representatively against `int-standards.nextjs.md`'s already-approved Tailwind + shadcn/ui stack.

**Origin:** same investigation as `admin-panel-ui.T09` — the user asked why the Dashboard had no styling; found this was true of all 11 components in this spec too, and neither panel had any navigation between screens. By explicit user decision: one task per spec, navigation included alongside styling.

**Scope — build only this:**
- `StakeholderPanelLayout.tsx`: add a nav bar (rendered only once `authorized`, alongside the existing Logout button) — a link to "My Requests" (`/my-requests`, all roles) and, only when the session's decoded role is `"Employee"`, a link to "Submit Request" (`/transfer-requests/new`). Requires the layout to read and hold the role, not just the `authorized` boolean it currently tracks.
- Apply consistent Tailwind spacing/typography — matching the same convention `admin-panel-ui.T09` establishes — to: `LoginForm.tsx`, `MyRequestsList.tsx`, `SubmitRequestForm.tsx`, `RequestDetail.tsx`, and its embedded panels (`ManagerDecisionPanel`, `HrDecisionPanel`, `PayrollTaskForm`, `ItTaskForm`, `FacilitiesTaskForm`, `HrFinalMappingPanel`).
- Where a component uses plain HTML `<table>`/`<select>`/`<button>`/`<label>` (most of them, per the earlier audit — check each individually, don't assume), bring it in line with the shadcn/ui `Table`/`Input`/`Label`/`Button` primitives already adopted elsewhere in the project, the same treatment `admin-panel-ui.T09` gave `UserManagement.tsx`.

**Do not touch:**
- Any component's actual data-fetching, mutation, validation, or conditional-rendering logic — markup/classNames and nav links only. Every existing test's text content, role names, and query targets must keep resolving to the same elements — restructure markup to preserve the same accessible name/role rather than editing tests to match new markup, unless a test was querying an implementation detail rather than genuine accessible content (re-read each test file before restyling its component, the same practice `admin-panel-ui.T09` used to catch a text-shape mistake before it broke anything).
- `admin-panel-ui`'s own components — that panel's pass was `admin-panel-ui.T09`, already Merged... pending its own Gate 2 verdict.
- Any backend route, service, or hook.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T13` has produced Red tests for it, confirmed failing for the right reason. At minimum: `StakeholderPanelLayout` renders a "My Requests" link for every role; renders a "Submit Request" link only for Employee, absent for every other role. No new tests are needed for the pure visual-styling portion — instead, re-run every existing test file in this spec unmodified after the styling changes and confirm they still pass.
