# ADR-0001: JWT bearer-token authentication for API access

## Context
BRD-007 left the authentication mechanism undecided ("No authentication mechanism (session-based, token-based, SSO) is specified"). This choice is cross-cutting, not local to one feature: every other spec in this project (`internal-transfer-workflow`, `user-management-console`, `org-structure-management`, `config-driven-dropdowns`, `transfer-admin-oversight`) is `Related:` to `rbac-api-security` specifically because each inherits how an authenticated identity is established from it. Reversing this choice after downstream specs/plans are built against it would require touching the Auth/RBAC Service, every protected endpoint's middleware, and frontend credential handling — well past a day of rework, meeting the `sdd-methodology.md` #13 significance bar for an ADR rather than a line in a plan. No external identity provider is available in this phase (BRD-007 Decided; SOW §9), so the mechanism had to be self-hosted.

## Decision
Use JWT (JSON Web Token) bearer-token authentication.

`rbac-api-security.API02` (`POST /auth/login`) accepts `username`/`password` and returns an `access_token`, `token_type: "Bearer"`, and `expires_in` on success. Callers present the token via the `Authorization: Bearer <token>` header on subsequent requests; `rbac-api-security.API01`'s existing 401/403 enforcement contract is unchanged by this choice — 401 now specifically means "no valid bearer token present."

Exceptions fixed by this decision: 401 (invalid credentials), 429 (rate limited, with `retry_after`), 400 (malformed payload, with the invalid `fields` named). The specific rate-limit threshold (how many attempts over what window) is **not** decided here — that remains a plan-stage decision per constitution.md's Non-Functional Baselines handling; this ADR only fixes that a 429 contract exists.

## Consequences
- **Stateless** — no server-side session store is needed for authentication itself, consistent with constitution.md's "MongoDB is the sole approved datastore" (no new datastore is required to support this).
- **Does not solve token revocation before natural expiry** — a forced logout or a compromised token cannot be invalidated before `expires_in` elapses unless a revocation mechanism (e.g., a denylist) is added later. Nothing in BRD/SOW requires this, so it is not designed here.
- **Does not define a refresh/re-authentication flow** — `expires_in` means the token expires; how a client obtains a new one afterward (silent refresh vs. forcing re-login) is not decided by this ADR. Flagged explicitly in `rbac-api-security.spec.md`'s Explicitly Out of Scope so it isn't silently assumed later.
- **Password storage/hashing approach is not fixed here** — that is an implementation detail for the plan stage (e.g., bcrypt/argon2), not an architectural trade-off this ADR needs to make.
- Every other spec in this project now has a fixed, concrete contract (`rbac-api-security.API02`) to authenticate against, closing the "not yet set" gap that previously blocked it.
