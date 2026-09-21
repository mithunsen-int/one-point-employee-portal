# Test Cases: Admin Panel UI

## Derived From
.ai-context/specs/admin-panel-ui.spec.md

## QA-Expanded Test Cases
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| admin-panel-ui.QT01 | AC1 | Dashboard rendered against `API01` returning every count as `0` (a brand-new system) | Every role count, `totalTransferRequests`, and every status in `statusBreakdown` render as `0`, not blank/omitted — matches the API's own zero-count-still-present contract |
| admin-panel-ui.QT02 | AC1 | Dashboard rendered against `API01` returning large counts (e.g. 4-digit numbers) | Numbers render fully, no truncation/overflow in the layout |
| admin-panel-ui.QT03 | AC1 | `API01` call fails (500 / network error) | An error state is rendered (per `int-standards.nextjs.md` #7); the screen does not crash or render stale/undefined data |
| admin-panel-ui.QT04 | AC2 | Monitoring list rendered against `API02` returning an empty array | An explicit empty-state message is rendered, not a blank screen |
| admin-panel-ui.QT05 | AC2 | Monitoring list rendered against `API02` returning a large number of requests (no pagination exists anywhere in the API, per the spec's own Explicitly Out of Scope) | Every request is rendered in one unfiltered list, exactly as the API returns it — this is a re-statement of already-decided scope, not a new ambiguity |
| admin-panel-ui.QT06 | AC2 | `API02` call fails (500 / network error) | An error state is rendered, not a blank/crashed screen |
| admin-panel-ui.QT07 | AC3 | Detail view rendered for a request with an empty `actionHistory` (e.g., viewed the instant it's created) | Renders an explicit "no actions yet" state, not a blank/missing section |
| admin-panel-ui.QT08 | AC3 | Detail view rendered for a request with a long `actionHistory` (e.g., a `Completed` request that passed through every stage) | Every entry is rendered, matching `admin-panel-ui.UT03`'s "not a partial projection" |
| admin-panel-ui.QT09 | AC3 | Detail view requested for a syntactically malformed `id` vs. a well-formed-but-nonexistent `id` | Both produce the identical 404 response from `API03` (per the project's `Types.ObjectId.isValid()` convention) — the UI's not-found state is identical for both, no separate malformed-id handling needed |
| admin-panel-ui.QT10 | AC4 | User Management list rendered against `API04` returning users across all 6 non-Admin roles plus the Admin account itself | Every returned user is rendered regardless of role — the screen applies no role filter of its own |
| admin-panel-ui.QT11 | AC5 | Create-user form submitted for a username that already exists, differing only in case (e.g. `jdoe` vs `JDoe`) | Same recurring, still-unresolved project-wide ambiguity already flagged in multiple other specs' `test_cases.md` files (no project-wide case-sensitivity rule exists) — see Open QA Questions below rather than re-litigated per-spec |
| admin-panel-ui.QT12 | AC6 | Department create/edit form submitted for a name that already exists, differing only in case | Same recurring case-sensitivity ambiguity as `QT11` — see Open QA Questions |
| admin-panel-ui.QT13 | AC6 | Department list rendered against `API04` returning an empty array | An explicit empty-state message is rendered |
| admin-panel-ui.QT14 | AC7 | Job Role create/edit form submitted for a title that already exists | The API's own error code is `"name_exists"`, not `"title_exists"` — already flagged as a spec-clarification candidate in `org-structure-management`'s own Active Specs note; this screen must display whatever code the API actually returns, not assume a name matching the entity |
| admin-panel-ui.QT15 | AC7 | Job Role list rendered against `API09` returning an empty array | An explicit empty-state message is rendered |
| admin-panel-ui.QT16 | AC8 | Each of the 6 non-Admin roles (Employee, Manager, HR, Payroll, IT, Facilities) individually attempts to deep-link directly into an Admin Panel URL | Full 6-role sweep, redirected every time — the spec's own `UT08` only demonstrates Employee; this expands it to every role, per this project's established "full role-matrix sweep, not just the spec's single example" convention |
| admin-panel-ui.QT17 | AC8 | A stored token whose `role` claim is missing or unparseable (a corrupted/tampered value) | Treated the same as a non-Admin role — redirected, not a crash |
| admin-panel-ui.QT18 | AC9 | No session present, a deep link directly to a nested route (e.g. `/transfer-requests/[id]`, not just a top-level screen) is requested | Redirected to Login — the guard applies to every route under this panel, not only its top-level entry points |
| admin-panel-ui.QT19 | AC9 | A stored session value that is present but unparseable/corrupted (e.g. invalid JSON in `localStorage`) | Treated the same as "no session" — redirected to Login, not a crash |
| admin-panel-ui.QT20 | AC10 | Stored `expiresAt` exactly equal to the current time at the moment of an API call (the boundary instant, not clearly before or after) | See Open QA Questions — the spec doesn't state whether the boundary instant itself counts as expired |
| admin-panel-ui.QT21 | AC10 | Session force-logged-out in one browser tab while a second tab of the same panel is open | See Open QA Questions — cross-tab session consistency is not addressed anywhere in the spec |
| admin-panel-ui.QT22 | AC11 | Logout clicked while a mutation (e.g. a save) is still in flight | See Open QA Questions — whether the in-flight request is cancelled or allowed to complete first isn't specified |

## Open QA Questions
| Question | Raised by | Routes back to |
|---|---|---|
| Should a `reason`-less `Department`/request field render as blank, an explicit "N/A", or an omitted row, where the underlying field is optional at the API level? | `QT07`-adjacent (AC3's `reason` field) | `admin-panel-ui.spec.md` — a rendering-contract clarification, not a behavior bug |
| Should the create/edit-user form validate required fields client-side before submission, or rely entirely on the API's 400 (per `AC5`, which only requires surfacing a 4xx, not preventing the call)? | AC4/AC5 | `admin-panel-ui.spec.md` |
| Should the Edit User form's role selector exclude "Admin" as an option, given `user-management-console`'s own tracked, still-open gap that `PATCH /users/{id}` accepts `role: "Admin"` with no server-side guard? | AC5 | `admin-panel-ui.spec.md`, cross-referencing `user-management-console.tasks.md`'s Open Items |
| Should the Department/Job Role delete action show any special warning when the target is referenced by an in-flight or historical transfer request, given `org-structure-management`'s own BRD-004 leaves this referential-integrity behavior undecided at the API level? | AC6/AC7 | `admin-panel-ui.spec.md`, cross-referencing `org-structure-management`'s still-open BRD-004 item |
| Is a stored `expiresAt` exactly equal to "now" (the boundary instant) treated as expired or not-yet-expired? | `QT20` | `stakeholder-panel-ui.spec.md` (`AC2b` owns this mechanism; `admin-panel-ui` only consumes it) |
| Does a force-logout in one browser tab propagate to other open tabs of the same panel, or does each tab only discover expiry on its own next API call? | `QT21` | `stakeholder-panel-ui.spec.md` (`AC2b`) |
| Does clicking Logout cancel any in-flight mutation, or let it complete before clearing the session? | `QT22` | `stakeholder-panel-ui.spec.md` (`AC11`) |
