# Spec: Organizational Structure Management

## Spec ID

org-structure-management

## Status

In QA

## Linked BRD

.ai-context/BRD.md#BRD-004

## Intent

Admin needs to maintain two organizational taxonomies — Departments/Business Units and Job Roles/Positions — since these are exactly the values an employee selects as the destination of a transfer request. Both are database-backed CRUD entities, explicitly distinct from the codebase-defined application constants owned by `application-constants-management` (BRD-005) and from the system access-control Role (Employee/HR/Manager/Payroll/IT/Facilities) owned by `rbac-api-security`/`user-management-console` — this spec's "Job Role" always means an organizational job title/position, never the access-control role.

## Context

- Builds on: .ai-context/architecture.md (Org Structure Service module)
- Related: .ai-context/specs/rbac-api-security.spec.md (Status: Plan Drafted, past Approved) — every endpoint here is gated by that spec's authorization contract; per `rbac-api-security.AC9`, only Admin may perform "department/role management" actions, which this spec resolves as Admin-only for both Departments/BUs and Job Roles.
- Non-blocking contrast note (no functional dependency either way): .ai-context/specs/application-constants-management.spec.md — Departments/BUs and Job Roles are explicitly the two entities _excluded_ from that feature's codebase-defined-constants approach. Neither spec's implementation depends on the other; the two should just be read together to avoid the two reference-data-management approaches being conflated.
- Related (forward, not yet drafted): `internal-transfer-workflow.spec.md` — will consume these two entities as selectable values on the transfer request form.
- API contract (if consuming an external one): None.

## API Contract

### org-structure-management.API01 — POST /departments (create)

**Request payload:** `{ "name": "string" }`
**Success response (201):** `{ "id": "string", "name": "string" }`
**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 400 | Missing/empty `name` | `{ "error": "validation_error", "fields": ["name"] }` |
| 403 | Requested by any role other than Admin | `{ "error": { "code": "FORBIDDEN", "message": "string" } }` |
| 409 | `name` already exists | `{ "error": "name_exists" }` |

### org-structure-management.API02 — PATCH /departments/{id} (edit)

**Request payload:** `{ "name": "string" }`
**Success response (200):** `{ "id": "string", "name": "string" }`
**Exceptions:** 400 (validation), 403 (non-Admin), 404 (`id` not found), 409 (`name` collides with another record) — same shapes as API01.

### org-structure-management.API03 — DELETE /departments/{id} (remove)

**Status:** Contract fixed (200 on success, 403/404 below); the effect on a transfer request that already references this Department/BU (in-flight or historical) is **not yet set** — see Explicitly Out of Scope. This spec only fixes that the deleted record no longer appears in the list view (API04).
**Success response (200):** `{ "id": "string" }`
**Exceptions:** 403 (non-Admin), 404 (`id` not found).

### org-structure-management.API04 — GET /departments (list view)

**Success response (200):** `[{ "id": "string", "name": "string" }]`
**Exceptions:** 403 (non-Admin).

### org-structure-management.API05 — GET /departments/{id} (detailed view)

**Status:** Not yet set — deferred. SOW marks this view as "Optional" (§3.1.A.3) without stating who decides or whether it's needed this phase. Not committed to in this draft.

### org-structure-management.API06 — POST /job-roles (create)

**Request payload:** `{ "title": "string" }`
**Success response (201):** `{ "id": "string", "title": "string" }`
**Exceptions:** identical shapes to API01, substituting `title` for `name` (400 validation, 403 non-Admin, 409 `title` exists).

### org-structure-management.API07 — PATCH /job-roles/{id} (edit)

Identical contract to API02, substituting `title` for `name`.

### org-structure-management.API08 — DELETE /job-roles/{id} (remove)

**Status:** Same as API03 — contract fixed, referential effect on transfer requests not yet set.

### org-structure-management.API09 — GET /job-roles (list view)

Identical contract to API04, substituting `title` for `name`.

### org-structure-management.API10 — GET /job-roles/{id} (detailed view)

**Status:** Not yet set — deferred, same reasoning as API05 (SOW §3.1.A.4 marks this "Optional").

## Acceptance Criteria

