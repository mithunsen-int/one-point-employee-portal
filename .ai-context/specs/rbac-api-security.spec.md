# Spec: Role-Based Access Control and API Security

## Spec ID

rbac-api-security

## Status

In QA
*(Reopened `In QA` → `In Development` → `In QA` 2026-09-21 via `T08`, wiring the real MongoDB connection at server startup. All 8 tasks now Merged.)*

## Linked BRD

.ai-context/BRD.md#BRD-007

## Intent

Every action across the Internal Transfer Journey System is gated by the acting user's role — Employee, Manager, HR, Payroll, IT, Facilities, or Admin — so that a user can only perform the actions their role is permitted to perform, with every API endpoint enforcing this check server-side rather than relying on the client to merely hide disallowed actions. This applies uniformly across the Admin Panel and Stakeholder Panel, for every state-changing operation this project defines, under the constraint that no external identity provider (LDAP/SSO) is introduced in this phase (BRD-007; SOW §6.1, §7, §9).

## Context

- Builds on: .ai-context/architecture.md (Auth/RBAC Service module)
- Related: none yet approved — this is the first spec drafted in this project. `internal-transfer-workflow`, `user-management-console`, `org-structure-management`, and `transfer-admin-oversight` will each reference this spec's role/permission contract once drafted, per the sequencing in `.ai-context/status.md`. (BRD-005's application-constants feature has no API surface and does not consume this contract.)
- API contract (if consuming an external one): None — no external identity provider is introduced in this phase (BRD-007 Decided; SOW §9 Assumptions).
- Authentication mechanism: JWT bearer tokens — see `.ai-context/decisions/ADR-0001-jwt-authentication.md` for the decision, rationale, and consequences (token revocation and refresh-flow are explicitly not covered by that ADR).

## API Contract

### rbac-api-security.API01 — Authorization enforcement (cross-cutting, applies to every protected endpoint)

**Request payload:** N/A — this is an enforcement rule applied to every existing and future endpoint's request handling, not a distinct endpoint of its own.
**Success response:** The endpoint's own defined success response proceeds unmodified when the acting user's role is permitted to perform the requested action.
**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 401 | No valid bearer token present on the request (`Authorization: Bearer <token>` missing, malformed, or expired) | `{ "error": { "code": "UNAUTHENTICATED", "message": string } }` |
| 403 | Authenticated user's role is not permitted to perform the requested action | `{ "error": { "code": "FORBIDDEN", "message": string } }` |

### rbac-api-security.API02 — POST /auth/login

**Mechanism:** JWT bearer tokens — see `ADR-0001-jwt-authentication.md`.

**Request payload:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success response (200):**

```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": "number"
}
```

**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 401 | Invalid credentials | `{ "error": "invalid_credentials" }` |
| 429 | Rate limit exceeded | `{ "error": "rate_limited", "retry_after": "number" }` |
| 400 | Malformed payload | `{ "error": "validation_error", "fields": ["string"] }` |

The specific rate-limit threshold (attempts per window) is not fixed here — that is a plan-stage decision (see Explicitly Out of Scope); this contract only fixes that a 429 response exists.

## Acceptance Criteria

1. rbac-api-security.AC1 — Given a request to any protected endpoint with no valid authenticated identity, when the request is received, then the API responds 401 Unauthenticated and the requested action is not performed.
2. rbac-api-security.AC2 — Given an authenticated request whose user's role is not permitted to perform the requested action, when the request is received, then the API responds 403 Forbidden and the requested action is not performed.
3. rbac-api-security.AC3 — Given a user with role Employee, when they request an action other than initiating a transfer request, viewing their own request's status/history/pending stakeholders, or withdrawing their own request while it is Pending Manager Approval, then the API rejects the action per AC2.
4. rbac-api-security.AC4 — Given a user with role Manager, when they request an action other than approving or rejecting a transfer request routed to them for Manager review, then the API rejects the action per AC2.
5. rbac-api-security.AC5 — Given a user with role HR, when they request an action other than validating eligibility, approving/rejecting a transfer request routed to them for HR review, or performing the final manager-mapping step, then the API rejects the action per AC2.
6. rbac-api-security.AC6 — Given a user with role Payroll, when they request an action other than updating salary/compensation/tax/cost-center data for their own assigned parallel task, or marking it "No Action Needed," then the API rejects the action per AC2.
7. rbac-api-security.AC7 — Given a user with role IT, when they request an action other than provisioning or revoking systems access, permissions, or devices for their own assigned parallel task, then the API rejects the action per AC2.
8. rbac-api-security.AC8 — Given a user with role Facilities, when they request an action other than arranging workspace, office logistics, or location setup for their own assigned parallel task, then the API rejects the action per AC2.
9. rbac-api-security.AC9 — Given a user with role Admin, when they request user management, department/role management, or transfer-request-monitoring actions, then the API permits the action; given a request to register a new Employee user from any role other than Admin or HR, then the API rejects that request per AC2.
10. rbac-api-security.AC10 — Given valid `username`/`password` credentials, when `POST /auth/login` is called, then the API responds 200 with an `access_token`, `token_type` of `"Bearer"`, and `expires_in`.
11. rbac-api-security.AC11 — Given invalid credentials (unknown username or wrong password), when `POST /auth/login` is called, then the API responds 401 with `{ "error": "invalid_credentials" }` and no token is issued.
12. rbac-api-security.AC12 — Given a login request missing or malformed `username`/`password` fields, when `POST /auth/login` is called, then the API responds 400 with `{ "error": "validation_error", "fields": [...] }` naming each invalid field.
13. rbac-api-security.AC13 — Given login attempts exceeding the (plan-defined) rate-limit threshold, when a further `POST /auth/login` request is made, then the API responds 429 with `{ "error": "rate_limited", "retry_after": ... }`.

