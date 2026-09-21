# Gate 2 Evidence — transfer-audit-trail

One running file per feature for this gate. Each task gets one appended row below, plus its full findings report in this same file. Never overwritten or removed.

## Summary Table

| Task ID | Date | Reviewer (named human) | Verdict | Blocking findings | Reference |
|---|---|---|---|---|---|
| transfer-audit-trail.T01 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#transfer-audit-trailt01--full-report) |
| transfer-audit-trail.T02 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#transfer-audit-trailt02--full-report) |
| transfer-audit-trail.T03 | 2026-09-19 | Test Reviewer | Merged | None | [Full report](#transfer-audit-trailt03--full-report) |
| transfer-audit-trail.T04 | 2026-09-20 | Test Reviewer | Merged | None | [Full report](#transfer-audit-trailt04--full-report) |

---

## transfer-audit-trail.T01 — Full Report

**Diff reviewed:** `src/services/audit/AuditLog.ts` (new), `src/services/audit/AuditLog.test.ts` (new).

**Acceptance:** `transfer-audit-trail.AC2` — *"Given an existing audit entry, no code path may update or delete it — entries are append-only."*

### AC verification (by ID)

- **`AC2`** — **Pass, in full.** `Model.findOneAndUpdate`, `Model.findOneAndDelete`, `Model.deleteOne` (query-style), `Model.deleteMany`, and a fetched document's own `.deleteOne()` (document-style) are all confirmed to throw — a genuine model-layer guard, not just the absence of a route. A blocked mutation attempt was also confirmed to leave the entry unchanged, not partially applied. `findOneAndDelete` was initially out of this task's literal enumerated scope (flagged below, in the version of this report reviewed first); added during this same review cycle, before Merge, once flagged — see Findings for the history.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above, including the explicit scope caveat. |
| No AI-attribution in comments/commit messages | Pass | `AuditLog.ts`'s one comment explains why the guards exist at the model layer (a real plan-level decision) — not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass, with a flagged finding | See Security Checklist below — one item is worth the reviewer's explicit attention. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | `AuditLogs` is a new collection within the already-approved datastore; Audit Logging Service is already named in `architecture.md`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 7 tests failed with `Cannot find module './AuditLog'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Both updated same session (2026-09-19); spec Status moved `Tasks Generated` → `In Development` in the same edit as this task's work. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Single shared `blockMutation()` helper used by both hooks rather than duplicated throw logic; schema fields match the plan's Data Model table exactly. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. `actorId`/`actorRole` only — no raw personal data, per the plan's explicit decision. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No secret/credential handling in this diff. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint introduced — schema and guards only, per this task's own scope. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass (N-A) | No authorization logic in this diff — `API02`'s read-side authorization is a later task's scope. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | MongoDB is the sole datastore; append-only immutability is exactly what `constitution.md`'s Security Posture requires for this collection. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No query-filter code driven by client input in this diff — tests use fixed, literal ObjectIds. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Resolved during this review, before Merge — `Model.findOneAndDelete()` was initially not guarded.** This task's own prompt file originally enumerated only `pre('findOneAndUpdate')` and `pre('deleteOne')`/`pre('deleteMany')`; `findOneAndDelete` is a distinct Mongoose deletion pathway that enumeration didn't mention, so the first version of this diff implemented exactly that literal scope and flagged the gap rather than unilaterally expanding it. On review, the user asked to close the gap — a one-line addition (`pre(["findOneAndUpdate", "findOneAndDelete"], ...)`), plus one new test confirming it throws. `constitution.md`'s "no code path may update or delete an existing entry" rule is now fully satisfied by this diff, not just the originally-enumerated subset of it.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements transfer-audit-trail.T01`.

### Outcome

No Blocking findings. One finding raised and resolved within this same review cycle (the `findOneAndDelete` gap, now closed) — recorded here for traceability rather than erased, since it reflects a real decision point, not a mistake to hide. One routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `transfer-audit-trail.T01` Merged.

---

## transfer-audit-trail.T02 — Full Report

**Diff reviewed:** `src/services/audit/appendAuditLogEntry.ts` (new), `src/services/audit/appendAuditLogEntry.test.ts` (new).

**Acceptance:** `transfer-audit-trail.AC1` — *"Given any state-changing action defined in internal-transfer-workflow... when that action completes successfully, then an audit entry recording the actor, the action, and the timestamp is appended."*

### AC verification (by ID)

- **`AC1`** — **Pass, as scoped.** The function correctly creates an entry recording `actorId`, `actorRole` (exactly as given, snapshotted), `action`, and a server-set `timestamp` (verified both structurally — the function signature has no timestamp parameter — and at runtime — the stored value falls within the call's actual execution window). Two calls append two independent entries. This task does not itself decide *which* action strings correspond to which of `internal-transfer-workflow`'s 10 transitions, or *when* (only on success) to call this function — both are `T09`'s call-site responsibility, correctly out of this task's own scope per its prompt file.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above, with the scope boundary stated explicitly. |
| No AI-attribution in comments/commit messages | Pass | `appendAuditLogEntry.ts` has no comments. `appendAuditLogEntry.test.ts`'s comments explain the scope boundary (what `T09` owns vs. this task) — traceability, not attribution. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; a thin wrapper around `T01`'s already-covered schema. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 4 tests failed with `Cannot find module './appendAuditLogEntry'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development`. |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Minimal, single-purpose function — no scope creep into caller responsibilities. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling — actor id/role and an action string only. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint — this is an internal, in-process function call, per the plan's explicit `API01` rate-limit line ("N/A — internal, in-process call"). |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass (N-A) | No authorization decision in this diff — the caller is trusted, in-process code, not a request boundary. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Writes only through `T01`'s already-reviewed schema/guards; no new storage path. |
| No client-supplied object into a MongoDB filter unvalidated | Pass (N-A) | No query-filter code — only a `create()` call with the three parameters the function itself defines. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — not yet called by anything.** `appendAuditLogEntry()` exists and is fully tested in isolation, but `internal-transfer-workflow.T09` (its only intended caller) hasn't been built yet. No live effect until then — correct scope boundary, not a defect.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements transfer-audit-trail.T02`.

### Outcome

No Blocking findings. Two non-blocking Notes recorded for awareness, not required before merge.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `transfer-audit-trail.T02` Merged.

---

## transfer-audit-trail.T03 — Full Report

**Diff reviewed:** `src/app/api/transfer-requests/[id]/audit-log/route.ts` (new), `src/app/api/transfer-requests/[id]/audit-log/route.test.ts` (new), `src/services/audit/transferRequestLookup.ts` (new). Updated during this same review cycle, before Merge: `route.ts` and `route.test.ts` (`actor` field now resolves to a username — see Findings).

**Acceptance:** `transfer-audit-trail.AC3`–`AC6`. API Contract: `API02`.

### AC verification (by ID)

- **`AC3`** — **Pass.** The requesting Employee (identity's `userId` matches the transfer request's `employeeId`) successfully reads their own request's audit log (`UT04`).
- **`AC4`** — **Pass.** Admin successfully reads a request that isn't their own (`UT05`).
- **`AC5`** — **Pass.** A different Employee (`UT06`), and a full sweep of Manager/HR/Payroll/IT/Facilities — including the specific reviewer who actually acted on the request (`QT04`) — are all correctly rejected 403.
- **`AC6`** — **Pass.** A non-existent request id (`UT07`) and a syntactically malformed id (`QT06`) both 404.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | `transferRequestLookup.ts`'s and `route.ts`'s comments document real, flagged decisions (the stub's blocking dependency; the malformed-id-is-404 convention choice) — not attribution. `route.test.ts`'s comment explains the mock's relative-path workaround, already documented project convention. No commit exists yet (see Note below). |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; reuses `rbac-api-security.T04`'s `authenticateRequest` and `T01`/`T02`'s already-covered `AuditLog`/`appendAuditLogEntry`. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | Cross-checked against the recorded Red-confirmation: all 11 tests failed with `Cannot find module './route'` before the file existed. |
| `status.md` and spec Status updated same day | Pass | Updated same session (2026-09-19); spec Status remains correctly `In Development` pending this Merge decision (this is the last task, so a Merge here would move it to `In QA`). |
| Readability, naming, DRY, consistency with codebase patterns | Pass | Malformed-id-as-404 matches every other `[id]` route in this project (`Users`, `Departments`, `JobRoles`) — explicit consistency, not coincidence. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No secret/credential handling — reads audit entries and a stubbed transfer-request summary only. |
| New/changed endpoints have an explicit rate-limit decision | Pass | Plan states "none, deferred" for `API02` — authenticated, ownership/role-gated read, not public-facing. |
| New dependencies vetted | Pass (N-A) | No new dependency introduced. |
| Auth boundaries / least-privilege checked | Pass | Deny-by-default: only `Admin` or the exact matching `employeeId` passes; every other authenticated role, including the actual Manager/HR reviewer who acted on the request, is rejected — verified directly by test, not assumed. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Read-only; no new datastore. |
| No client-supplied object into a MongoDB filter unvalidated | Pass | `id` validated via `Types.ObjectId.isValid()` before use; `AuditLog.find({ transferRequestId: id })` uses a single validated scalar, never a spread of client input. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). Same project-wide gap already noted, not new here. |

### Findings

**Note (non-blocking) — `findTransferRequestById` is a deliberate stub, blocked on `internal-transfer-workflow.T01`.** Correctly scoped: this task doesn't own the `TransferRequests` schema and shouldn't build it. Tracked in `transfer-audit-trail.tasks.md`'s Open Items so it isn't lost. The endpoint's own logic (auth, 403/404 branching, response shaping) is fully real and tested via the mocked boundary — same treatment as `rbac-api-security.T02`'s `userLookup.ts`.

**Resolved during this review, before Merge — the `actor` field's content.** `API02`'s contract states `"actor": "string"` without specifying what it should contain; the first version of this diff mapped it to a raw `actorId.toString()` and flagged the ambiguity rather than guessing further. On review, the user asked whether the actor's *name* could be used instead — surfaced a real fact worth recording: `Users` (`user-management-console.T01`) has no `name` field at all, only `username`. Resolved by looking up `username` from the already-Merged `Users` collection (batched in one query, not N+1), deliberately *not* filtered by `deletedAt: null` — an audit trail must not silently reinterpret history just because the actor has since left, the same principle already applied to `actorRole`'s snapshotting — with a fallback to the raw `actorId` only if no matching `User` record exists at all (a data-integrity edge case). Three new tests cover the resolved-username case, the soft-deleted-actor case, and the no-matching-record fallback.

**Note (non-blocking) — malformed-id-as-404 is a project convention, not a spec-stated rule.** Consistent with every other `[id]` route so far; `QT06` explicitly leaves the choice open. Flagged for traceability, matching the treatment already given to the same decision in `user-management-console.T04`.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet for this diff. When committed, reference `Implements transfer-audit-trail.T03`.

### Outcome

No Blocking findings. One finding raised and resolved within this same review cycle (the `actor` field's content, now a real `username` lookup, not erased from this record) plus three routine Notes.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `transfer-audit-trail.T03` Merged.

---

## transfer-audit-trail.T04 — Full Report

**Diff reviewed:** `src/services/audit/transferRequestLookup.ts` (modified — stub replaced with a real implementation), `src/services/audit/transferRequestLookup.test.ts` (new).

**Acceptance:** `transfer-audit-trail.AC3`, `AC4`, `AC5`, `AC6`. Same ACs `T03` already covers — completes that task's own deferred scope, no new behavior.

**Origin:** a project-wide test-coverage audit found this stub — deliberately left open at `T03`'s own Merge, blocked on `internal-transfer-workflow.T01` — was never revisited after that blocking dependency Merged. As shipped before this task, `GET /transfer-requests/{id}/audit-log` threw on every real request; `route.test.ts` only ever passed because it mocks `transferRequestLookup` entirely.

### AC verification (by ID)

- **`AC3`–`AC6`** (audit-log read endpoint) — **Pass.** `findTransferRequestById` now queries the real `TransferRequest` model, returning `{ id, employeeId }` for a match, `null` for a well-formed-but-missing `id`, and `null` (not a thrown `CastError`) for a syntactically malformed `id` — matching this project's standing `Types.ObjectId.isValid()` convention rather than letting Mongoose throw. Verified directly with a new, unmocked test file hitting a real `mongoServer`-backed `TransferRequests` collection. Also reconfirmed `route.test.ts`'s own suite (which mocks this function) still passes unmodified.

### Gate 2 Checklist

| Item | Verdict | Justification |
|---|---|---|
| Each AC verified individually, by ID | Pass | See above. |
| No AI-attribution in comments/commit messages | Pass | The one comment references `transfer-audit-trail.T04`/`T03` by ID — traceability, not attribution. No commit exists yet. |
| Security checklist passed | Pass | See Security Checklist below. |
| `architecture.md`/ADR updated if warranted | Pass (N-A) | No new module/collection; this task only fills in a previously-stubbed read against an already-documented `TransferRequests` collection. |
| Tests were written first, confirmed Red before Green, not retrofitted | Pass | All 3 new tests failed with the stub's own thrown error before the fix (cross-checked against the recorded Red-confirmation). |
| `status.md` and spec Status updated same day | Pass | `transfer-audit-trail.spec.md`'s Status moved `In QA` → `In Development` same day this task was added, reflecting the real state rather than left stale. |
| Readability, naming, DRY, consistency with existing codebase patterns | Pass | Matches the same lookup-function shape, `Types.ObjectId.isValid()` guard, and null-returning convention used everywhere else in this project. |

### Security Checklist

| Item | Verdict | Justification |
|---|---|---|
| No PII in logs at any level | Pass | No logging statements in the diff. |
| No secrets/credentials/tokens hardcoded or logged | Pass | No credential handling — this function returns only `id`/`employeeId`. |
| New/changed endpoints have an explicit rate-limit decision | Pass (N-A) | No endpoint changed — this is the lookup function `route.ts` already called. |
| New dependencies vetted | Pass (N-A) | None introduced. |
| Auth boundaries / least-privilege checked | Pass | This function only reads; the route's own Employee-owns-request-or-Admin authorization is unchanged by this diff. |
| Data-at-rest / in-transit matches `constitution.md` | Pass | Reads only the already-approved `TransferRequests` collection; no new datastore. |
| No client-supplied object into a MongoDB query filter unvalidated | Pass | The client-supplied `id` is validated via `Types.ObjectId.isValid()` before it ever reaches a query. |
| SAST/DAST and dependency scan run and clean | Pass | `npm audit`: 0 vulnerabilities (no new packages). |

### Findings

**Note (worth explicit reviewer attention, non-blocking) — this closes a real, previously-live defect, not a cosmetic gap.** Before this task, every real request to this endpoint would have thrown an unhandled error in production, undetected because the existing test suite mocks the exact function that was broken. Same root cause and same remediation pattern as `rbac-api-security.T07`, found by the same audit — worth treating as a project-wide lesson (see that task's own Gate 2 Note) rather than two isolated incidents.

**Note (non-blocking) — commit message, for whenever this is actually committed.** No commit exists yet. When committed, reference `Implements transfer-audit-trail.T04`.

### Outcome

No Blocking findings. One Note flagging the real-world severity of what this task closes, plus one routine Note.

---

This review may be drafted by an AI agent, but only a named human reviewer can mark `transfer-audit-trail.T04` Merged.

**Verdict:** Merged (Test Reviewer, 2026-09-20). `transfer-audit-trail.T04` is Merged — all 4 tasks in this spec are now Merged; Status returns to `In QA`.
