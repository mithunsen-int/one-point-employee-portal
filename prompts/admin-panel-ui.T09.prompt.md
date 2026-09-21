# Task: admin-panel-ui.T09

**Implements:** `admin-panel-ui.T09` — navigation bar + visual-polish pass across every screen in this panel.

**Acceptance:** `admin-panel-ui.AC12` (added 2026-09-21, the nav links — testable). The visual styling itself has no dedicated AC — cited representatively against `int-standards.nextjs.md`'s already-approved Tailwind + shadcn/ui stack, since every screen was built to satisfy purely functional ACs with zero styling until now.

**Origin:** the user asked why the Dashboard rendered with no styling at all. Investigation found this was true of all 7 components in this spec (and all 11 in `stakeholder-panel-ui`, handled separately as that spec's own `T13`) — literally zero `className` usage anywhere. Also found neither panel had any navigation between screens — only a Logout button. By explicit user decision: one task per spec, and navigation included alongside the styling pass.

**Scope — build only this:**
- `AdminPanelLayout.tsx`: add a nav bar (rendered only once `authorized`, alongside the existing Logout button) with links to all 5 screens — Dashboard (`/dashboard`), Transfer Request Monitoring (`/transfer-requests`), User Management (`/users`), Department Management (`/departments`), Job Role Management (`/job-roles`). Use Next.js `Link` for client-side navigation, not `<a href>`.
- Apply consistent Tailwind spacing/typography to every screen's own content: `Dashboard.tsx`, `MonitoringList.tsx`, `TransferRequestDetail.tsx`, `UserManagement.tsx`, `DepartmentManagement.tsx`, `JobRoleManagement.tsx`. A page container with consistent padding/max-width, consistent heading sizes, consistent spacing between sections — matching whatever convention this task establishes first (there is no existing house style to follow, since nothing has been styled before).
- Where a screen already uses plain HTML `<table>`/`<ul>` for list content (`Dashboard`, `MonitoringList`, `TransferRequestDetail`), replace it with the already-adopted shadcn/ui `Table` primitive (already used nowhere in this spec, though generated at `T07`'s `npx shadcn@latest add table`) for visual consistency with `DepartmentManagement`/`JobRoleManagement`, which already use it.
- Where a screen already uses shadcn/ui `Button`/`Input`/`Label` (`UserManagement`, `DepartmentManagement`, `JobRoleManagement`), leave the component choice as-is — only add layout/spacing classNames around them, don't replace working primitives.

**Do not touch:**
- Any component's actual data-fetching, mutation, or conditional-rendering logic — this task changes markup/classNames and adds nav links only. Every existing test's text content, role names, and query targets (`getByRole`, `getByText`, etc.) must keep resolving to the same elements — if a query would break because content moved to a differently-labeled element, prefer restructuring the markup to keep the same accessible name/role, not editing the test to match new markup, unless the test was querying an implementation detail rather than genuine accessible content.
- `stakeholder-panel-ui`'s own components — that panel's equivalent pass is `stakeholder-panel-ui.T13`, a separate task.
- Any backend route, service, or hook — this is a pure markup/styling/navigation task.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T09` has produced Red tests for it, confirmed failing for the right reason. At minimum: `AdminPanelLayout` renders a link (by accessible name) to each of the 5 screens, with the correct `href`, once authorized. No new tests are needed for the pure visual-styling portion (there's no meaningful assertion for "looks nice") — instead, re-run every existing test file in this spec unmodified after the styling changes and confirm they still pass, proving the restyle didn't silently change or remove any tested behavior or accessible content.
