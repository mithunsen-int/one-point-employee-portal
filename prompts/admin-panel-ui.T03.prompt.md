# Task: admin-panel-ui.T03

**Implements:** `admin-panel-ui.T03` — Dashboard screen, via a `useDashboard` hook over `transfer-admin-oversight.API01`.

**Acceptance:** `admin-panel-ui.AC1`. API Contract consumed: `transfer-admin-oversight.API01`. Implementation detail: `.ai-context/plans/admin-panel-ui.plan.md`, Sequencing step 2.

**Scope — build only this:**
- `dashboardService.ts`: a thin fetch wrapper calling `GET /admin/dashboard`, typed to `transfer-admin-oversight.API01`'s response shape.
- `useDashboard` TanStack Query hook wrapping that service call.
- The Dashboard page/component rendering `userCounts`, `totalTransferRequests`, and `statusBreakdown`, rendered inside `T02`'s `AdminPanelLayout`.
- Loading and error states for the query, per `int-standards.nextjs.md` #7.

**Do not touch:**
- `T02`'s layout/guard/logout — only render inside it.
- Any other screen's service/hook files.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T03` has produced Red tests for it, confirmed failing for the right reason.
