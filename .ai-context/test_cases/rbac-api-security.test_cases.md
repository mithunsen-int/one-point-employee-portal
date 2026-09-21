# Test Cases: Role-Based Access Control and API Security

## Derived From
.ai-context/specs/rbac-api-security.spec.md

## QA-Expanded Test Cases

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| rbac-api-security.QT01 | AC1 | Request with no `Authorization` header at all | 401 Unauthenticated |
| rbac-api-security.QT02 | AC1 | `Authorization` header present but missing the `Bearer ` prefix | 401 Unauthenticated |
| rbac-api-security.QT03 | AC1 | `Authorization: Bearer` with an empty token string | 401 Unauthenticated |
| rbac-api-security.QT04 | AC1 | Token expired 1 second before the request | 401 Unauthenticated |
| rbac-api-security.QT05 | AC1 | Token that expires at the exact instant of the request (boundary) | 401 Unauthenticated |
| rbac-api-security.QT06 | AC1 | Token signed with an invalid/wrong secret | 401 Unauthenticated |
| rbac-api-security.QT07 | AC1 | Token with a tampered payload (valid structure, invalid signature) | 401 Unauthenticated |
| rbac-api-security.QT08 | AC2 | Token valid, but the decoded role claim is missing/null | 403 Forbidden (treated as no permitted actions) |
| rbac-api-security.QT09 | AC2 | Token valid, role claim contains a string outside the 7 known roles | 403 Forbidden |
| rbac-api-security.QT10 | AC3 | Employee attempts to view a transfer request that is not their own | 403 Forbidden |
| rbac-api-security.QT11 | AC3 | Employee attempts to withdraw a request while it is `Pending: HR` (not `Pending: Manager`) | 403 Forbidden (per role boundary; distinct from the 409 state-conflict the workflow spec also returns) |
| rbac-api-security.QT12 | AC4 | Manager attempts to approve/reject a request not routed to them | 403 Forbidden |
| rbac-api-security.QT13 | AC5 | HR attempts a Payroll/IT/Facilities parallel-task action directly | 403 Forbidden |
| rbac-api-security.QT14 | AC6 | Payroll attempts an IT or Facilities task action | 403 Forbidden |
| rbac-api-security.QT15 | AC7 | IT attempts a Payroll or Facilities task action | 403 Forbidden |
| rbac-api-security.QT16 | AC8 | Facilities attempts a Payroll or IT task action | 403 Forbidden |
| rbac-api-security.QT17 | AC9 | Employee, Payroll, IT, and Facilities each independently attempt to register a new Employee user | 403 Forbidden, for every role tested (full role-matrix sweep beyond the spec's single Manager example) |
| rbac-api-security.QT18 | AC9 | Admin performs each of: user management, department/role management, transfer-request-monitoring | 200 (permitted) for all three |
| rbac-api-security.QT19 | AC10 | `username` submitted with leading/trailing whitespace, credentials otherwise valid | Open QA Question — see below |
| rbac-api-security.QT20 | AC10 | `username` submitted with different casing than stored (e.g. `Admin` vs `admin`) | Open QA Question — see below |
| rbac-api-security.QT21 | AC11 | Login with a non-existent `username` | 401, `{ "error": "invalid_credentials" }` — identical response shape to a wrong-password case (no username-enumeration signal) |
| rbac-api-security.QT22 | AC11 | Login with an existing `username` and wrong `password` | 401, `{ "error": "invalid_credentials" }` — same response as QT21, confirming no information leak between "unknown user" and "wrong password" |
| rbac-api-security.QT23 | AC12 | Login payload missing `username` only | 400, `fields: ["username"]` |
| rbac-api-security.QT24 | AC12 | Login payload missing `password` only | 400, `fields: ["password"]` |
| rbac-api-security.QT25 | AC12 | Login payload with `username` as a non-string JSON type (e.g. a number) | 400, `fields: ["username"]` |
| rbac-api-security.QT26 | AC12 | Login payload with an unexpected extra field alongside valid `username`/`password` | Open QA Question — see below |
| rbac-api-security.QT27 | AC13 | Exactly 5 failed login attempts for one `username` within the 15-minute window | 5th attempt still evaluated normally (401 if wrong, not yet rate-limited) |
| rbac-api-security.QT28 | AC13 | 6th failed login attempt for the same `username` within the same window | 429, `{ "error": "rate_limited", "retry_after": ... }` |
| rbac-api-security.QT29 | AC13 | Failed attempts against `username` A do not affect login attempts for `username` B | `username` B's attempts are evaluated normally, unaffected by A's rate-limit state |
| rbac-api-security.QT30 | AC13 | After the 15-minute window elapses, a further attempt for the previously-limited `username` | Evaluated normally again (not permanently locked) |

## Open QA Questions

1. **QT19/QT20 — is `username` matching case-sensitive, and is whitespace trimmed before lookup?** Neither `rbac-api-security.spec.md` nor `user-management-console.spec.md` states this. Routes back to a spec amendment on whichever spec owns username normalization (`user-management-console`, since it owns the `Users` write path) rather than a QA-invented default.
2. **QT26 — does the login endpoint reject unknown extra fields in the payload, or silently ignore them?** Not stated in `rbac-api-security.spec.md`'s API Contract. Routes back to a spec amendment.
3. **Can Admin directly execute a Payroll/IT/Facilities parallel-task action**, given `AC9`'s broad "user management" grant doesn't explicitly enumerate workflow-task execution? A reasonable engineer could defend either a strict reading (Admin cannot, since `AC6`–`AC8` name only Payroll/IT/Facilities as permitted) or a broad reading (Admin's general oversight role implies override capability). Not tested as a pass/fail case above (QT13–QT16 test the other roles, deliberately not Admin) — routes back to a spec amendment on `rbac-api-security.spec.md`.
