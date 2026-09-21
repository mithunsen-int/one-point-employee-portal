# Task: transfer-audit-trail.T01

**Implements:** `transfer-audit-trail.T01` — `AuditLogs` Mongoose schema + `transferRequestId` index + update/delete-blocking middleware guards.

**Acceptance:** `transfer-audit-trail.AC2` (append-only, no update/delete). Implementation detail: `.ai-context/plans/transfer-audit-trail.plan.md`, Sequencing step 1 and its "append-only enforced at the model layer" decision.

**Scope — build only this:**
- `AuditLogs` collection: `transferRequestId` (indexed), `actorId`, `actorRole` (snapshotted, not a live lookup), `action`, `timestamp`.
- `pre('findOneAndUpdate')` and `pre('deleteOne')`/`pre('deleteMany')` Mongoose hooks that **throw** — this is the actual enforcement mechanism for `AC2`, not just the absence of an update/delete route.
- No TTL/expiry index — retention is unstated, records are kept indefinitely (per the plan's explicit note).

**Do not touch:**
- No route handlers — schema and guards only.
- The append function itself (`T02`) — this task only makes the schema/guards; `T02` is what actually creates entries.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for transfer-audit-trail.T01` has produced Red tests for it, confirmed failing for the right reason — specifically, a test that attempts a direct update/delete and confirms it throws.
