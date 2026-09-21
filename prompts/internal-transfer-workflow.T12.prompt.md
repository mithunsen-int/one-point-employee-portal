# Task: internal-transfer-workflow.T12

**Implements:** `internal-transfer-workflow.T12` — `GET /transfer-requests/{id}` (`API02`) carve-out, part 2: HR and Payroll/IT/Facilities.

**Acceptance:** `internal-transfer-workflow.AC19` — already amended (2026-09-20) to generically cover "Manager/HR/Payroll/IT/Facilities... using the identical per-role eligibility rule already defined by `AC21`–`AC23`." This task implements the HR/Payroll/IT/Facilities portion; no further spec amendment is needed (`T11` already carries the Gate 1 re-confirmation for the AC's wording itself).

**Origin:** added after auditing `stakeholder-panel-ui.T07`–`T11` for the same class of blocker `T06` hit (an unrelated role 403ing on the shared `RequestDetail` base before ever seeing its action panel). By explicit user decision, all three remaining role carve-outs are built together in one task rather than one per consuming `stakeholder-panel-ui` task.

**Scope — build only this:**
In `src/app/api/transfer-requests/[id]/route.ts`'s `GET` handler, alongside the existing `isOwningEmployee` and `isAssignedManagerOnPendingRequest` checks, add:
- **HR** (`AC22`'s rule, covers both `stakeholder-panel-ui.T07` and `T11`'s needs in one clause): role is `HR`, AND (`status === "Pending: HR"` OR (`status === "Pending: Payroll, IT, Facilities"` AND `payrollTaskStatus`/`itTaskStatus`/`facilitiesTaskStatus` are all `"Completed"`)). Not person-specific — any HR user, matching `hr-decision`/`hr-final-mapping`'s own existing non-routing rule.
- **Payroll** (`AC23`'s rule): role is `Payroll`, AND `status === "Pending: Payroll, IT, Facilities"`, AND `payrollTaskStatus === "Pending"`.
- **IT**: same shape, `itTaskStatus === "Pending"`.
- **Facilities**: same shape, `facilitiesTaskStatus === "Pending"`.

Combine these with the existing checks via a single "is this viewer currently allowed" boolean, matching the existing code's style (`isOwningEmployee || isAssignedManagerOnPendingRequest || ...`) rather than a series of early returns.

**Do not touch:**
- The existing Employee and Manager carve-out logic — do not change their conditions, only add to them.
- Any other endpoint in this route file or elsewhere in `T01`–`T11`.
- `transfer-admin-oversight`'s endpoints — no Admin carve-out here, unchanged.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T12` has produced Red tests for it, confirmed failing for the right reason. At minimum, per role: a positive case (200) at the exact eligible state, and at least one negative case proving the condition is real and not just "any request of this role" (e.g. HR gets 403 on a `Pending: Manager` request; HR gets 403 on `Pending: Payroll, IT, Facilities` with only 2 of 3 tasks `Completed`; Payroll gets 403 once its own `payrollTaskStatus` is already `Completed`; an unrelated role sweep still gets 403 as before). Confirm every pre-existing test in this file (`T03`'s and `T11`'s own tests) stays Green throughout — this task only adds allowed cases, it must not narrow any existing one.
