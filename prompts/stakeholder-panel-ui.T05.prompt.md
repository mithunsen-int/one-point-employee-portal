# Task: stakeholder-panel-ui.T05

**Implements:** `stakeholder-panel-ui.T05` — the adaptive request detail/action screen's Employee-facing portion: own-status view plus Withdraw.

**Acceptance:** `stakeholder-panel-ui.AC4`, `stakeholder-panel-ui.AC5`. API Contract consumed: `internal-transfer-workflow.API02`, `internal-transfer-workflow.API09`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 4.

**Scope — build only this:**
- Extend `transferRequestsService.ts` with calls to `GET /transfer-requests/{id}` and `POST /transfer-requests/{id}/withdraw`.
- `useRequestDetail` query hook (keyed by `id`) and `useWithdraw` mutation hook, the latter invalidating `useRequestDetail`/`useMyRequests` on success.
- The base of the adaptive detail/action screen at `/my-requests/[id]` (corrected 2026-09-20 from the originally-planned `/transfer-requests/[id]`, which collides with `admin-panel-ui`'s own detail route — see `stakeholder-panel-ui.plan.md`'s Route structure note): renders `API02`'s status, action history, and pending stakeholders for the owning Employee (`AC4`).
- A Withdraw action, shown only while status is `Pending: Manager` (`AC5`) — a UX convenience only, not a substitute for `API09`'s own 409 enforcement.
- This task establishes the screen's base structure that `T06`–`T11` plug role-specific action panels into — but build only the Employee-facing content described above, not those other panels.

**Do not touch:**
- `T06`–`T11`'s role-specific action panels — this task's own scope is the Employee view only; the same route/screen, but not those panels' content.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T05` has produced Red tests for it, confirmed failing for the right reason.
