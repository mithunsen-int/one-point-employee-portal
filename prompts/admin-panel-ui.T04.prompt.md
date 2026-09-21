# Task: admin-panel-ui.T04

**Implements:** `admin-panel-ui.T04` — Transfer Request Monitoring list screen, via a `useTransferRequestsList` hook over `transfer-admin-oversight.API02`.

**Acceptance:** `admin-panel-ui.AC2`. API Contract consumed: `transfer-admin-oversight.API02`. Implementation detail: `.ai-context/plans/admin-panel-ui.plan.md`, Sequencing step 3.

**Scope — build only this:**
- `monitoringService.ts`: a thin fetch wrapper calling `GET /admin/transfer-requests`, typed to `API02`'s response shape.
- `useTransferRequestsList` TanStack Query hook wrapping that service call.
- The Monitoring list page/component, rendering every returned request, each row linking to `T05`'s detail route (`/transfer-requests/[id]`) by `id`.
- No filtering/search UI — `API02` supports none (per the spec's own Explicitly Out of Scope); do not invent client-side filtering.

**Do not touch:**
- `T05`'s detail screen content — this task only builds the link, not the destination.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T04` has produced Red tests for it, confirmed failing for the right reason.