1. org-structure-management.AC1 — Given an Admin, when they create a Department/BU with a valid, non-duplicate `name`, then the system creates the record and responds 201.
2. org-structure-management.AC2 — Given a user with any role other than Admin, when they attempt to create, edit, or delete a Department/BU, then the system rejects the request with 403.
3. org-structure-management.AC3 — Given an Admin, when they submit a Department/BU `name` that already exists, then the system responds 409 and does not create a duplicate.
4. org-structure-management.AC4 — Given an Admin, when they edit an existing Department/BU's `name`, then the system updates the record and responds 200.
5. org-structure-management.AC5 — Given an Admin, when they delete a Department/BU, then the record no longer appears in the list view. _(Effect on transfer requests referencing it is not decided — see Explicitly Out of Scope.)_
6. org-structure-management.AC6 — Given an Admin, when they request the Department/BU list view, then the system returns all records.
7. org-structure-management.AC7 — Given an Admin, when they create a Job Role with a valid, non-duplicate `title`, then the system creates the record and responds 201.
8. org-structure-management.AC8 — Given a user with any role other than Admin, when they attempt to create, edit, or delete a Job Role, then the system rejects the request with 403.
9. org-structure-management.AC9 — Given an Admin, when they submit a Job Role `title` that already exists, then the system responds 409 and does not create a duplicate.
10. org-structure-management.AC10 — Given an Admin, when they edit an existing Job Role's `title`, then the system updates the record and responds 200.
11. org-structure-management.AC11 — Given an Admin, when they delete a Job Role, then the record no longer appears in the list view. _(Effect on transfer requests referencing it is not decided — see Explicitly Out of Scope.)_
12. org-structure-management.AC12 — Given an Admin, when they request the Job Role list view, then the system returns all records.
13. org-structure-management.AC13 — Given a create request (Department/BU or Job Role) missing the required `name`/`title` field, then the system responds 400 naming the missing field.

## Unit Test Cases (spec-derived)

| Test ID                       | Maps to AC | Scenario                                                   | Expected                          |
| ----------------------------- | ---------- | ---------------------------------------------------------- | --------------------------------- |
| org-structure-management.UT01 | AC1        | Admin creates a Department with a valid name               | 201; record created               |
| org-structure-management.UT02 | AC2        | Manager attempts to create a Department                    | 403                               |
| org-structure-management.UT03 | AC3        | Admin creates a Department with a name that already exists | 409; no duplicate                 |
| org-structure-management.UT04 | AC4        | Admin edits a Department's name                            | 200; record updated               |
| org-structure-management.UT05 | AC5        | Admin deletes a Department                                 | 200; record absent from list view |
| org-structure-management.UT06 | AC6        | Admin requests the Department list                         | 200; all records returned         |
| org-structure-management.UT07 | AC7        | Admin creates a Job Role with a valid title                | 201; record created               |
| org-structure-management.UT08 | AC8        | Employee attempts to create a Job Role                     | 403                               |
| org-structure-management.UT09 | AC9        | Admin creates a Job Role with a title that already exists  | 409; no duplicate                 |
| org-structure-management.UT10 | AC10       | Admin edits a Job Role's title                             | 200; record updated               |
| org-structure-management.UT11 | AC11       | Admin deletes a Job Role                                   | 200; record absent from list view |
| org-structure-management.UT12 | AC12       | Admin requests the Job Role list                           | 200; all records returned         |
| org-structure-management.UT13 | AC13       | Admin submits a Department create request with no `name`   | 400; `fields: ["name"]`           |

## Explicitly Out of Scope

- Codebase-defined application constants management — Departments/BUs and Job Roles are explicitly the exception to that approach (BRD-004 Decided; see `application-constants-management`).
- Detailed view (API05, API10) for either entity — SOW marks this "Optional" without deciding it; not committed to in this draft (not decided either way, not a firm exclusion).
- The effect of deleting a Department/BU or Job Role that an in-flight or historical transfer request already references — not stated anywhere in the SOW or BRD-004. This spec's Delete contract (API03/API08) fixes only the CRUD-level behavior, not referential integrity with `internal-transfer-workflow`.
- Reporting/analytics on organizational structure — out of scope project-wide (BRD Coverage Note).
- Bulk import/export of Departments or Job Roles — not mentioned anywhere in the SOW.

## Non-Functional Constraints (from constitution.md)

- Role-based authorization is enforced server-side for every endpoint in this spec (Admin only), via `rbac-api-security`'s contract — not re-implemented here (Security Posture).
- MongoDB is the sole approved datastore; no client-supplied object may be passed unvalidated into a Mongoose query filter (Security Posture / Architectural Constraints).
- Departments/BUs and Job Roles are DB-backed CRUD entities, per constitution.md's Architectural Constraints — a plan may not move either into the codebase-defined constants approach.
- constitution.md states no numeric coverage floor and no numeric latency/availability targets exist yet — this spec does not invent one (Non-Functional Baselines).
