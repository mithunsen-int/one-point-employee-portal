# Spec: Stakeholder Panel UI

## Spec ID
stakeholder-panel-ui

## Status
In QA
*(Reopened `In QA` → `In Development` → `In QA` 2026-09-21 via `T13`, adding navigation and a visual-polish pass. All 13 tasks now Merged.)*

## Linked BRD
.ai-context/BRD.md#BRD-008

## Intent
Every role that participates in the transfer workflow — Employee, Manager, HR, Payroll, IT, Facilities — currently has no way to submit or act on a transfer request except by calling a REST API directly. This spec builds the Stakeholder Panel UI (`architecture.md`'s module, backing BRD-001): the shared Login screen used by every role in the system (including Admin, who is then routed to `admin-panel-ui`), and the role-specific request screens — submit, view own status, approve/reject, complete a task, final manager mapping, withdraw — each a thin consumption layer over an already-Merged `internal-transfer-workflow` endpoint (BRD-008; SOW §1, §7, §8).

## Context
- Builds on: .ai-context/architecture.md (Stakeholder Panel UI module; Client State section — TanStack Query for all server data). Session token is persisted to `localStorage` (AC1/AC2b) rather than held only in Zustand, since Zustand's own in-memory state doesn't survive a page refresh; Zustand still holds the decoded role/identity for UI-gating purposes, sourced from the `localStorage`-persisted token.
- Related: .ai-context/specs/internal-transfer-workflow.spec.md (Status: In QA) — every request-lifecycle screen consumes `API01`–`API09` directly; `API10` (added 2026-09-19, after this spec's own Gate 1) is the discovery mechanism `AC2c` depends on — this spec was amended post-approval to reference it once the gap was found, per `status.md`'s same-day entry, rather than left silently unaddressed.
- Related: .ai-context/specs/rbac-api-security.spec.md (Status: In QA) — the Login screen consumes `API02` directly; every other screen requires the resulting authenticated session, enforced server-side by that spec's contract.
- Related: .ai-context/specs/user-management-console.spec.md (Status: In QA) — the HR final-mapping screen (`AC9` below) needs the list of Managers to populate a selector, read via that spec's `API04` filtered to `role: "Manager"`; no write access to user records from this spec.
- Related: .ai-context/specs/admin-panel-ui.spec.md (Status: Draft v1.0) — sibling spec; an Admin authenticating through this spec's Login screen is routed there instead of into this panel.
- Related: .ai-context/specs/application-constants-management.spec.md (Status: In QA) — the transfer-request form's static dropdown values (excluding Departments/Job Roles, which are live CRUD data per BRD-004) are imported from that spec's frontend constants module, not fetched over the network.

## API Contract
This spec exposes no new endpoints. It consumes the following already-Approved contracts; payload shapes, status codes, and exceptions are defined at their source and not restated here (sdd-methodology.md #11.2):

| Consumed | Screen | Notes |
|---|---|---|
| `rbac-api-security.API02` — POST /auth/login | Login | Shared entry point for all roles, including Admin. |
| `internal-transfer-workflow.API01` — POST /transfer-requests | Submit request | Employee only, per that endpoint's own 403 contract. |
| `internal-transfer-workflow.API02` — GET /transfer-requests/{id} | Own-request status view | Returns `actionHistory` and `pendingStakeholders` inline; this spec does not separately call `transfer-audit-trail.API02`. |
| `internal-transfer-workflow.API03` — manager-decision | Manager approve/reject | |
| `internal-transfer-workflow.API04` — hr-decision | HR approve/reject | |
| `internal-transfer-workflow.API05`/`API06`/`API07` — payroll/it/facilities-task | Task completion | Payroll's screen additionally offers "No Action Needed", per that endpoint's own contract. |
| `internal-transfer-workflow.API08` — hr-final-mapping | HR final manager mapping | Manager selector populated from `user-management-console.API04` (role: Manager) — see Context. |
| `internal-transfer-workflow.API09` — withdraw | Employee withdraw | |
| `internal-transfer-workflow.API10` — GET /transfer-requests/mine | Own-requests / pending-actions list | Role-filtered server-side (added 2026-09-19, after this spec was first drafted — see `AC2c`). This is how every screen below discovers *which* request(s) to show, before drilling into one via `API02`/`API03`/`API04`/etc. |

## Acceptance Criteria
1. stakeholder-panel-ui.AC1 — Given valid credentials, when a user submits the one shared Login form (there is exactly one login endpoint — no separate Admin login screen exists), then `rbac-api-security.API02`'s `access_token` and `expires_in` are stored in `localStorage` (token itself, plus a computed `expiresAt = login time + expires_in`), and the user is routed to `admin-panel-ui` if their role is Admin or into this panel otherwise, based on the role decoded from the response.
2. stakeholder-panel-ui.AC2 — Given invalid credentials, when a user submits the Login form, then the API's 401 is surfaced as an on-screen error and no session is established.
3. stakeholder-panel-ui.AC2b — Given a stored `expiresAt` that is in the past, when any subsequent API call is attempted (from either this spec's screens or `admin-panel-ui`'s), then the client force-logs-out — clears the stored token/`expiresAt` from `localStorage` and redirects to Login — without waiting for the API to reject the request. A 401 returned by an API call for any other reason (e.g., the server invalidating the token before its stated expiry) triggers the same force-logout as a fallback, since no revocation/refresh mechanism exists (`ADR-0001`).
4. stakeholder-panel-ui.AC2c — Given an authenticated user in any non-Admin role, when they land on their "My Requests" (Employee) or "Pending Actions" (Manager/HR/Payroll/IT/Facilities) screen, then `internal-transfer-workflow.API10` is called and its role-filtered results are listed; each item links to that specific request's own-status view (`AC4`, Employee) or role-specific action screen (`AC6` Manager, `AC7`/`AC9` HR, `AC8` Payroll/IT/Facilities) — this is the only navigation path into those screens, closing the gap where earlier drafts of this spec described what each screen shows without saying how a user reaches it.
5. stakeholder-panel-ui.AC3 — Given an authenticated Employee, when they submit the transfer request form, then `internal-transfer-workflow.API01` is called with the entered fields; a 400/403/404 response from the API is surfaced on the form, not silently dropped.
6. stakeholder-panel-ui.AC4 — Given an authenticated Employee viewing their own request (reached from `AC2c`'s list), then `internal-transfer-workflow.API02`'s status, action history, and pending stakeholders are displayed.
7. stakeholder-panel-ui.AC5 — Given an authenticated Employee viewing their own request while it is `Pending: Manager`, then a Withdraw action calling `API09` is available; for every other status, it is not shown — a UX convenience only, not a substitute for the API's own 409 enforcement (Non-Functional Constraints).
8. stakeholder-panel-ui.AC6 — Given an authenticated Manager viewing a request assigned to them (reached from `AC2c`'s list), then Approve/Reject actions calling `API03` are available; Reject requires a reason to be entered before the action can be submitted, mirroring the API's own required-reason contract.
9. stakeholder-panel-ui.AC7 — Given an authenticated HR user viewing a request in `Pending: HR` (reached from `AC2c`'s list), then Approve/Reject actions calling `API04` are available, with the same required-reason-on-reject behavior as AC6.
10. stakeholder-panel-ui.AC8 — Given an authenticated Payroll, IT, or Facilities user viewing a request in `Pending: Payroll, IT, Facilities` (reached from `AC2c`'s list), then a Complete-task action calling that role's own endpoint (`API05`/`API06`/`API07`) is available; Payroll's screen additionally offers "No Action Needed".
11. stakeholder-panel-ui.AC9 — Given an authenticated HR user viewing a request with every Payroll/IT/Facilities task complete (reached from `AC2c`'s list), then a final-mapping screen calling `API08` is available, offering a selector populated from the list of Managers (`user-management-console.API04`, filtered to `role: "Manager"`).
10. stakeholder-panel-ui.AC10 — Given no authenticated session, when a user attempts to navigate to any screen in this spec other than Login, then the client redirects to Login.
11. stakeholder-panel-ui.AC11 — Given an authenticated session (any role, in either this panel or `admin-panel-ui`), a Logout control is available at all times; when clicked, the client clears the stored token/`expiresAt` from `localStorage` (same clearing behavior as the force-logout in `AC2b`, triggered voluntarily rather than by expiry/401) and redirects to Login.
12. stakeholder-panel-ui.AC12 — Given the application's root route (`/`), when a user visits it, then the client checks for a valid (non-expired) session: with none, it redirects to Login; with one, it redirects to the role's home page (`admin-panel-ui`'s `/dashboard` for Admin, `/my-requests` otherwise) — the exact same role-routing decision `AC1` already makes on a fresh login, reused rather than re-derived. The same already-authenticated redirect also applies to Login itself — a user who navigates there directly while already holding a valid session is redirected to their home page rather than shown the form again.
    *(Added 2026-09-20 — closes a real, previously-unnoticed gap: the root route was never assigned to any spec, so `/` was still the unmodified Next.js scaffold page, with no path at all from the bare site URL into either panel. Not a new capability requiring a fresh BRD entry — a small extension of `BRD-008`'s already-resolved session/redirect behavior (the same decision `AC1` already makes), applied to two more entry points. By explicit user instruction, recorded as a spec amendment only, no BRD change.)*
13. stakeholder-panel-ui.AC13 — Given an authenticated user in this panel, a navigation bar is available at all times, linking to "My Requests" / "Pending Actions" (`AC2c`'s list, every role) and, for an Employee specifically, "Submit Request" (`AC3`) — the link an Employee needs is always visible to them; other roles aren't shown a link to a screen that would just reject them (`SubmitRequestForm`'s own existing role gate).
    *(Added 2026-09-21 — same origin as `admin-panel-ui.AC12`: no screen in this spec had ever linked to any other, so a user could only move between screens by typing URLs directly. Recorded as a spec amendment only, no BRD change, same reasoning as `AC12`.)*

## Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| stakeholder-panel-ui.UT01 | AC1 | Login submitted with valid Employee credentials | Session established; routed into the Stakeholder Panel, not Admin Panel |
| stakeholder-panel-ui.UT01b | AC1 | Login submitted with valid Admin credentials | Session established; routed to `admin-panel-ui` |
| stakeholder-panel-ui.UT02 | AC2 | Login submitted with an invalid password | On-screen error shown; no session established |
| stakeholder-panel-ui.UT02b | AC2b | Stored `expiresAt` is in the past, then an API call is attempted | Call is not sent (or its result is ignored); `localStorage` cleared; redirected to Login |
| stakeholder-panel-ui.UT02c | AC2b | Stored `expiresAt` is still in the future, but the API responds 401 anyway | Same force-logout behavior triggered by the 401 fallback |
| stakeholder-panel-ui.UT02d | AC2c | Manager with 1 pending-decision request lands on "Pending Actions" | API10 called; 1 item listed, linking to the Manager decision screen |
| stakeholder-panel-ui.UT03 | AC3 | Submit form filled and submitted with all required fields | API01 called with the entered payload |
| stakeholder-panel-ui.UT04 | AC4 | Own-request view rendered for a request with a non-empty action history | Status, history, and pending stakeholders all displayed |
| stakeholder-panel-ui.UT05 | AC5 | Own-request view rendered for a request in `Pending: HR` | Withdraw action not shown |
| stakeholder-panel-ui.UT06 | AC6 | Manager attempts to submit Reject with no reason entered | Submission blocked client-side before API03 is called |
| stakeholder-panel-ui.UT07 | AC7 | HR approves a request in `Pending: HR` | API04 called with `decision: "approve"` |
| stakeholder-panel-ui.UT08 | AC8 | Payroll marks their task "No Action Needed" | API05 called with that option |
| stakeholder-panel-ui.UT09 | AC9 | HR opens final-mapping screen | Manager selector populated from the filtered API04 response |
| stakeholder-panel-ui.UT10 | AC10 | No session present, a request-detail route requested | Redirected to Login |
| stakeholder-panel-ui.UT11 | AC11 | Authenticated user clicks Logout | `localStorage` cleared; redirected to Login |
| stakeholder-panel-ui.UT12 | AC12 | No session visits `/` | Redirected to `/login` |
| stakeholder-panel-ui.UT12b | AC12 | Admin session visits `/` | Redirected to `/dashboard` |
| stakeholder-panel-ui.UT12c | AC12 | Non-Admin session visits `/` | Redirected to `/my-requests` |
| stakeholder-panel-ui.UT12d | AC12 | Already-authenticated session visits `/login` directly | Redirected to the role's home page, form not shown |
| stakeholder-panel-ui.UT13 | AC13 | Authenticated Employee views any screen | Nav links to My Requests and Submit Request |
| stakeholder-panel-ui.UT13b | AC13 | Authenticated non-Employee (e.g. Manager) views any screen | Nav links to My Requests only, no Submit Request link |

## Explicitly Out of Scope
- Registering new users, or any User/Department/Job Role management screen — owned by `admin-panel-ui.spec.md`.
- Viewing any request other than one's own (Employee) or one currently routed to the viewer's role (Manager/HR/Payroll/IT/Facilities) — the unrestricted, any-request detail view is `admin-panel-ui.AC3`, Admin-only.
- A token **refresh** flow (silently renewing an about-to-expire token without forcing re-login) — `ADR-0001` leaves this undecided project-wide, and this spec doesn't invent one. On expiry, the only behavior is force-logout (AC2b), never a silent refresh.
- Server-side token revocation before natural expiry — `ADR-0001` states no revocation/denylist mechanism exists; a force-logout (AC2b) only clears the client's copy, it cannot invalidate the token itself before `expires_in` elapses.
- Notifications of any kind (email/SMS/push, or an in-app toast beyond the on-screen result of the action just taken) — out of scope project-wide (SOW §10).
- SLA/escalation indicators (e.g., "this request has been pending N days") — no SLA mechanism exists anywhere in this project (BRD-001 Decided).

## Non-Functional Constraints (from constitution.md)
- **Storing the JWT in `localStorage` is an explicit, accepted decision, not an oversight.** `localStorage` is readable by any script running on the page, so this carries real XSS exposure that an in-memory-only or `httpOnly`-cookie approach would avoid — constitution.md's Security Posture doesn't prohibit this choice, and no XSS-specific mitigation beyond React's own default output-escaping is decided here. Flagged plainly so this trade-off is visible at Gate 1, not discovered later.
- Client-side role/session gating (AC5, AC6–AC9's role-specific action visibility, AC10) is a UX convenience only and is never a substitute for the server-side enforcement each consumed endpoint already performs (Security Posture) — every screen must handle a 401/403/409 response from its own API calls regardless of the client-side gate.
- No employee personal or compensation data is logged client-side; Payroll's task-completion screen in particular must never log the salary/compensation/tax fields it may display (Security Posture, carried from `internal-transfer-workflow`).
- All server data fetching goes through TanStack Query via custom hooks — no component fetches directly or uses `useEffect` for API calls (Architectural Constraints).
- Approved stack only: Next.js App Router, React functional components, TypeScript strict mode, Tailwind CSS + shadcn/ui, Zustand for session/UI state only (Architectural Constraints).
- Testing: Jest + React Testing Library; no snapshot-only tests for logic-bearing components (Testing Discipline). No numeric coverage floor is set project-wide; this spec does not invent one.
- constitution.md states no numeric latency/perf target exists yet — this spec does not invent one (Non-Functional Baselines).
