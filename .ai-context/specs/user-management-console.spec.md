# Spec: User Management Console

## Spec ID
user-management-console

## Status
In QA
*(Reopened `In QA` → `In Development` → `In QA` 2026-09-20 via `T07`, implementing `AC13`'s amendment. All 7 tasks now Merged.)*

## Linked BRD
.ai-context/BRD.md#BRD-003

## Intent
Admin and HR need a centralized console to create, edit, view, and remove user accounts across the six workflow-participant roles (Employee, HR, Manager, Payroll, IT, Facilities), since every workflow and administrative action in this system is gated by an authenticated, role-tagged user record. Only Admin and HR may register a new Employee; HR additionally has full add/view/edit/delete authority over Employee records specifically. Every user, regardless of role, must have a unique username, a password, and a role assignment before they can authenticate against `rbac-api-security`. Registering an Employee additionally requires a date of joining (used by `internal-transfer-workflow`'s HR eligibility check) and their current manager (used to route Manager approval). Exactly one Admin account exists in the system, created via a one-time, unauthenticated self-registration path rather than through this console's normal registration flow.

## Context
- Builds on: .ai-context/architecture.md (User Management Service module)
- Related: .ai-context/specs/rbac-api-security.spec.md (Status: Plan Drafted, past Approved) — every endpoint here except `API06` is gated by that spec's authorization contract (`rbac-api-security.API01`, `AC2`, `AC9`). The credentials this spec creates (`username`, a hashed `password`) are exactly the minimal read-contract `rbac-api-security.plan.md` asserted it needs (`username`, `passwordHash`, `role`) — confirmed consistent, not re-decided here.
- Non-blocking note: if a user profile is later found to need an organizational Department/BU or Job Role/Position assignment (`org-structure-management`), this spec would need revision at that point (see Explicitly Out of Scope) — this is a speculative future possibility, not a current dependency, and does not block this spec's plan.
- Non-blocking note (forward direction — `internal-transfer-workflow` depends on this spec, not the reverse): this spec's `dateOfJoining` and `managerId` fields (below) resolve that spec's previously-flagged eligibility-date and Manager-assignment gaps.
- Security note: `API06` (Admin self-registration) is deliberately unauthenticated — the one exception to `rbac-api-security.API01`'s "every protected endpoint" rule, since it exists specifically to bootstrap the first and only Admin account before any authenticated user exists. It is self-limiting (409 once an Admin already exists), not a general unauthenticated surface.
- API contract (if consuming an external one): None.

## API Contract

### user-management-console.API01 — POST /users (register a user)
**Request payload:**
```json
{
  "username": "string",
  "password": "string",
  "role": "Employee | HR | Manager | Payroll | IT | Facilities",
  "dateOfJoining": "string (ISO date, required)",
  "managerId": "string (required if role=Employee; not applicable otherwise)"
}
```
**Success response (201):**
```json
{ "id": "string", "username": "string", "role": "string", "dateOfJoining": "string", "managerId": "string | null" }
```
**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 400 | Missing/invalid `username`, `password`, `dateOfJoining`, or `role` outside the six defined values; or `managerId` missing when `role: "Employee"` | `{ "error": "validation_error", "fields": ["string"] }` |
| 403 | Registering role=Employee from any role other than Admin or HR; registering role∈{HR,Manager,Payroll,IT,Facilities} from any role other than Admin | `{ "error": { "code": "FORBIDDEN", "message": "string" } }` (per `rbac-api-security.API01`) |
| 404 | `managerId` does not reference an existing user with role Manager | `{ "error": "manager_not_found" }` |
| 409 | `username` already exists | `{ "error": "username_exists" }` |

### user-management-console.API02 — PATCH /users/{id} (edit a user)
**Request payload:** `{ "role": "string" }` and/or other account fields defined by this spec only (username/role) — see Explicitly Out of Scope for fields not decided.
**Success response (200):** `{ "id": "string", "username": "string", "role": "string" }`
**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 403 | Requested by any role other than Admin | `{ "error": { "code": "FORBIDDEN", "message": "string" } }` |
| 404 | `id` does not match an existing user | `{ "error": "not_found" }` |

### user-management-console.API03 — DELETE /users/{id} (remove a user)
**Storage semantic (decided):** Soft delete — sets `deletedAt` to the current timestamp. No record is ever physically removed, consistent with `transfer-audit-trail`'s immutability principle. A deleted user cannot authenticate and does not appear in the active list (`API04`).
**Success response (200):** `{ "id": "string" }`
**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 403 | Requested by any role other than Admin, or by HR for a non-Employee user | `{ "error": { "code": "FORBIDDEN", "message": "string" } }` |
| 404 | `id` does not match an existing, non-deleted user | `{ "error": "not_found" }` |

### user-management-console.API04 — GET /users (list view)
**Query parameter:** optional `role`. Ignored for Admin (already sees all six roles, unfiltered). For HR, only the exact value `Manager` is permitted (`AC13`'s carve-out); no `role` param at all keeps HR's existing default (Employee-role records only).
**Success response (200):** `[{ "id": "string", "username": "string", "role": "string" }]` — excludes deleted (`deletedAt` set) users. Admin sees all six roles; HR sees Employee-role records only by default, or Manager-role records only when `?role=Manager` is explicitly supplied.
**Exceptions:** 403 if requested by any role other than Admin or HR; 400 (`{ "error": "validation_error", "fields": ["role"] }`) if HR supplies a `role` value other than `Manager`.

### user-management-console.API05 — GET /users/{id} (detailed profile view)
**Success response (200):** `{ "id": "string", "username": "string", "role": "string", "dateOfJoining": "string", "managerId": "string | null" }` — additional profile fields beyond these are not decided (see Explicitly Out of Scope).
**Exceptions:** 403 if requested by any role other than Admin, or by HR for a non-Employee user; 404 if `id` doesn't exist or is deleted.

### user-management-console.API06 — POST /admin/self-register (bootstrap the single Admin account)
**Request payload:** `{ "username": "string", "password": "string" }`
**Success response (201):** `{ "id": "string", "username": "string", "role": "Admin" }`
**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 400 | Missing/invalid `username` or `password` | `{ "error": "validation_error", "fields": ["string"] }` |
| 409 | An Admin account already exists | `{ "error": "admin_already_exists" }` |

This endpoint is deliberately unauthenticated (see Context) and succeeds exactly once, ever.

## Acceptance Criteria
1. user-management-console.AC1 — Given an Admin or HR user, when they submit a valid registration for a new Employee (`username`, `password`, `role: "Employee"`, `dateOfJoining`, and `managerId` referencing an existing Manager), then the system creates the user record and responds 201.
2. user-management-console.AC2 — Given a user with any role other than Admin or HR, when they attempt to register a new Employee user, then the system rejects the request with 403.
3. user-management-console.AC3 — Given an Admin user, when they submit a valid registration for a new HR, Manager, Payroll, IT, or Facilities user, then the system creates the user record and responds 201 (per `rbac-api-security.AC9`'s general user-management grant to Admin).
4. user-management-console.AC4 — Given a user with role Employee, Manager, Payroll, IT, or Facilities, when they attempt to register a new HR, Manager, Payroll, IT, or Facilities user, then the system rejects the request with 403. *(HR's authority to register these five roles is explicitly not covered by this AC — see Explicitly Out of Scope.)*
5. user-management-console.AC5 — Given a registration request whose `username` already exists, then the system responds 409 and does not create a duplicate record.
6. user-management-console.AC6 — Given a registration request missing `username`/`password`/`dateOfJoining`, specifying a `role` outside the six defined values, or (for `role: "Employee"`) missing `managerId`, then the system responds 400 naming the invalid field(s).
7. user-management-console.AC7 — Given an Admin, when they edit an existing user's account fields, then the system updates the record and responds 200.
8. user-management-console.AC8 — Given an Admin, when they delete a user record, then the record is marked deleted (`deletedAt` set) — it can no longer authenticate via `rbac-api-security.API02` and no longer appears in the active list (`API04`).
9. user-management-console.AC9 — Given an Admin, when they request the list view, then the system returns every non-deleted user's `id`, `username`, and `role`.
10. user-management-console.AC10 — Given an Admin, when they request a specific user's detailed profile view, then the system returns that user's `id`, `username`, `role`, `dateOfJoining`, and `managerId`.
11. user-management-console.AC11 — Given a registration request for `role: "Employee"` whose `managerId` does not reference an existing user with role Manager, then the system responds 404.
12. user-management-console.AC12 — Given HR, when they view, edit, or delete an existing Employee-role record, then the system permits the action, identically to Admin's authority over that record.
13. user-management-console.AC13 — Given HR, when they attempt to view, edit, or delete a non-Employee user record (HR/Manager/Payroll/IT/Facilities), then the system rejects the request with 403 — **except** when HR requests the list view (`API04`) with an explicit `role=Manager` filter, which returns Manager records in the endpoint's existing minimal shape (`id`/`username`/`role`, no additional profile fields), solely to populate a Manager-selector control (e.g. `stakeholder-panel-ui.AC9`'s final-mapping selector); a `role` filter value other than `Manager` from HR is still rejected, and no other non-Employee endpoint or role is affected by this carve-out.
    *(Amended 2026-09-20 — the original wording made it impossible for HR to ever retrieve a Manager record, which directly blocked `stakeholder-panel-ui.T11`'s already-approved Manager-selector requirement (itself sourced from this same `API04`, per that spec's own Consumed table). The carve-out is deliberately narrow: filtered list only, `Manager` role only, no new fields exposed beyond the shape `API04` already returns to Admin, and no `API05` detail-view access granted — HR still cannot view a specific Manager's full profile. Gate 1 re-confirmed 2026-09-20 — see `gate-reviews/gate1-review-user-management-console.md`.)*
14. user-management-console.AC14 — Given no Admin account currently exists in the system, when an unauthenticated request registers the first Admin via `POST /admin/self-register`, then the system creates that Admin account and responds 201.
15. user-management-console.AC15 — Given an Admin account already exists, when `POST /admin/self-register` is called again, then the system rejects it with 409 and does not create a second Admin account.

## Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| user-management-console.UT01 | AC1 | Admin registers a new Employee with valid credentials | 201; user created |
| user-management-console.UT02 | AC1 | HR registers a new Employee with valid credentials | 201; user created |
| user-management-console.UT03 | AC2 | Manager attempts to register a new Employee | 403 |
| user-management-console.UT04 | AC3 | Admin registers a new Payroll user | 201; user created |
| user-management-console.UT05 | AC4 | Employee attempts to register a new IT user | 403 |
| user-management-console.UT06 | AC5 | Registration submitted with a `username` that already exists | 409; no duplicate created |
| user-management-console.UT07 | AC6 | Registration submitted missing `password` | 400; `fields: ["password"]` |
| user-management-console.UT08 | AC6 | Registration submitted with `role: "Manager-ish"` (invalid value) | 400; `fields: ["role"]` |
| user-management-console.UT09 | AC7 | Admin edits a Manager's role to HR | 200; record updated |
| user-management-console.UT10 | AC8 | Admin deletes a user; deleted user then attempts login | Delete: 200. Login: 401 (per `rbac-api-security.AC1`) |
| user-management-console.UT11 | AC9 | Admin requests the user list | 200; all users returned |
| user-management-console.UT12 | AC10 | Admin requests a specific user's detail view | 200; that user's fields returned |
| user-management-console.UT13 | AC11 | Employee registration submitted with a `managerId` that doesn't exist | 404; `{ "error": "manager_not_found" }` |
| user-management-console.UT14 | AC12 | HR edits an Employee's `managerId` | 200; record updated |
| user-management-console.UT15 | AC12 | HR deletes an Employee record | 200; `deletedAt` set |
| user-management-console.UT16 | AC13 | HR attempts to view a Manager-role record | 403 |
| user-management-console.UT16a | AC13 | HR requests the list view with `?role=Manager` | 200; only Manager-role records returned |
| user-management-console.UT16b | AC13 | HR requests the list view with `?role=HR` (or any value other than `Manager`) | 400; `fields: ["role"]` |
| user-management-console.UT17 | AC14 | First self-registration call, no Admin exists yet | 201; Admin account created |
| user-management-console.UT18 | AC15 | Second self-registration call, after an Admin already exists | 409; `{ "error": "admin_already_exists" }` |

## Explicitly Out of Scope
- External identity/LDAP integration for user provisioning (BRD-003 Decided; SOW §9 Assumptions).
- Whether a user profile includes an organizational Department/BU or Job Role/Position assignment, as distinct from the six system roles used for access control — not stated anywhere in the SOW or BRD-003. If needed, this is a future integration point with `org-structure-management`, not decided here. (Distinct from `dateOfJoining`/`managerId`, which are decided and in scope.)
- Whether HR is authorized to register HR, Manager, Payroll, IT, or Facilities users (as opposed to only Employees) — BRD-003's original open item, still unresolved (`AC4` explicitly excludes HR from its scope for this reason).
- Bulk user import/export — not mentioned anywhere in the SOW.
- Password hashing implementation (e.g., bcrypt vs. argon2) — a plan-stage detail, consistent with how `rbac-api-security.plan.md` handled the same question.
- Whether an Admin is permitted to delete their own account via `API03` — not stated anywhere in the SOW. Doing so would return the system to zero Admins, making `API06` available again; this spec doesn't decide whether self-deletion should be allowed or blocked.

## Non-Functional Constraints (from constitution.md)
- Role-based authorization is enforced server-side for every endpoint in this spec except `API06`, via `rbac-api-security`'s contract — not re-implemented here (Security Posture). `API06` is the one deliberate, self-limiting exception (see Context).
- Deleted users are soft-deleted (`deletedAt`) — records are never physically removed, consistent with `transfer-audit-trail`'s immutability principle (Security Posture).
- No employee personal data (username, role) may appear in logs beyond what's necessary for audit purposes; passwords/password hashes are never logged (Security Posture).
- MongoDB is the sole approved datastore; no client-supplied object may be passed unvalidated into a Mongoose query filter (Security Posture / Architectural Constraints).
- No external identity/system integration in this phase (Security Posture).
- constitution.md states no numeric coverage floor and no numeric latency/availability targets exist yet — this spec does not invent one (Non-Functional Baselines).
