# Plan: Role-Based Access Control and API Security

## Derived From
.ai-context/specs/rbac-api-security.spec.md (Status: Approved)

## Architecture Approach

- **Auth/RBAC Service** (existing module, `architecture.md`) — this plan's sole home. Implements:
  - JWT issuance/verification (new logic in this module; no new module introduced).
  - Cross-cutting authorization middleware applied to every protected Next.js API route (`rbac-api-security.API01`).
- **Data Layer** (existing module) — read-only consumer relationship only; see Data Model below for the cross-plan dependency this creates.
- **No new module is introduced.** No frontend UI is built by this plan — `rbac-api-security.spec.md` defines an API contract only; a login *screen* (if one is needed) belongs to whichever Admin/Stakeholder Panel spec eventually renders it, and must consume `API02` as defined here rather than re-deriving its own contract.

## Data Model

- **No new MongoDB collection is introduced by this plan.** JWT is stateless per `ADR-0001-jwt-authentication.md` — no session/token store is needed.
- **Role-permission matrix (AC3–AC9) is code/config-defined, not database-defined.** The six roles plus Admin are fixed by the SOW, not user-configurable, so a DB-backed permission table would be unjustified complexity — this is a plan-level decision, not left for implementation to invent silently.
- **Cross-plan dependency — not resolved by this plan:** `POST /auth/login` (API02) must validate `username`/`password` against a `Users` collection and read a `role` field to embed in the issued token. That collection's authoritative schema belongs to `user-management-console.spec.md` (BRD-003, now Approved). This plan asserts the minimal read-contract it requires, confirmed consistent with `user-management-console.spec.md`'s `API01` payload:
  - `username` — unique, indexed
  - `passwordHash` — never the raw password
  - `role` — one of the six roles + Admin
  - `deletedAt` — must be absent/null for login to succeed; a soft-deleted user (per `user-management-console.API03`/`AC8`) is rejected with the same 401 as a wrong password, not a distinct error code (avoids leaking account-existence/deletion state)
- **Exception to the middleware's blanket coverage:** `user-management-console.API06` (`POST /admin/self-register`) is deliberately unauthenticated by that spec's own design, to bootstrap the system's single Admin account. The middleware built in Sequencing step 6 below must explicitly exclude this one route rather than wiring it in like every other endpoint.

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first for every API endpoint/state-changing op (Testing Discipline) | ✓ | Tasks generated from this plan will each get Red tests before implementation, per the standing project flow. |
| Jest + RTL (Testing Discipline) | ✓ | Backend-only plan (login + middleware) — Jest covers it; RTL is N/A here since no UI component is introduced by this plan. |
| Mongoose schema validators tested (Testing Discipline) | N/A | No new schema is introduced by this plan — the `Users` schema this plan reads is owned and tested by `user-management-console`. |
| Coverage floor (Testing Discipline) | ✓ | constitution.md states none is set yet; this plan doesn't invent one. |
| No PII/personal data in logs (Security Posture) | ✓ | Login failures log the outcome only (e.g., "auth failed for user X") — never the password, and the issued JWT itself is never logged. |
| Role-based authorization enforced server-side (Security Posture) | ✓ | This is the plan's core deliverable — the middleware, not client-side gating. |
| No external identity integration (Security Posture) | ✓ | JWT is self-hosted; no SSO/LDAP introduced. |
| MongoDB sole datastore (Architectural Constraints) | ✓ | No new datastore — JWT is stateless; the one collection read (`Users`) is MongoDB, owned elsewhere. |
| No client-supplied object into a Mongoose filter unvalidated (Security Posture) | ✓ | Login looks up by `username` via a typed, single-field query — never a spread of the raw request body into a filter. |
| Secrets via env vars only (Security Posture) | ✓ | JWT signing secret is read from an environment variable, never hardcoded or logged. |
| No new datastore/state lib/external integration without ADR (Architectural Constraints) | ✓ | None introduced; the one architectural decision this plan depends on (JWT) already has `ADR-0001`. |
| TanStack Query for all server-state fetching (Architectural Constraints) | N/A | No frontend component is built by this plan. Noted for whichever future spec builds the login screen. |
| No numeric latency/availability/RPO/RTO targets invented (Non-Functional Baselines) | ✓ | None stated in constitution.md; none invented here. |

**Rate limit decision (`rbac-api-security.API02` — `POST /auth/login`):** Rate limit: **5 failed attempts per username within a rolling 15-minute window, then 429 with `retry_after: 900`.** This is a plan-level security-engineering decision (standard brute-force mitigation), not a business requirement — the spec only fixed that a 429 contract exists (`AC13`), not the threshold. `rbac-api-security.API01` (the cross-cutting authorization check) carries no separate rate limit of its own — it inherits whatever limit the underlying endpoint defines, if any.

**Token lifetime decision (discovered during `T01` implementation, 2026-09-16):** `expires_in` default: **900 seconds (15 minutes)**, when `signToken()` is called without an explicit override. Neither the spec (`AC10` just requires `expires_in` to be present) nor `ADR-0001` states a duration — this is the same class of gap as the rate-limit threshold above (an unstated number, decided explicitly here rather than invented silently or left undefined), surfaced only once `T01`'s Red tests required the utility to have *some* default to pass. `signToken()` still accepts an explicit `expiresInSeconds` override per call, so this default doesn't foreclose a different value being used later if a spec amendment sets one.

## Explicitly Deferred

- SSO/LDAP integration, multi-factor authentication, password reset/account recovery — per spec's Explicitly Out of Scope; this plan builds none of it.
- Token refresh flow and token revocation before natural expiry — per `ADR-0001`'s Consequences; this plan does not design either.
- Full `Users` collection schema ownership — owned by `user-management-console.spec.md` (BRD-003, Approved); this plan only asserts the minimal fields it reads (see Data Model).
- Login UI (frontend screen) — deferred to whichever spec renders it; must consume `API02` as defined, not redefine it.
- Password hashing algorithm choice (e.g., bcrypt vs. argon2) — an implementation detail for the task that builds the `Users` write path (owned by `user-management-console`), not this plan.

## Sequencing

1. JWT signing/verification utility + environment-variable-based secret configuration.
2. `POST /auth/login` (`API02`): payload validation (400 on malformed), credential lookup and verification against the minimal `Users` read-contract (including the `deletedAt` check), JWT issuance (200) or rejection (401).
3. Login rate-limiting: 5 failed attempts / 15-minute window per username → 429 with `retry_after`.
4. Cross-cutting authorization middleware (`API01`): bearer-token verification (401) applied to every protected route.
5. Role-permission matrix (code/config) covering all six roles + Admin, implementing `AC3`–`AC9`.
6. Wire the middleware into every existing/future protected endpoint, explicitly excluding `user-management-console.API06` — an integration point later specs' endpoints must consume, not reimplement.
