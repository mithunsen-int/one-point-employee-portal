# Task: org-structure-management.T01

**Implements:** `org-structure-management.T01` — `Departments` Mongoose schema (unique `name`) + full CRUD (`API01` create, `API02` edit, `API03` delete, `API04` list).

**Acceptance:** `org-structure-management.AC1`, `AC2`, `AC3`, `AC4`, `AC5`, `AC6`, `AC13`. Full text in `.ai-context/specs/org-structure-management.spec.md`. Implementation detail: `.ai-context/plans/org-structure-management.plan.md`, Sequencing step 1.

**Scope — build only this:**
- `Departments` collection: `name` (unique index).
- `POST /departments`, `PATCH /departments/{id}`, `DELETE /departments/{id}`, `GET /departments` — all Admin-only (via the existing `rbac-api-security` middleware, not reimplemented here), with 400 on missing/empty `name`, 409 on duplicate `name`.
- Deleting a Department only removes it from the list view (`AC5`) — do not add any referential-integrity check against `TransferRequests`; that's an explicitly open cross-spec gap, not this task's to resolve.

**Do not touch:**
- `JobRoles` (`T02`) — a separate collection, separate task, even though structurally identical.
- `API05` (detailed view) — not built by this plan at all; do not add it.
- Any check against `internal-transfer-workflow`'s `TransferRequests` collection.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for org-structure-management.T01` has produced Red tests for it, confirmed failing for the right reason.
