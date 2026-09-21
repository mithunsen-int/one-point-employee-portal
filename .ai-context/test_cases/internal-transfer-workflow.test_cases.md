# Test Cases: Internal Transfer Workflow

## Derived From
.ai-context/specs/internal-transfer-workflow.spec.md

## QA-Expanded Test Cases

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| internal-transfer-workflow.QT01 | AC1 | Submit with the optional `reason` field omitted | 201 — `reason` is optional per the spec |
| internal-transfer-workflow.QT02 | AC1 | Submit with `effectiveDate` set in the past | Open QA Question — see below |
| internal-transfer-workflow.QT03 | AC1 | Submit with a `location` value not present in the config-driven allowed set | 400, per API01's validation exception (distinct from the 404 given for a nonexistent `departmentId`/`jobRoleId`) |
| internal-transfer-workflow.QT04 | AC1 | Submit with both `departmentId` and `jobRoleId` nonexistent simultaneously | 404, naming at least one invalid field (spec doesn't say both must be named — verify at least one is) |
| internal-transfer-workflow.QT05 | AC2 | Submission missing `departmentId` only | 400, `fields: ["departmentId"]` |
| internal-transfer-workflow.QT06 | AC2 | Submission missing `jobRoleId` only | 400, `fields: ["jobRoleId"]` |
| internal-transfer-workflow.QT07 | AC2 | Submission missing `location` only | 400, `fields: ["location"]` |
| internal-transfer-workflow.QT08 | AC3 | HR attempts to submit a transfer request (not just the spec's own Manager example) | 403 Forbidden |
| internal-transfer-workflow.QT09 | AC4/AC5/AC6 | A Manager who is not the request's `assignedManagerId` attempts to approve or reject it | 403 Forbidden — **resolved**, 2026-09-19 |
| internal-transfer-workflow.QT10 | AC6 | Manager rejection submitted with `reason` as an empty string | 400 — treated the same as a missing reason |
| internal-transfer-workflow.QT11 | AC7 | HR approves at exactly 90 days since `dateOfJoining` (inclusive boundary) | Approved — `AC7` says "at least 90 days," so day 90 itself qualifies |
| internal-transfer-workflow.QT12 | AC7 | HR approves at 89 days since `dateOfJoining` | 409 — not yet eligible |
| internal-transfer-workflow.QT13 | AC8 | HR rejection submitted with `reason` as an empty string | 400 — same pattern as QT10 |
| internal-transfer-workflow.QT14 | AC9 | Every one of `API03`–`API09` attempted against an already-`Rejected` request | 409 for all — a terminal request accepts no further transitions, not just "no explicit resume path" |
| internal-transfer-workflow.QT15 | AC9 | Every one of `API03`–`API09` attempted against an already-`Withdrawn` or already-`Completed` request | 409 for all — same principle as QT14, for the other two terminal states |
| internal-transfer-workflow.QT16 | AC10 | Payroll attempts to complete its task while the request is still `Pending: Manager` or `Pending: HR` | 409 — parallel tasks don't exist yet at that point |
| internal-transfer-workflow.QT17 | AC10 | Payroll attempts to complete its task a second time after it's already `Completed` | 409 |
| internal-transfer-workflow.QT18 | AC11/AC12 | IT and Facilities complete their tasks in reverse order (Facilities first, then IT) | Both succeed independently — order does not matter, confirming true parallel independence, not an implicit sequence |
| internal-transfer-workflow.QT19 | AC13 | All three tasks `Completed` except Payroll (vary which one is still pending, not always IT as in the spec's own example) | 409 for each of the three single-pending-task variants |
| internal-transfer-workflow.QT20 | AC13 | HR final-mapping performed by a different HR user than the one who approved at `API04` | 200 — per the spec's Explicitly Out of Scope, HR routing isn't restricted to a specific individual |
| internal-transfer-workflow.QT21 | AC15 | Inspect the exact response/data shape a client would use to render the "in-app confirmation" | Open QA Question — see below |
| internal-transfer-workflow.QT22 | AC16 | Employee attempts to withdraw at the exact moment the Manager has just approved (race condition) | Open QA Question — see below |
| internal-transfer-workflow.QT23 | AC17 | Withdraw attempted on a request in `Pending: HR`, `Pending: Payroll, IT, Facilities`, `Rejected`, `Withdrawn`, and `Completed` (all five non-`Pending: Manager` states individually) | 409 for all five — the spec's own example only covers one state |
| internal-transfer-workflow.QT24 | AC18 | Render every one of the six status values (`Pending: Manager`, `Pending: HR`, `Pending: Payroll, IT, Facilities`, `Rejected`, `Withdrawn`, `Completed`) | Each renders exactly as its literal string — full enumeration, not a spot check |
| internal-transfer-workflow.QT25 | AC19 | HR, Payroll, IT, and Facilities (not just Manager) each attempt to view another employee's request via `API02` | 403 Forbidden, for every role tested |
| internal-transfer-workflow.QT26 | AC19 | Admin attempts to view a request via `internal-transfer-workflow.API02` (not `transfer-admin-oversight.API03`) | 403 Forbidden — `API02`'s own contract permits only "the requesting Employee," with no Admin carve-out; Admin must use the dedicated oversight endpoint instead |

## Open QA Questions

1. **QT02 — is a past `effectiveDate` valid at submission?** Not stated anywhere in `internal-transfer-workflow.spec.md` or BRD-001. Routes back to a spec amendment.
2. ~~**QT09 — when a Manager who is not the request's assigned Manager attempts a decision on it, is the response 403 (Forbidden, wrong role for this specific resource) or 404 (as if the request doesn't pertain to them at all)?**~~ **Resolved 2026-09-19: 403.** Confirmed explicitly, not just inferred from `internal-transfer-workflow.T04`'s implementation — `API03`'s exception table can be read as already covering this via its generic "403 (non-Manager)" line, now confirmed to include "a different Manager" as well as "not a Manager at all."
3. **QT21 — what is the actual data shape of the "in-app confirmation" (`AC15`)?** The spec states the requirement but not a payload/mechanism — is it just the `status: "Completed"` value already returned by `API02`, or a distinct notification object? Routes back to a spec amendment.
4. **QT22 — how does the system handle two near-simultaneous requests that race against each other** (e.g. an Employee's withdraw and a Manager's approval landing at nearly the same time)? Not addressed anywhere — no optimistic-locking or transaction behavior is specified for `TransferRequests` updates. Routes back to a spec/plan amendment, not a QA-invented default.
