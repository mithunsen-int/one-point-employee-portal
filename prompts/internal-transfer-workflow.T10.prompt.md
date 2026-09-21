# Task: internal-transfer-workflow.T10

**Implements:** `internal-transfer-workflow.T10` — `GET /transfer-requests/mine` (`API10`): role-filtered discovery of requests relevant to the caller.

**Acceptance:** `internal-transfer-workflow.AC20`, `AC21`, `AC22`, `AC23`, `AC24`. API Contract: `internal-transfer-workflow.spec.md`'s `API10`.

**Origin:** this task did not exist when the spec first reached `In QA`. It was added after discovering, while scoping `stakeholder-panel-ui.spec.md`'s screens, that no endpoint anywhere lets Manager/HR/Payroll/IT/Facilities discover which request(s) need their action, or lets an Employee list their own requests beyond one already-known `id`. The spec was reopened to `In Development` for this one task.

**Scope — build only this:**
- One new endpoint, `GET /transfer-requests/mine`, filtered server-side by the caller's role (no client-supplied filter parameter):
  - Employee: every request where `employeeId` = caller, any status.
  - Manager: requests where `assignedManagerId` = caller and status is `Pending: Manager`.
  - HR: requests in `Pending: HR`, plus requests in `Pending: Payroll, IT, Facilities` where `payrollTaskStatus`, `itTaskStatus`, and `facilitiesTaskStatus` are all `Completed`.
  - Payroll: requests in `Pending: Payroll, IT, Facilities` where `payrollTaskStatus` is `Pending`. IT/Facilities: the same pattern against their own task-status field.
  - Admin: 403 — `transfer-admin-oversight.API02`/`API03` already serve Admin's unfiltered view; this endpoint is not a second copy of that.
- Response shape: array of `{ "id", "status", "employeeId", "submittedAt", "payrollTaskStatus", "itTaskStatus", "facilitiesTaskStatus" }` — same base shape as `transfer-admin-oversight.API02`'s list, with the three task-status fields added so HR's client can distinguish "needs decision" from "needs final mapping" without a second field.

**Do not touch:**
- Any of `T01`–`T09`'s existing endpoints or the shared audit-logging helper — this is a new, additive read endpoint, not a modification of an existing transition.
- `transfer-admin-oversight`'s endpoints — Admin's list/detail view is untouched; this task only adds the 403 exception for Admin on the new endpoint.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T10` has produced Red tests for it, confirmed failing for the right reason.
