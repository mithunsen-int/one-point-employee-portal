# Task: user-management-console.T07

**Implements:** `user-management-console.T07` — `GET /users` (`API04`) `role=Manager` carve-out for HR.

**Acceptance:** `user-management-console.AC13` (amended 2026-09-20). API Contract: `user-management-console.spec.md`'s `API04`.

**Origin:** this task did not exist when the spec first reached `In QA`. It was added while auditing `stakeholder-panel-ui.T07`–`T11`'s remaining blockers: `T11`'s own already-approved scope (`stakeholder-panel-ui.plan.md`, `T11`'s prompt file) requires a Manager selector populated from `API04` filtered to `role: "Manager"`, but the real implementation hardcodes `{ role: "Employee" }` for every HR caller regardless of any query parameter — HR could never retrieve a single Manager record through this endpoint. `AC13` was amended to carve out this one narrow case.

**Scope — build only this:**
- In `src/app/api/users/route.ts`'s `GET` handler, read an optional `role` query parameter (`request.nextUrl.searchParams.get("role")`).
- Admin's behavior is completely unaffected — still returns all six roles regardless of this parameter.
- For HR:
  - No `role` param → unchanged existing behavior (`{ role: "Employee", deletedAt: null }`).
  - `role=Manager` exactly → `{ role: "Manager", deletedAt: null }`, returning the endpoint's existing minimal shape (`id`/`username`/`role`) — no new fields.
  - Any other `role` value → `400 { "error": "validation_error", "fields": ["role"] }`. Do not silently ignore an invalid value and fall back to the default list — that would mask a client bug and isn't what `AC13`'s amendment describes.

**Do not touch:**
- `API05` (`GET /users/{id}`) — HR still cannot view a specific non-Employee record's detail. This task only widens the list endpoint's one narrow filtered case.
- `API02`/`API03` (edit/delete) — untouched, still Admin-any/HR-Employee-only.
- Admin's own unfiltered list behavior.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for user-management-console.T07` has produced Red tests for it, confirmed failing for the right reason. At minimum: HR with `?role=Manager` gets 200 with only Manager records (`UT16a`); HR with `?role=HR` (or any other non-`Manager` value) gets 400 naming `role` (`UT16b`); HR with no `role` param still gets the existing Employee-only behavior (regression check against the existing test); Admin's unfiltered response is unaffected regardless of any `role` param passed.
