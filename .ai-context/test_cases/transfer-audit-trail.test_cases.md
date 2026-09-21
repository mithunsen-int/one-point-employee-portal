# Test Cases: Transfer Request Audit Trail

## Derived From
.ai-context/specs/transfer-audit-trail.spec.md

## QA-Expanded Test Cases

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| transfer-audit-trail.QT01 | AC1 | Each of the ten distinct transition types (submit, manager approve/reject, HR approve/reject, each of the three parallel-task completions, final mapping, withdrawal) occurs once | One correctly-labeled entry per transition — full enumeration, not a spot check on one or two |
| transfer-audit-trail.QT02 | AC1 | An action that fails validation (e.g. a 403/409-rejected attempt) is attempted | No audit entry is appended — only successful transitions are logged, per the spec's "when that action completes successfully" wording |
| transfer-audit-trail.QT03 | AC2 | A direct database-level update or delete is attempted against an existing `AuditLogs` document (bypassing the API, testing the model-layer guard itself) | Throws — the blocking Mongoose hooks reject it, not just "no route exists for this" |
| transfer-audit-trail.QT04 | AC3/AC5 | The Manager or HR user who actually acted on a request (but is neither the requesting Employee nor Admin) attempts to view that request's audit log | 403 Forbidden — the spec's own Explicitly Out of Scope already scopes this narrowly to Employee-owns-request-or-Admin only; this is a confirmatory test of an already-decided boundary, not a new open question |
| transfer-audit-trail.QT05 | AC5 | Manager, Payroll, IT, and Facilities (not just "a different Employee") each attempt to view a request's audit log that isn't theirs | 403 Forbidden, for every role tested (full sweep beyond the spec's single example) |
| transfer-audit-trail.QT06 | AC6 | Audit log requested with a syntactically malformed `id` (not a valid ObjectId shape) | 404 (or 400, if the framework distinguishes malformed-ID from well-formed-but-missing — verify which; not specified in the spec's API Contract) |
| transfer-audit-trail.QT07 | AC3/AC4 | A request's audit log is requested after several transitions have occurred in a specific order | Open QA Question — see below |

## Open QA Questions

1. **QT07 — are audit log entries guaranteed to be returned in chronological order?** `transfer-audit-trail.spec.md`'s `API02` states it "returns all entries" but never specifies ordering. Routes back to a spec amendment.
2. Restated for traceability, not new: **audit scope (transfer-request-only vs. also covering `user-management-console`/`org-structure-management` CRUD)** remains the pre-existing open item already tracked in `discovery-analysis.md` and the spec's own Explicitly Out of Scope — not re-litigated here.