## Unit Test Cases (spec-derived)

| Test ID                | Maps to AC | Scenario                                                                   | Expected                                                           |
| ---------------------- | ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| rbac-api-security.UT01 | AC1        | Request to a protected endpoint with no authenticated identity             | 401 Unauthenticated; action not performed                          |
| rbac-api-security.UT02 | AC2        | Authenticated user requests an action outside their role's permitted set   | 403 Forbidden; action not performed                                |
| rbac-api-security.UT03 | AC3        | Employee attempts to approve a transfer request (Manager-only action)      | 403 Forbidden                                                      |
| rbac-api-security.UT04 | AC4        | Manager attempts to perform HR eligibility validation                      | 403 Forbidden                                                      |
| rbac-api-security.UT05 | AC5        | HR attempts to update Payroll compensation data for a parallel task        | 403 Forbidden                                                      |
| rbac-api-security.UT06 | AC6        | Payroll attempts to provision IT systems access                            | 403 Forbidden                                                      |
| rbac-api-security.UT07 | AC7        | IT attempts to arrange Facilities workspace logistics                      | 403 Forbidden                                                      |
| rbac-api-security.UT08 | AC8        | Facilities attempts to register a new Employee user                        | 403 Forbidden                                                      |
| rbac-api-security.UT09 | AC9        | Manager attempts to register a new Employee user (only Admin/HR permitted) | 403 Forbidden                                                      |
| rbac-api-security.UT10 | AC9        | Admin performs a Department/BU management action                           | 200 (permitted)                                                    |
| rbac-api-security.UT11 | AC10       | Valid credentials submitted to `POST /auth/login`                          | 200; `access_token`, `token_type: "Bearer"`, `expires_in` returned |
| rbac-api-security.UT12 | AC11       | Wrong password submitted to `POST /auth/login`                             | 401; `{ "error": "invalid_credentials" }`; no token issued         |
| rbac-api-security.UT13 | AC12       | Login request missing the `password` field                                 | 400; `{ "error": "validation_error", "fields": ["password"] }`     |
| rbac-api-security.UT14 | AC13       | Login attempts exceed the rate-limit threshold                             | 429; `{ "error": "rate_limited", "retry_after": ... }`             |

## Explicitly Out of Scope

- External identity/SSO/LDAP integration (BRD-007 Decided; SOW §9 Assumptions).
- Multi-factor authentication — not named anywhere in the SOW or BRD.
- Password reset / account recovery flows — not named anywhere in the SOW or BRD.
- Specific rate-limiting thresholds per endpoint — a plan-stage decision (constitution.md), not a spec-level acceptance criterion. The 429 contract shape is fixed (AC13); the number of attempts/window that triggers it is not.
- Token refresh / re-authentication flow after `expires_in` elapses — not specified by BRD/SOW; ADR-0001 explicitly does not decide this.
- Token revocation before natural expiry (forced logout, compromised token) — not specified by BRD/SOW; ADR-0001 explicitly does not decide this.
- Password storage/hashing implementation — a plan-stage detail, not a spec-level contract concern.

## Non-Functional Constraints (from constitution.md)

- Role-based authorization is enforced server-side, at the API layer, for all six roles — client-side gating is never a substitute (Security Posture).
- No employee personal or organizational data may appear in logs at any level (Security Posture).
- MongoDB is the sole approved datastore; no client-supplied object may be passed unvalidated into a Mongoose query filter (Security Posture / Architectural Constraints).
- No external identity/system integration in this phase (Security Posture).
- constitution.md states no numeric coverage floor and no numeric latency/availability/RPO/RTO targets exist yet — this spec does not invent one; any such target must be raised as an explicit Gate 1 question, not assumed (Non-Functional Baselines).
