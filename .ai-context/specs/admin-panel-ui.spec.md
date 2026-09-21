# Spec: Admin Panel UI

## Spec ID
admin-panel-ui

## Status
In QA
*(Reopened `In QA` → `In Development` → `In QA` 2026-09-21 via `T10`, changing the Create User form's Manager field to a selector. All 10 tasks now Merged.)*

## Linked BRD
.ai-context/BRD.md#BRD-008

## Intent
Admin currently has no way to actually use any of the oversight, user-management, or org-structure capabilities this project already built — every one of them exists only as a REST API. This spec builds the Admin-only screens (`architecture.md`'s Admin Panel UI module) that let an authenticated Admin view the dashboard, monitor and inspect transfer requests, and manage Users, Departments, and Job Roles, each screen a thin consumption layer over an already-Merged API — no new backend capability is introduced (BRD-008; SOW §1, §7, §8; architecture.md's module table, which backs this panel specifically to BRD-002, BRD-003, BRD-004).

## Context
- Builds on: .ai-context/architecture.md (Admin Panel UI module; Client State section — TanStack Query for all server data). Session/token handling (storage, expiry, force-logout) is owned entirely by `stakeholder-panel-ui.spec.md` (AC1/AC2b) — this spec only consumes the resulting session, never re-implements the mechanism.
- Related: .ai-context/specs/transfer-admin-oversight.spec.md (Status: In QA) — dashboard, monitoring list, and detail-view screens consume `API01`–`API03` directly.
- Related: .ai-context/specs/user-management-console.spec.md (Status: In QA) — the user-management screens consume `API01`–`API05`.
- Related: .ai-context/specs/org-structure-management.spec.md (Status: In QA) — the Department/Job Role management screens consume `API01`–`API09`.
- Related: .ai-context/specs/rbac-api-security.spec.md (Status: In QA) — every screen in this spec requires an authenticated Admin session; server-side enforcement is that spec's contract, not reimplemented here.
- Related: .ai-context/specs/stakeholder-panel-ui.spec.md (Status: Draft v1.0) — the Login screen and session bootstrap are owned by that sibling spec, not this one (see Explicitly Out of Scope); an Admin authenticates through that same shared screen and is routed here based on role.
- Related: .ai-context/specs/application-constants-management.spec.md (Status: In QA) — any static dropdown values this panel needs (other than Departments/Job Roles, which are live CRUD data per BRD-004) are imported from that spec's frontend constants module, not fetched over the network.

## API Contract
This spec exposes no new endpoints. It consumes the following already-Approved contracts; payload shapes, status codes, and exceptions are defined at their source and not restated here (sdd-methodology.md #11.2):

| Consumed | Screen | Notes |
|---|---|---|
| `transfer-admin-oversight.API01` — GET /admin/dashboard | Dashboard | |
| `transfer-admin-oversight.API02` — GET /admin/transfer-requests | Monitoring list | |
| `transfer-admin-oversight.API03` — GET /admin/transfer-requests/{id} | Request detail view | Includes `actionHistory` already resolved server-side. |
| `user-management-console.API01`–`API05` | User management | Create / edit / delete / list / detail-profile screens. `API06` (Admin self-registration bootstrap) is explicitly out of scope — see below. |
| `org-structure-management.API01`–`API05` | Department management | Create / edit / delete / list / detail view. |
| `org-structure-management.API06`–`API09` | Job Role management | Create / edit / delete / list. No detail view exists at the API layer (BRD-004's "optional" detail view was not built) — this screen has none either. |

## Acceptance Criteria
1. admin-panel-ui.AC1 — Given an authenticated Admin, when they navigate to the Dashboard, then `transfer-admin-oversight.API01`'s `userCounts`, `totalTransferRequests`, and `statusBreakdown` are fetched and displayed.
2. admin-panel-ui.AC2 — Given an authenticated Admin, when they navigate to the Transfer Request Monitoring screen, then every request from `transfer-admin-oversight.API02` is listed, each row linking to that request's detail view.
3. admin-panel-ui.AC3 — Given an authenticated Admin, when they open a specific request's detail view, then `transfer-admin-oversight.API03`'s full field set and `actionHistory` are displayed.
4. admin-panel-ui.AC4 — Given an authenticated Admin, when they view the User Management screen, then every user from `user-management-console.API04` is listed, with actions to create, edit, and delete a user.
5. admin-panel-ui.AC5 — Given an authenticated Admin, when a create/edit/delete user action is submitted, then the corresponding `user-management-console` endpoint (`API01`/`API02`/`API03`) is called and the screen reflects the result; a 4xx error from the API (e.g. duplicate username) is surfaced to the Admin, not silently dropped.
6. admin-panel-ui.AC6 — Given an authenticated Admin, when they view the Department Management screen, then every department from `org-structure-management.API04` is listed, with actions to create, edit, delete, and view detail (`API01`/`API02`/`API03`/`API05`).
7. admin-panel-ui.AC7 — Given an authenticated Admin, when they view the Job Role Management screen, then every job role from `org-structure-management.API09` is listed, with actions to create, edit, and delete (`API06`/`API07`/`API08`) — no detail view, matching the API layer.
8. admin-panel-ui.AC8 — Given a user authenticated as any role other than Admin, when they attempt to navigate to any screen in this spec, then the client redirects them away rather than rendering the screen — a UX convenience only; the actual enforcement is the 403 each consumed endpoint already returns server-side (Non-Functional Constraints).
9. admin-panel-ui.AC9 — Given no authenticated session, when a user attempts to navigate to any screen in this spec, then the client redirects to the Login screen (`stakeholder-panel-ui.AC1`).
10. admin-panel-ui.AC10 — Given a session whose stored `expiresAt` has passed, when any screen in this spec attempts an API call, then the same force-logout behavior defined in `stakeholder-panel-ui.AC2b` applies (session/token handling is shared, single-owned logic, not duplicated per panel).
11. admin-panel-ui.AC11 — Given an authenticated Admin, a Logout control is available at all times within this panel; when clicked, the same voluntary-logout behavior defined in `stakeholder-panel-ui.AC11` applies (clear `localStorage`, redirect to Login) — not a separately implemented Admin-specific logout.
12. admin-panel-ui.AC12 — Given an authenticated Admin, a navigation bar is available at all times within this panel, providing a link to each of the five screens (Dashboard, Transfer Request Monitoring, User Management, Department Management, Job Role Management).
    *(Added 2026-09-21 — closes a real gap found while scoping a visual-polish pass: no screen in this spec had ever linked to any other, so an Admin could only move between screens by typing URLs directly. Not a new business capability, just making the five already-built, already-approved screens reachable from one another.)*

## Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| admin-panel-ui.UT01 | AC1 | Dashboard renders with API01 data | Counts/breakdown displayed match the fetched response |
| admin-panel-ui.UT02 | AC2 | Monitoring list renders with 2 requests from API02 | 2 rows rendered, each linking to its own detail view |
| admin-panel-ui.UT03 | AC3 | Detail view renders for a request with a non-empty actionHistory | All fields and every action-history entry displayed |
| admin-panel-ui.UT04 | AC4 | User list renders with users of multiple roles | Every user from the API response is listed |
| admin-panel-ui.UT05 | AC5 | Create-user form submitted with a duplicate username | API's 4xx error message displayed on the form, not swallowed |
| admin-panel-ui.UT06 | AC6 | Department list renders and a department is deleted | List reflects the removal after API03 succeeds |
| admin-panel-ui.UT07 | AC7 | Job Role list renders | List has no per-row "view detail" action |
| admin-panel-ui.UT08 | AC8 | An Employee-role session attempts to render an Admin Panel screen | Redirected; screen content not rendered |
| admin-panel-ui.UT09 | AC9 | No session present, screen requested | Redirected to Login |
| admin-panel-ui.UT10 | AC10 | Stored `expiresAt` in the past, an Admin screen makes an API call | Force-logout: `localStorage` cleared, redirected to Login |
| admin-panel-ui.UT11 | AC11 | Authenticated Admin clicks Logout | `localStorage` cleared; redirected to Login |
| admin-panel-ui.UT12 | AC12 | Authenticated Admin views any screen | Nav bar links to all 5 screens |

## Explicitly Out of Scope
- The Login screen and session bootstrap (token acquisition, storage, redirect-on-401) — owned by `stakeholder-panel-ui.spec.md`, consumed here only as an already-established session.
- `user-management-console.API06` (the one-time, unauthenticated Admin self-registration bootstrap) — a pre-login setup flow, not an Admin Panel screen; whether it needs any UI at all vs. remaining a direct API call is undecided and not resolved here.
- Filtering/search on the monitoring list or user/department/job-role lists — none of the consumed APIs support it (each source spec's own Explicitly Out of Scope already says so); this spec does not invent client-side filtering the API can't back with real pagination.
- Real-time/live-refresh of dashboard or monitoring data — `transfer-admin-oversight`'s APIs are plain GETs with no stated refresh cadence (BRD-002 Open item); this spec relies on TanStack Query's default refetch behavior (on mount / window refocus) rather than inventing a polling or websocket mechanism.
- Reporting/analytics/export of any data shown here — out of scope project-wide (SOW §10).
- Job Role detail view — not built at the API layer (BRD-004), so not built here either.

## Non-Functional Constraints (from constitution.md)
- Client-side role/session gating (AC8/AC9) is a UX convenience only and is never a substitute for the server-side enforcement each consumed endpoint already performs (Security Posture) — every screen must handle a 401/403 response from its own API calls regardless of the client-side gate.
- No employee personal or compensation data is logged client-side beyond what's rendered on screen; no console/client logging of API responses containing user or compensation data (Security Posture, carried from the consumed specs).
- All server data fetching goes through TanStack Query via custom hooks — no component fetches directly or uses `useEffect` for API calls (Architectural Constraints).
- Approved stack only: Next.js App Router, React functional components, TypeScript strict mode, Tailwind CSS + shadcn/ui, Zustand for session/UI state only (Architectural Constraints).
- Testing: Jest + React Testing Library; no snapshot-only tests for logic-bearing components (Testing Discipline). No numeric coverage floor is set project-wide; this spec does not invent one.
- constitution.md states no numeric latency/perf target exists yet — this spec does not invent one (Non-Functional Baselines).
