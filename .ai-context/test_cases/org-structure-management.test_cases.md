# Test Cases: Organizational Structure Management

## Derived From
.ai-context/specs/org-structure-management.spec.md

## QA-Expanded Test Cases

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| org-structure-management.QT01 | AC1 | Department name submitted with leading/trailing whitespace | Open QA Question — see below |
| org-structure-management.QT02 | AC2 | Employee, HR, Payroll, IT, and Facilities each independently attempt to create a Department | 403 Forbidden, for every role tested (full sweep beyond the spec's single Manager example) |
| org-structure-management.QT03 | AC2 | Manager attempts to edit and delete an existing Department (not just create) | 403 Forbidden for both |
| org-structure-management.QT04 | AC3 | Department name submitted that differs only in case from an existing one (e.g. `Sales` vs `sales`) | Open QA Question — see below |
| org-structure-management.QT05 | AC4 | Admin edits a Department's name to a value already used by a different Department | 409, `{ "error": "name_exists" }` — per API02's stated exception shape |
| org-structure-management.QT06 | AC5 | Admin deletes a Department, then attempts to delete the same (already-deleted) Department again | 404 |
| org-structure-management.QT07 | AC5 | Admin deletes a Department already referenced by an in-flight or historical transfer request | Open QA Question — see below (the known referential-integrity gap, in test form) |
| org-structure-management.QT08 | AC6 | Admin requests the Department list when zero Departments exist | 200; empty array |
| org-structure-management.QT09 | AC7 | Job Role title submitted with leading/trailing whitespace | Open QA Question — see below (same class as QT01) |
| org-structure-management.QT10 | AC8 | Employee, HR, Payroll, IT, and Facilities each independently attempt to create a Job Role | 403 Forbidden, for every role tested |
| org-structure-management.QT11 | AC8 | Manager attempts to edit and delete an existing Job Role | 403 Forbidden for both |
| org-structure-management.QT12 | AC9 | Job Role title submitted that differs only in case from an existing one | Open QA Question — see below (same class as QT04) |
| org-structure-management.QT13 | AC10 | Admin edits a Job Role's title to a value already used by a different Job Role | 409, `{ "error": "name_exists" }` |
| org-structure-management.QT14 | AC11 | Admin deletes a Job Role already referenced by an in-flight or historical transfer request | Open QA Question — see below (same class as QT07) |
| org-structure-management.QT15 | AC12 | Admin requests the Job Role list when zero Job Roles exist | 200; empty array |
| org-structure-management.QT16 | AC13 | Department create request with `name` present but an empty string | 400, `fields: ["name"]` — per API01's "missing/empty name" exception wording |
| org-structure-management.QT17 | AC13 | Job Role create request with `title` present but an empty string | 400, `fields: ["title"]` |

## Open QA Questions

1. **QT01/QT09 — is `name`/`title` uniqueness case-sensitive, and is whitespace trimmed before the uniqueness check?** Same open-question class as `rbac-api-security.test_cases.md`'s QT19/QT20 and `user-management-console.test_cases.md`'s QT07 — this project has no stated normalization rule for any unique-text field. Routes back to a spec amendment (likely a shared decision across all three specs, not one per spec).
2. **QT04/QT12 — same case-sensitivity question, specifically for the duplicate-detection (409) path** — consolidated with #1 above, not a separate decision.
3. **QT07/QT14 — what happens to a transfer request that already references a Department/Job Role that is later deleted?** This is the pre-existing open item already tracked in `discovery-analysis.md` and both `org-structure-management.spec.md`'s and `internal-transfer-workflow.plan.md`'s Explicitly Out of Scope / Deferred sections — surfaced here in test form, not a new gap.
