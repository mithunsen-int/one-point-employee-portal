# Task: rbac-api-security.T08

**Implements:** `rbac-api-security.T08` — wire `connectToDatabase()` into the real running server via `src/instrumentation.ts`.

**Acceptance:** rbac-api-security's own Non-Functional Constraint, "MongoDB is the sole approved datastore," cited representatively — this task is infrastructure plumbing with no dedicated AC of its own.

**Origin:** discovered while investigating a real 500 error the user hit on `POST /admin/self-register`. `src/services/db/connect.ts`'s `connectToDatabase()` — which already exists, already throws a clear error if `MONGODB_URI` is unset, and already has its own passing unit test — was never actually called anywhere in the codebase. Every Jest test passes regardless, because `src/test-utils/mongoServer.ts` connects Mongoose directly to an in-memory `mongodb-memory-server` instance, bypassing `connect.ts` entirely. The real running server had no database connection at all; confirmed directly from server logs: `MongooseError: Operation \`users.insertOne()\` buffering timed out after 10000ms`.

**Scope — build only this:**
- New `src/instrumentation.ts` exporting an async `register()` function that calls `await connectToDatabase()` (imported from `@/services/db/connect`). Let any connection failure (e.g. missing `MONGODB_URI`, unreachable MongoDB) propagate and crash server startup — fail fast and loud, matching `connectToDatabase()`'s own existing behavior, not a silently-degraded fallback.
- Nothing else. `connect.ts` itself already has the correct caching logic (`cachedConnection`) and its own test — this task only adds the one missing call site.

**Do not touch:**
- `src/services/db/connect.ts` itself — its logic is already correct and tested, this task only wires it in.
- `src/test-utils/mongoServer.ts` or any existing test's database setup — tests intentionally bypass `connect.ts` via a real (in-memory) MongoDB connection of their own; that pattern is correct and stays as-is.
- Any API route — none of them should call `connectToDatabase()` directly; the server-startup hook is the single call site.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for rbac-api-security.T08` has produced Red tests for it, confirmed failing for the right reason. At minimum: `register()` calls `connectToDatabase()` exactly once (mocked, since this is a unit test of the wiring itself, not a real-connection integration test — `connect.ts`'s own test file already covers the real-connection-error behavior).
