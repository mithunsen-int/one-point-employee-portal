# Task: stakeholder-panel-ui.T03

**Implements:** `stakeholder-panel-ui.T03` — the "My Requests" (Employee) / "Pending Actions" (Manager/HR/Payroll/IT/Facilities) list screen.

**Acceptance:** `stakeholder-panel-ui.AC2c`. API Contract consumed: `internal-transfer-workflow.API10`. Implementation detail: `.ai-context/plans/stakeholder-panel-ui.plan.md`, Sequencing step 2.

**Scope — build only this:**
- `transferRequestsService.ts`: a thin fetch wrapper calling `GET /transfer-requests/mine`, typed to `API10`'s response shape.
- `useMyRequests` TanStack Query hook wrapping that call.
- The list page/component: renders every item `API10` returns (already role-filtered server-side — no client-side filtering needed), each item linking into `T05`'s adaptive detail/action screen (`/transfer-requests/[id]`) by `id`.

**Do not touch:**
- `T05`'s detail/action screen content — this task only builds the link, not the destination.
- `T02`'s layout/guard/logout.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for stakeholder-panel-ui.T03` has produced Red tests for it, confirmed failing for the right reason.
