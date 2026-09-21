# Test Cases: Stakeholder Panel UI

## Derived From
.ai-context/specs/stakeholder-panel-ui.spec.md

## QA-Expanded Test Cases
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| stakeholder-panel-ui.QT01 | AC1 | Each of Manager, HR, Payroll, IT, and Facilities individually logs in with valid credentials | Full role sweep, routed into this panel (not `admin-panel-ui`) — the spec's own `UT01`/`UT01b` only demonstrate Employee and Admin |
| stakeholder-panel-ui.QT02 | AC1 | Login form submitted with the username or password field left empty | **Resolved 2026-09-20:** blocked client-side via Yup (`required` on both fields); the API is never called. Field-level error text shown, submission not sent. |
| stakeholder-panel-ui.QT03 | AC2 | Login attempted after `rbac-api-security.API02`'s own rate limit trips (429, with `retry_after`) | See Open QA Questions — `AC2` only describes the 401 case; a 429 is a distinct response the spec doesn't address |
| stakeholder-panel-ui.QT04 | AC2b | Stored `expiresAt` exactly equal to "now" at the moment of an API call | See Open QA Questions — the exact boundary instant isn't specified as expired or not |
| stakeholder-panel-ui.QT05 | AC2b | Session force-logged-out in one browser tab while a second tab of either panel is open | See Open QA Questions — cross-tab propagation isn't addressed |
| stakeholder-panel-ui.QT06 | AC2b | Session expires while a form is being filled out but not yet submitted | See Open QA Questions — proactive "session expiring soon" warning vs. purely reactive force-logout at the next API call isn't specified |
| stakeholder-panel-ui.QT07 | AC2c | Each role (Employee, Manager, HR, Payroll, IT, Facilities) lands on their list with zero relevant requests | An explicit empty state is rendered per role, not a blank screen |
| stakeholder-panel-ui.QT08 | AC2c | HR's list contains both a `Pending: HR` item and a ready-for-final-mapping item in the same response | See Open QA Questions — whether these two categories are visually distinguished (e.g. labeled sections) isn't specified; `AC2c` only says items are "listed" |
| stakeholder-panel-ui.QT09 | AC2c | `API10` call fails (500 / network error) | An error state is rendered, not a blank/crashed screen |
| stakeholder-panel-ui.QT10 | AC3 | Submit form filled with an `effectiveDate` in the past | See Open QA Questions — whether the client blocks a past date, or relies entirely on the API (whose own "invalid" `effectiveDate` criteria are themselves unstated), isn't decided anywhere in the project |
| stakeholder-panel-ui.QT11 | AC3 | Submit form submitted for a `departmentId`/`jobRoleId` that was deleted between page load and submission (race) | `API01`'s 404 is surfaced on the form, not a crash |
| stakeholder-panel-ui.QT12 | AC4 | A user attempts to view a request `id` that isn't their own (not the requesting Employee) | `API02`'s 403 is surfaced with a clear message, not treated identically to a 404 |
| stakeholder-panel-ui.QT13 | AC5 | Withdraw submitted at the same moment the assigned Manager approves the same request (race) | Already an explicitly untestable, deliberately-left-open scenario per `internal-transfer-workflow.T08`'s own prompt file (no locking behavior invented) — the UI's only obligation is to surface whatever `409` the API returns, not to prevent the race |
| stakeholder-panel-ui.QT14 | AC6 | Manager submits Reject with a reason field containing only whitespace | Same recurring, still-unresolved project-wide ambiguity already flagged elsewhere (no whitespace-trimming rule exists project-wide) — see Open QA Questions rather than re-litigated here |
| stakeholder-panel-ui.QT15 | AC6 | Manager's decision submitted after the request's status already changed (e.g. HR somehow already acted — a 409 from `API03`) | Surfaced as an on-screen error, not a crash |
| stakeholder-panel-ui.QT16 | AC7 | HR submits Reject with a whitespace-only reason | Same ambiguity as `QT14` |
| stakeholder-panel-ui.QT17 | AC8 | Payroll selects "No Action Needed" | See Open QA Questions — whether the other data-entry fields are hidden or merely ignored isn't specified |
| stakeholder-panel-ui.QT18 | AC8 | A task-completion form submitted after the request has already left `Pending: Payroll, IT, Facilities` (409) | Surfaced as an on-screen error |
| stakeholder-panel-ui.QT19 | AC9 | HR opens the final-mapping screen when zero Managers exist in the system | See Open QA Questions — no fallback behavior is specified for an empty selector |
| stakeholder-panel-ui.QT20 | AC9 | The manager selected for final mapping is deleted between page load and submission (race) | `API08`'s error response is surfaced, not a crash |
| stakeholder-panel-ui.QT21 | AC10 | No session present, a deep link directly to `/transfer-requests/[id]` (not just the top-level "My Requests" screen) is requested | Redirected to Login — the guard applies to every route, not only top-level entry points |
| stakeholder-panel-ui.QT22 | AC10 | A stored session value that is present but unparseable/corrupted | Treated the same as "no session" — redirected, not a crash |
| stakeholder-panel-ui.QT23 | AC11 | Logout clicked while a mutation (e.g. Submit Request) is still in flight | See Open QA Questions — whether the in-flight request is cancelled or allowed to complete first isn't specified |

## Open QA Questions
| Question | Raised by | Routes back to |
|---|---|---|
| How should a 429 (rate-limited) response from `rbac-api-security.API02` be displayed, distinct from a plain invalid-credentials 401? | `QT03` | `stakeholder-panel-ui.spec.md` (`AC2`) |
| Is a stored `expiresAt` exactly equal to "now" (the boundary instant) treated as expired or not-yet-expired? | `QT04` | `stakeholder-panel-ui.spec.md` (`AC2b`) — this is the owning spec for the shared session module's expiry rule |
| Does a force-logout in one browser tab propagate to other open tabs (of either panel), or does each tab only discover expiry on its own next API call? | `QT05` | `stakeholder-panel-ui.spec.md` (`AC2b`) |
| Should the UI proactively warn a user that their session is about to expire while they're mid-form, or is a purely reactive force-logout at the next API call sufficient? | `QT06` | `stakeholder-panel-ui.spec.md` (`AC2b`) |
| Should HR's "Pending Actions" list visually distinguish "needs decision" items from "ready for final mapping" items, or is a flat list sufficient? | `QT08` | `stakeholder-panel-ui.spec.md` (`AC2c`) |
| Should the Submit Request form block a past `effectiveDate` client-side, given neither this spec nor `internal-transfer-workflow.API01` states what counts as an "invalid" `effectiveDate`? | `QT10` | `stakeholder-panel-ui.spec.md` (`AC3`), cross-referencing `internal-transfer-workflow.spec.md`'s own unstated validation criteria |
| Should selecting Payroll's "No Action Needed" hide the salary/compensation/tax/cost-center fields, or leave them visible but inert? | `QT17` | `stakeholder-panel-ui.spec.md` (`AC8`) |
| What should the HR final-mapping screen show if zero Managers exist in the system (an empty selector with no valid choice)? | `QT19` | `stakeholder-panel-ui.spec.md` (`AC9`) |
| Does clicking Logout cancel any in-flight mutation, or let it complete before clearing the session? | `QT23` | `stakeholder-panel-ui.spec.md` (`AC11`) |
