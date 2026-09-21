# Task: internal-transfer-workflow.T11

**Implements:** `internal-transfer-workflow.T11` — `GET /transfer-requests/{id}` (`API02`) carve-out: also allow the assigned Manager to view a request assigned to them.

**Acceptance:** `internal-transfer-workflow.AC19` (amended 2026-09-20). API Contract: `internal-transfer-workflow.spec.md`'s `API02`.

**Origin:** this task did not exist when the spec first reached `In QA`. It was added after discovering, while building `stakeholder-panel-ui.T06`'s Manager Decision panel, that `RequestDetail.tsx` (the shared base every stakeholder role's decision panel plugs into) calls `API02` unconditionally to render anything at all — but `API02` was Employee-owner-only with no exception, so a Manager navigating to `/my-requests/{id}` would 403 before ever seeing an Approve/Reject action. `AC19` itself was amended (see spec) to explicitly carve out the currently-relevant assigned stakeholder, reusing `AC21`–`AC23`'s existing per-role eligibility rule. That amendment needs Gate 1 reviewer re-confirmation at the next review touchpoint.

**Scope — build only this:**
- In `src/app/api/transfer-requests/[id]/route.ts`'s `GET` handler, extend the existing single ownership check so the request is also returned (200, not 403) when:
  - the caller's role is Manager, AND
  - `transferRequest.assignedManagerId` equals the caller's `userId`, AND
  - `transferRequest.status` is exactly `"Pending: Manager"` — matches `AC21`'s own eligibility rule for the same role/relationship, don't invent a looser or stricter condition.
- All other non-Employee, non-Admin callers, and Admin itself, keep the existing 403 — this is a narrow addition, not a general re-opening of the endpoint.
- Response shape is unchanged — the Manager gets the exact same `{ id, status, actionHistory, pendingStakeholders }` shape the Employee already gets.

**Do not touch:**
- HR/Payroll/IT/Facilities eligibility on this endpoint — explicitly deferred to `stakeholder-panel-ui.T07`–`T10`, each adding its own carve-out clause when it's actually needed, reusing `AC22`/`AC23`'s rules the same way this task reuses `AC21`'s.
- `transfer-admin-oversight`'s endpoints — Admin's own detail view is a separate endpoint; this task does not add an Admin carve-out here (`AC24`'s "no Admin carve-out" precedent still holds).
- Any other endpoint in this route file or elsewhere in `T01`–`T10`.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T11` has produced Red tests for it, confirmed failing for the right reason. At minimum: the assigned Manager on a `Pending: Manager` request gets 200 (new); an unrelated Manager on the same request still gets 403 (existing `UT19`, must stay Green throughout); the assigned Manager on the same request after it has moved past `Pending: Manager` (e.g. `Pending: HR`) still gets 403 (assignedManagerId alone isn't sufficient — status must match too).
