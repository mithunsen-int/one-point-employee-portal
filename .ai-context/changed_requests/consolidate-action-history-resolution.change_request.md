# Change Request: Consolidate Duplicated Action-History Resolution Logic

## Status
Proposed — not scheduled against any spec's `tasks.md` yet. Not a defect, so it does not go through the Hotfix (`sdd-methodology.md` #24) or Production Support (#25) paths, and it doesn't meet the ADR significance bar (#22 — "reversing it later costs more than a day of rework") since it's a small, easily-reversible refactor. This file exists so the finding isn't lost, not to grant itself any gate on its own.

## Origin
Raised as Finding 2 in `transfer-admin-oversight.T03`'s Gate 2 review — see `.ai-context/gate-reviews/gate2-evidence-transfer-admin-oversight.md`, 2026-09-19.

## Problem
The same "resolve `AuditLog` entries' `actorId`s to `username`s" logic — batch-collect unique `actorId`s, one `User.find({_id: {$in: actorIds}})` query, map to `username`, fall back to the raw `actorId` string if no match — is now duplicated across three route files:

1. `src/app/api/transfer-requests/[id]/audit-log/route.ts` (`transfer-audit-trail.T03`, Merged)
2. `src/app/api/transfer-requests/[id]/route.ts` (`internal-transfer-workflow.T03`, Merged)
3. `src/app/api/admin/transfer-requests/[id]/route.ts` (`transfer-admin-oversight.T03`)

The first two files' own code comments, written at their original Gate 2 review, explicitly deferred extraction: "used in exactly one other place, and extracting an abstraction for a single future consumer isn't warranted yet... worth revisiting if a third consumer appears." That third consumer is `transfer-admin-oversight.T03`, above.

A shared helper already exists — `src/services/audit/resolveActionHistory.ts`, extracted for `transfer-admin-oversight.T03`'s own use — but the two older, already-Merged files were deliberately left untouched, since retrofitting files that belong to other tasks/specs was outside `T03`'s own scope under this project's one-task-one-prompt discipline (`CLAUDE.md`'s "Do not implement... more than one task's worth of change per prompt/session").

## Proposed Change
Refactor the two pre-existing route files to import and call `resolveActionHistory()` instead of their own inline duplicate logic. Purely internal and behavior-preserving — each file's existing test suite should pass unmodified, serving as the regression check for the refactor.

## Affected Files
- `src/app/api/transfer-requests/[id]/audit-log/route.ts` (owned by `transfer-audit-trail`)
- `src/app/api/transfer-requests/[id]/route.ts` (owned by `internal-transfer-workflow`)
- No test changes expected in either file — existing suites are the safety net, not new test scope.

## Related
- `transfer-audit-trail` — owns `AuditLog.ts` and the first duplicated call site
- `internal-transfer-workflow` — owns the second duplicated call site
- `transfer-admin-oversight` — raised this finding; owns `resolveActionHistory.ts`, the third (and only currently-consolidated) call site

## Not a defect
All three call sites behave correctly today. This is a maintainability/DRY improvement, not a bug fix — no incident, no incorrect output, no user-facing impact either way.
