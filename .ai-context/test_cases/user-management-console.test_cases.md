# Test Cases: User Management Console

## Derived From
.ai-context/specs/user-management-console.spec.md

## QA-Expanded Test Cases

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| user-management-console.QT01 | AC1 | Admin registers an Employee with `dateOfJoining` set to today | 201; record created |
| user-management-console.QT02 | AC1 | Admin registers an Employee with `dateOfJoining` set to a future date | Open QA Question — see below |
| user-management-console.QT03 | AC2 | Manager, Payroll, IT, and Facilities each independently attempt to register a new Employee | 403 Forbidden, for every role tested (full sweep beyond the spec's single Manager example) |
| user-management-console.QT04 | AC3 | Admin registers each of HR, Manager, Payroll, IT, Facilities individually | 201 for all five |
| user-management-console.QT05 | AC4 | Employee, Manager, Payroll, IT, and Facilities each independently attempt to register a new Manager user | 403 Forbidden, for every role tested |
| user-management-console.QT06 | AC4 | HR attempts to register a new Manager, Payroll, IT, or Facilities user | Open QA Question — see below (this is the pre-existing BRD-003 open item, now in test form) |
| user-management-console.QT07 | AC5 | Registration submitted with a `username` differing only in case from an existing user (e.g. `Admin` vs `admin`) | Open QA Question — see below |
| user-management-console.QT08 | AC6 | Registration missing `dateOfJoining` only | 400, `fields: ["dateOfJoining"]` |
| user-management-console.QT09 | AC6 | Registration for `role: "Employee"` missing `managerId` | 400, `fields: ["managerId"]` |
| user-management-console.QT10 | AC6 | Registration with `role` set to a value outside the six defined ones | 400, `fields: ["role"]` |
| user-management-console.QT11 | AC7 | Admin edits a user's `username` | 200; record updated (per API02's payload allowing username/role edits) |
| user-management-console.QT12 | AC7 | Admin edits a user's `role` from Employee to Manager | Open QA Question — see below |
| user-management-console.QT13 | AC8 | Admin deletes a user, then attempts to delete the same (now-deleted) user again | 404 — the record no longer matches "an existing, non-deleted user" per API03 |
| user-management-console.QT14 | AC9 | Admin requests the list view | Response includes the Admin account itself alongside the six other roles — no stated exclusion for this endpoint, unlike `transfer-admin-oversight`'s dashboard count which explicitly excludes Admin |
| user-management-console.QT15 | AC9 | Admin requests the list view after one user has been soft-deleted | Deleted user is absent from the results |
| user-management-console.QT16 | AC10 | Admin requests the detail view for a soft-deleted user's `id` | 404 |
| user-management-console.QT17 | AC11 | Registration `managerId` references an existing user whose role is Employee, not Manager | 404, `{ "error": "manager_not_found" }` |
| user-management-console.QT18 | AC11 | Registration `managerId` references a Manager who has since been soft-deleted | Open QA Question — see below |
| user-management-console.QT19 | AC12 | HR edits an Employee's `role` to Manager | Open QA Question — see below (same ambiguity as QT12, from HR's more restricted vantage point) |
| user-management-console.QT20 | AC13 | HR attempts to view, edit, and delete each of HR, Manager, Payroll, IT, Facilities, and Admin records individually | 403 Forbidden, for every role tested (full sweep beyond the spec's single Manager-view example) |
| user-management-console.QT21 | AC14 | Two simultaneous `POST /admin/self-register` calls when no Admin exists yet | Exactly one succeeds (201); the other fails — the database-level partial unique index (not just an application check-then-insert) is what must guarantee this under concurrency |
| user-management-console.QT22 | AC14 | The sole Admin account is soft-deleted, then `POST /admin/self-register` is called again | 201 — the partial unique index is scoped to `deletedAt: null`, so a soft-deleted Admin does not block a new self-registration |
| user-management-console.QT23 | AC15 | Exactly 5 self-registration requests from one IP within an hour, all after an Admin already exists | All 5 receive 409 (`admin_already_exists`) — none are rate-limited yet at exactly 5 |
| user-management-console.QT24 | AC15 | 6th self-registration request from the same IP within the same hour | 429 (rate-limited), distinct from the 409 an Admin-exists rejection would give |

## Open QA Questions

1. **QT02 — is a future `dateOfJoining` valid at registration time?** Not stated in `user-management-console.spec.md` or `internal-transfer-workflow.spec.md` (whose ≥90-day eligibility check consumes this field). Routes back to a spec amendment.
2. **QT06 — is HR authorized to register Manager, Payroll, IT, or Facilities users?** This is the pre-existing BRD-003 open item (`discovery-analysis.md`), not newly discovered here — surfaced in test form for QA traceability. Routes back to the same spec amendment already tracked.
3. **QT07 — is `username` uniqueness/lookup case-sensitive, and is whitespace trimmed?** Same open question as `rbac-api-security.test_cases.md`'s QT19/QT20 — cross-referenced, not duplicated as a separate decision.
4. **QT12/QT19 — what happens when a user's `role` is edited away from (or into) `"Employee"`?** Specifically: does `managerId` become irrelevant/get cleared when a role changes away from Employee, and does HR's Employee-scoped edit authority (`AC12`) still apply to an edit that changes the role field itself? Not stated anywhere. Routes back to a spec amendment.
5. **QT18 — does `managerId` validation (`AC11`) require the referenced Manager to be non-deleted, or does a soft-deleted Manager still count as "existing"?** Not stated. Routes back to a spec amendment.
