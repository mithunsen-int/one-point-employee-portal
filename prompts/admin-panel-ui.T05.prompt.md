# Task: admin-panel-ui.T05

**Implements:** `admin-panel-ui.T05` — Transfer Request Detail screen, via a `useTransferRequestDetail` hook over `transfer-admin-oversight.API03`.

**Acceptance:** `admin-panel-ui.AC3`. API Contract consumed: `transfer-admin-oversight.API03`. Implementation detail: `.ai-context/plans/admin-panel-ui.plan.md`, Sequencing step 4.

**Scope — build only this:**
- Extend `monitoringService.ts` (or a sibling file) with a call to `GET /admin/transfer-requests/{id}`, typed to `API03`'s full response shape (including `actionHistory`).
- `useTransferRequestDetail` TanStack Query hook, keyed by `id`.
- The Detail page/component at `/transfer-requests/[id]`, rendering every field `API03` returns plus the full `actionHistory` list — not a partial projection.
- 404 handling: if the API returns 404, render a not-found state, not a crash.

**Do not touch:**
- `T04`'s list screen.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T05` has produced Red tests for it, confirmed failing for the right reason.
