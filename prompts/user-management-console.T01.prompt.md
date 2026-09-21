# Task: user-management-console.T01

**Implements:** `user-management-console.T01` — `Users` Mongoose schema: all fields, `username` unique index, `{ role: "Admin", deletedAt: null }` partial unique index.

**Acceptance:** `user-management-console.AC5`, `user-management-console.AC15`. Full text in `.ai-context/specs/user-management-console.spec.md`. Implementation detail: `.ai-context/plans/user-management-console.plan.md`, Sequencing step 1 and Data Model (the authoritative schema — also consumed by `rbac-api-security.plan.md` and `internal-transfer-workflow.plan.md`'s read-contracts, so field names/types here must match exactly what those plans already assert: `username`, `passwordHash`, `role`, `dateOfJoining`, `managerId`, `deletedAt`).

**Scope — build only this:**
- The `Users` collection schema: `username` (unique, indexed), `passwordHash`, `role` (enum of all 7 values including `Admin`), `dateOfJoining`, `managerId` (self-referencing), `deletedAt`.
- The `{ role: "Admin", deletedAt: null }` partial unique index — this is what makes `AC15` (at-most-one-Admin) hold at the database level, not just in application logic.

**Do not touch:**
- No route handlers — this task is schema only.
- Password hashing (`T02`) — do not implement the hashing logic here, only the field it's stored in.
- `managerId` existence/role validation logic — that's application-layer, done in `T03`, not a schema-level concern.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for user-management-console.T01` has produced Red tests for it, confirmed failing for the right reason.
