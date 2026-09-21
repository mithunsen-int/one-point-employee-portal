# Task: transfer-audit-trail.T04

**Implements:** `transfer-audit-trail.T04` — wire `findTransferRequestById` (`src/services/audit/transferRequestLookup.ts`) to the real `TransferRequests` collection.

**Acceptance:** `transfer-audit-trail.AC3`, `AC4`, `AC5`, `AC6`. Same ACs `T03` already covers — this task completes `T03`'s own scope, it doesn't add new behavior.

**Origin:** found via a project-wide test-coverage audit. `transferRequestLookup.ts` was a deliberate stub, blocked on `internal-transfer-workflow.T01` (the real `TransferRequests` schema). That schema Merged long ago; the stub was never revisited. As shipped, `GET /transfer-requests/{id}/audit-log` throws on every real request — `route.test.ts` only passes because it mocks `transferRequestLookup` entirely.

**Scope — build only this:**
- Implement `findTransferRequestById(id)` against the real `TransferRequest` Mongoose model (`src/services/workflow/TransferRequest.ts`): return `{ id, employeeId }`, or `null` if not found — and `null` (not a thrown `CastError`) for a syntactically malformed `id`, matching this project's standing `Types.ObjectId.isValid()` convention.
- A new, real (unmocked) test file, `src/services/audit/transferRequestLookup.test.ts`, exercising the actual `TransferRequests` collection via `mongoServer` test utils.

**Do not touch:**
- `audit-log/route.ts` or its own `route.test.ts` — that route's tests correctly mock this function to test route logic in isolation; that pattern stays as-is. This task only fixes what the mock was standing in for.
- The `AuditLogs` schema, the append function, or any other already-Merged file in this spec.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for transfer-audit-trail.T04` has produced Red tests for it, confirmed failing for the right reason.
