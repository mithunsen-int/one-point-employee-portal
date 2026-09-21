# Task: internal-transfer-workflow.T01

**Implements:** `internal-transfer-workflow.T01` — `TransferRequests` Mongoose schema/model.

**Acceptance:** `internal-transfer-workflow.AC1` (representative — this task is foundational schema work enabling request creation, not itself one endpoint's behavior). Implementation detail: `.ai-context/plans/internal-transfer-workflow.plan.md`, Data Model section — the full field list (`employeeId`, `departmentId`, `jobRoleId`, `location`, `effectiveDate`, `reason`, `status` enum, `assignedManagerId`, `managerDecisionReason`, `hrDecisionReason`, `payrollTaskStatus`/`itTaskStatus`/`facilitiesTaskStatus`, `newManagerId`, `submittedAt`, `completedAt`).

**Scope — build only this:**
- The schema itself: all fields, the `status` enum matching `AC18`'s exact vocabulary (`Pending: Manager`, `Pending: HR`, `Pending: Payroll, IT, Facilities`, `Rejected`, `Withdrawn`, `Completed`), the three task-status enums (`Pending`/`Completed`).
- Do **not** implement the conditional-required validation for `managerDecisionReason`/`hrDecisionReason` at the schema level — per the plan, that's application-layer (route-handler) validation, built in `T04`/`T05`, not here.

**Do not touch:**
- No route handlers — schema only.
- Any other collection (`Users`, `Departments`, `JobRoles`, `AuditLogs`) — this task defines `TransferRequests` alone.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for internal-transfer-workflow.T01` has produced Red tests for it, confirmed failing for the right reason.
