# Plan: User Management Console

## Derived From
.ai-context/specs/user-management-console.spec.md (Status: Approved)

## Architecture Approach

- **User Management Service** (existing module, `architecture.md`) — this plan's sole home; owns the `Users` collection end to end (the authoritative schema `rbac-api-security.plan.md` and `internal-transfer-workflow.plan.md` both asserted a minimal read-contract against).
- **No new module is introduced.** Authorization is enforced by the existing Auth/RBAC middleware for every endpoint except `API06` (already flagged as the one deliberate exception in `rbac-api-security.plan.md`'s Sequencing).
- `managerId` validation (`API01`/`AC11`) is a direct Mongoose query against this same `Users` collection (self-referencing), not a call to another service.

## Data Model

**`Users` collection** — the authoritative schema. Consolidates every field asserted by other plans' read-contracts (`rbac-api-security`: `username`, `passwordHash`, `role`, `deletedAt`; `internal-transfer-workflow`: `dateOfJoining`, `managerId`) plus this spec's own fields — confirmed no conflicts across all three plans.

| Field | Type | Notes |
|---|---|---|
| `username` | String, unique, indexed | |
| `passwordHash` | String | Never the raw password — see hashing decision below |
| `role` | String enum: `Employee \| HR \| Manager \| Payroll \| IT \| Facilities \| Admin` | **Schema-level enum includes all 7 values**, even though `API01`'s own input validation only accepts the 6 non-Admin values (`AC6`) — `Admin` is only ever set via `API06`. This distinction (schema enum vs. endpoint-accepted values) is stated explicitly so a future reader doesn't assume they must match. |
| `dateOfJoining` | Date, required | Read by `internal-transfer-workflow.API04`'s eligibility check |
| `managerId` | ObjectId (ref `Users`, self-referencing), required if `role: "Employee"` | Read by `internal-transfer-workflow.API03` (Manager routing, snapshotted there per that plan's own decision) |
| `deletedAt` | Date, optional/null | Soft delete — read by `rbac-api-security.API02`'s login check |

**`managerId` existence/role validation is application-layer, not a Mongoose ref-integrity guarantee** — Mongoose `ref` does not enforce that the referenced document exists or has a particular `role`. `API01`'s 404 (`AC11`) is an explicit query (`Users.findOne({ _id: managerId, role: "Manager" })`) in the route handler, documented here per `int-standards.nextjs.md`'s Database Layer guidance rather than left implicit.

**Decision — at-most-one-Admin is enforced at the database level, not just application logic:** a partial unique index on `{ role: "Admin", deletedAt: null }` guarantees `AC15`'s invariant even under concurrent `API06` calls — an application-layer "count then insert" check alone has a race condition window two simultaneous requests could both pass. This is a plan-level engineering decision the spec doesn't dictate, made explicit here rather than left for implementation to discover the race condition itself.

**Decision — password hashing: bcrypt.** `rbac-api-security.plan.md` explicitly deferred this choice *to* this plan (it owns the `Users` write path), so it cannot be deferred further. Chosen over argon2 for this application: bcrypt is a long-established, widely-audited Node.js dependency with prebuilt binaries (no complex native-toolchain deployment risk), and this is an internal HR system, not a high-value public target where argon2's marginally stronger guarantees would be decisive. Salt rounds: 12 — a plan-level security-engineering number, stated explicitly rather than invented silently, same pattern as `rbac-api-security.plan.md`'s rate-limit threshold.

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first for every endpoint/state-changing op (Testing Discipline) | ✓ | All 6 endpoints get Red tests before implementation. |
| Jest + RTL (Testing Discipline) | ✓ | Backend-only plan; Jest covers it. RTL is N/A — no UI component is built by this plan. |
| Mongoose schema validators tested (Testing Discipline) | ✓ | The `username` unique index, `role` enum, and the partial unique Admin index are all tested directly. |
| Coverage floor (Testing Discipline) | ✓ | constitution.md states none is set yet; this plan doesn't invent one. |
| No PII/personal data in logs (Security Posture) | ✓ | Passwords and password hashes are never logged, per the spec's own Non-Functional Constraints; only `username`/`role` appear in audit-relevant logging. |
| Role-based authorization enforced server-side (Security Posture) | ✓ | Delegated to the existing middleware for `API01`–`API05`; `API06` is the one documented, self-limiting exception. |
| MongoDB sole datastore (Architectural Constraints) | ✓ | `Users` is an existing collection (already referenced by other plans); no new datastore. |
| No client-supplied object into a Mongoose filter unvalidated (Security Posture) | ✓ | Every lookup is a typed, single-field query (`username`, `id`, `managerId`) — never a spread of raw request-body content into a filter. |
| Secrets via env vars only (Security Posture) | N/A | No new secret is introduced by this plan (the JWT signing secret belongs to `rbac-api-security`). |
| No new datastore/state lib/external integration without ADR (Architectural Constraints) | ✓ | None introduced; the partial unique index is a standard MongoDB feature, not a new datastore. |
| No numeric latency/availability/RPO/RTO targets invented (Non-Functional Baselines) | ✓ | None stated in constitution.md; none invented here. |

**Rate limit decisions:**
- `API01`–`API05`: Rate limit: **none, deferred** — authenticated, role-gated (Admin or HR) administrative actions, not a public-facing surface.
- `API06` (`POST /admin/self-register`): Rate limit: **5 requests per IP per hour.** Unlike the other five, this endpoint is genuinely unauthenticated and publicly reachable (by design, to bootstrap the system). It can only ever succeed once (enforced at the database level, above), so this isn't a credential-guessing concern — but it's still worth a modest limit as defense-in-depth against abuse/DoS attempts on the one open surface in this spec. Distinct justification from the other five, stated explicitly rather than lumped into the same blanket "none."

## Explicitly Deferred

- Whether HR is authorized to register/view/edit/delete HR, Manager, Payroll, IT, or Facilities users — per spec's Explicitly Out of Scope, still unresolved; this plan implements the Employee-only HR scope exactly as decided, nothing broader.
- Whether an Admin can delete their own account — per spec's Explicitly Out of Scope; this plan places no special guard on it either way (an Admin deleting themselves would return the system to zero Admins and re-enable `API06`, per the spec's own note).
- Whether a user profile needs an organizational Department/BU or Job Role/Position assignment — per spec's Explicitly Out of Scope; not built here.
- Bulk user import/export — per spec, out of scope.

## Sequencing

1. `Users` Mongoose schema — all fields per the Data Model above, including the `username` unique index and the `{ role: "Admin", deletedAt: null }` partial unique index.
2. Password hashing utility (bcrypt, 12 salt rounds) — wired into every write path that sets `passwordHash` (`API01` and `API06`).
3. `POST /users` (`API01`) — registration, with Admin/HR-vs-Employee authority scoping, `dateOfJoining` requirement, and `managerId` existence/role validation.
4. `PATCH /users/{id}` (`API02`), `DELETE /users/{id}` (`API03`) — edit and soft-delete, Admin-any / HR-Employee-only scoping.
5. `GET /users` (`API04`), `GET /users/{id}` (`API05`) — list and detail views, same Admin/HR scoping.
6. `POST /admin/self-register` (`API06`) — unauthenticated bootstrap endpoint, excluded from the RBAC middleware (per `rbac-api-security.plan.md`'s Sequencing step 6), its own dedicated rate limit, single-Admin invariant enforced by the database-level index from step 1.
7. `GET /users` (`API04`) `role=Manager` carve-out for HR — per `AC13`'s 2026-09-20 amendment, added after discovering `stakeholder-panel-ui.T11`'s already-approved Manager-selector requirement was otherwise impossible for an HR caller to satisfy. Additive only: HR's existing default (no `role` param) behavior is unchanged; Admin is unaffected.
