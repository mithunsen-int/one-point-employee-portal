# Test Cases: Transfer Administrative Oversight

## Derived From
.ai-context/specs/transfer-admin-oversight.spec.md

## QA-Expanded Test Cases

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| transfer-admin-oversight.QT01 | AC1 | Dashboard requested when zero Payroll users are registered | `Payroll: 0` is present in `userCounts`, not omitted from the response |
| transfer-admin-oversight.QT02 | AC1 | Dashboard requested with the Admin account and one soft-deleted Employee both present | Admin is excluded from `userCounts` (per `AC1`'s own enumerated six roles); the soft-deleted Employee is also excluded (per the plan's explicit decision) — both confirmatory of already-decided rules, not new questions |
| transfer-admin-oversight.QT03 | AC2 | Dashboard requested when zero requests exist in a particular status (e.g. no `Withdrawn` requests yet) | `"Withdrawn": 0` is present in `statusBreakdown`, not omitted |
| transfer-admin-oversight.QT04 | AC2 | `totalTransferRequests` computed with a mix of in-flight and terminal (`Rejected`/`Withdrawn`/`Completed`) requests present | Total includes every request regardless of terminal status — confirms the plan's explicit decision was actually implemented as decided |
| transfer-admin-oversight.QT05 | AC3 | Employee, Manager, HR, Payroll, IT, and Facilities each independently request the dashboard | 403 Forbidden, for every role tested (full sweep beyond the spec's single Employee example) |
| transfer-admin-oversight.QT06 | AC4 | Monitoring list requested when a large number of requests exist (e.g. hundreds) | Open QA Question — see below |
| transfer-admin-oversight.QT07 | AC5 | Manager, HR, Payroll, IT, and Facilities each independently request the monitoring list | 403 Forbidden, for every role tested |
| transfer-admin-oversight.QT08 | AC6 | Detail view requested for a request that has completed all lifecycle stages | Response includes every field from `internal-transfer-workflow.API01`'s payload plus the full `actionHistory` — not a partial projection |
| transfer-admin-oversight.QT09 | AC7 | HR, Payroll, IT, and Facilities each independently request a request's detail view via this endpoint | 403 Forbidden, for every role tested |
| transfer-admin-oversight.QT10 | AC8 | Detail view requested with a syntactically malformed `id` | 404 (or 400 — same open question as `transfer-audit-trail.test_cases.md`'s QT06, not re-litigated separately here) |

## Open QA Questions

1. **QT06 — does the monitoring list (`API02`) paginate, or return every request unbounded?** The spec explicitly decided there's no filtering/search, but pagination is a distinct question it doesn't address — a genuinely large dataset has no stated behavior. Routes back to a spec/plan amendment.
