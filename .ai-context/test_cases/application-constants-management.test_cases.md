# Test Cases: Centralized Application Constants Management

## Derived From
.ai-context/specs/application-constants-management.spec.md

## QA-Expanded Test Cases

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| application-constants-management.QT01 | AC1 | Import the frontend module's `location` export from two different files in the same build | Both imports resolve to the identical value set — no per-import divergence |
| application-constants-management.QT02 | AC1 | A field key configured with zero values (empty array) | Open QA Question — see below |
| application-constants-management.QT03 | AC2 | Backend validates a submitted `location` value differing only in case from a configured value | Open QA Question — see below |
| application-constants-management.QT04 | AC2 | Backend validates a submitted value not present in the configured set at all | Rejected — per `internal-transfer-workflow.API01`'s 400 validation, which this module's export feeds |
| application-constants-management.QT05 | AC3 | Static inspection of both modules for a case-insensitive match on `department`/`jobRole` (e.g. `Department`, `JOBROLE`) | Absent — the spec's `AC3` intent is that these are never defined here regardless of casing, not just the exact-case string |
| application-constants-management.QT06 | AC4 | Frontend module edited and redeployed; backend module left unchanged | The two modules diverge (frontend offers a value the backend would reject) — confirms `AC5`'s "no automatic sync" is real, observable behavior, not just a documentation claim |
| application-constants-management.QT07 | AC5 | Structural check: neither module's file imports from the other | Confirmed — true independence, not just behavioral non-sync |

**Role-matrix sweep: not applicable.** This spec's Non-Functional Constraints explicitly state no authentication/authorization applies — there is no role dimension to expand against.

## Open QA Questions

1. **QT02 — is a field key with zero configured values valid, or must every field have at least one value?** Not stated anywhere in `application-constants-management.spec.md` or BRD-005. Routes back to a spec amendment.
2. **QT03 — is value matching (e.g. a submitted `location`) case-sensitive?** Same open-question class already logged in `rbac-api-security.test_cases.md` and `user-management-console.test_cases.md` for username matching, and `org-structure-management.test_cases.md` for name/title uniqueness — this project has no project-wide string-normalization rule stated anywhere. Worth resolving once, centrally, rather than per spec.
