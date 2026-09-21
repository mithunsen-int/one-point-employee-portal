# Plan: Stakeholder Panel UI

## Derived From
.ai-context/specs/stakeholder-panel-ui.spec.md (Status: Approved)

## Architecture Approach

- **New frontend module, no new backend module.** `architecture.md`'s Stakeholder Panel UI module (Next.js App Router) gets its first real implementation here — a consumption layer over `rbac-api-security.API02` and `internal-transfer-workflow.API01`–`API10`. Per `int-standards.nextjs.md` #2/#3.1, this lands at `src/modules/stakeholder-panel-ui/`, mirroring `admin-panel-ui.plan.md`'s same feature-based structure (pages, hooks, service layer).
- **Reuses, does not rebuild, the shared `src/shared/auth/` module.** `admin-panel-ui.plan.md`'s `T01` already built this module (session hook, guard components, logout action) implemented strictly to this spec's own `AC1`/`AC2b`/`AC11` contract — the forward-pointer recorded in `status.md` when that decision was made. This plan's Login screen task calls that module's login function (to persist the token/`expiresAt` on success); its layout reuses the same guard/logout components `admin-panel-ui` already uses. No second implementation of token storage, expiry checking, or logout is written here.
- **Service layer** (`src/modules/stakeholder-panel-ui/services/`): `authService.ts` (`rbac-api-security.API02`), `transferRequestsService.ts` (`internal-transfer-workflow.API01`–`API10`), and a small `managersLookupService.ts` (a single read-only call to `user-management-console.API04` filtered to `role: "Manager"`, for `AC9`'s selector). `managersLookupService.ts` is deliberately **not** shared with `admin-panel-ui`'s own `usersService.ts` — that module's CRUD concerns are Admin-only and a different boundary; this is a one-off read, kept local to this module rather than creating a cross-panel dependency beyond the one already-acknowledged shared auth module.
- **Hooks layer** (`src/modules/stakeholder-panel-ui/hooks/`): `useLogin`, `useMyRequests` (`API10`, role-filtered per `AC2c`), `useRequestDetail` (`API02`), `useSubmitRequest` (`API01`, mutation), `useWithdraw` (`API09`, mutation), `useManagerDecision` (`API03`), `useHrDecision` (`API04`), `usePayrollTask`/`useItTask`/`useFacilitiesTask` (`API05`–`API07`), `useHrFinalMapping` (`API08`), `useManagersList` (the filtered `user-management-console.API04` read). Every mutation invalidates `useMyRequests`'/`useRequestDetail`'s query keys on success (`int-standards.nextjs.md` #5).
- **Forms:** Formik + Yup, per `int-standards.nextjs.md` #11 and the same project-standard choice `admin-panel-ui.plan.md` already made — used for the Submit Request form (`AC3`), Manager/HR decision forms (`AC6`/`AC7`, Yup enforcing the required-reason-on-reject rule client-side before submit), the three task-completion forms (`AC8` — three separate Yup schemas, since Payroll/IT/Facilities each has a structurally different payload), and the final-mapping form (`AC9`).
- **Route structure:** Next.js App Router pages under `src/app/(stakeholder)/` — `login`, `my-requests` (the `AC2c` list), `transfer-requests/new` (`AC3`), `my-requests/[id]` (adapts its rendered actions by the viewer's role and the request's status, per `AC4`–`AC9` — one adaptive detail/action screen, not five near-duplicate ones, since they all read the same `API02`-shaped data and differ only in which action panel is shown). **Corrected 2026-09-20, found while scoping `T03`:** originally planned as `transfer-requests/[id]`, which is a real, previously-uncaught collision — Next.js route groups don't affect the actual URL, and `admin-panel-ui.plan.md` already claims that exact path for its own (different, Admin-only, read-only) detail screen, already Merged as `admin-panel-ui.T05`. Nested under `my-requests` instead — the list screen this detail view actually belongs to — rather than changing the already-Merged admin route. **Extended 2026-09-20 (`AC12`):** the app's root route, `src/app/page.tsx` (outside any route group — Next.js's default, still the unmodified `create-next-app` scaffold until now), is claimed by this plan too, since it's the same role-redirect decision `AC1`/this panel's `login` route already own, applied to one more entry point.

## Data Model

**N/A — no new MongoDB collection, no new Mongoose schema.** Same as `admin-panel-ui.plan.md`: zero backend capability introduced. TypeScript interfaces mirror each consumed response shape (`LoginResponse`, `MyRequestsListItem` from `API10`, `RequestDetail` from `API02`, plus the request/response shapes for each action endpoint), defined once in the service layer per `int-standards.nextjs.md` #4.4. The Database Layer section of `int-standards.nextjs.md` doesn't apply — no route handler is written by this plan.

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first for every endpoint/state-changing op (Testing Discipline) | ✓ | No new endpoint exists to test-first; extended to every hook/logic-bearing component in this plan's own scope, per this project's standing test-first discipline. |
| Jest + RTL, no snapshot-only tests for logic-bearing components (Testing Discipline) | ✓ | RTL covers every screen; the required-reason-on-reject and role-adaptive rendering logic in particular get real assertion-based tests, not snapshots. |
| Mongoose schema validators tested (Testing Discipline) | N/A | No new schema introduced. |
| Coverage floor (Testing Discipline) | ✓ | None set project-wide; not invented here. |
| Storing the JWT in `localStorage` (Security Posture) | ✓ | Already an explicit, accepted decision recorded in the spec's own Non-Functional Constraints (post-Gate-1) — not re-litigated here; this plan's Login task simply calls the already-built shared module that implements it. |
| No employee personal/compensation data in logs (Security Posture) | ✓ | Payroll's task-completion screen in particular renders but never logs salary/compensation/tax fields, per the spec's own explicit carry-forward from `internal-transfer-workflow`. |
| Role-based authorization enforced server-side (Security Posture) | ✓ | Every consumed endpoint already enforces this independently. This plan's client-side action visibility (`AC5`–`AC8`) is documented UX only — every hook must still handle a 401/403/409 from its own call. |
| MongoDB sole datastore, no new datastore (Architectural Constraints) | ✓ | No datastore touched — pure frontend. |
| No client-supplied object into a Mongoose filter unvalidated (Security Posture) | N/A | No route handler is written by this plan. |
| Secrets/credentials never hardcoded or logged (Security Posture) | ✓ | No token handling occurs in this plan's own code — delegated entirely to the already-built shared `src/shared/auth/` module. |
| Approved stack only (Architectural Constraints) | ✓ | Next.js App Router, React functional components, TypeScript strict, Tailwind + shadcn/ui, TanStack Query, Formik + Yup (per `int-standards.nextjs.md` #11, already committed, not newly introduced here) — no additional library. |
| No new datastore/client-state library/external integration without ADR (Architectural Constraints) | ✓ | None introduced; Formik + Yup already justified as non-state-management tooling in `admin-panel-ui.plan.md`. |
| All server fetching via TanStack Query custom hooks, no direct fetch/`useEffect` (Architectural Constraints) | ✓ | Every read/write goes through the hooks layer described above. |
| No numeric latency/throughput/availability targets invented (Non-Functional Baselines) | ✓ | None stated in `constitution.md`; none invented here. |
| Approved API Contract changes require spec revision + new Gate 1 (Versioning Rules) | N/A | This plan changes no API Contract — the one spec-level amendment needed (`API10`'s reference, `AC2c`) was already made directly to the spec, before this plan was drafted, per the user's explicit decision to keep it `Approved` rather than treat it as a new revision cycle. |

**Rate limit decisions:** N/A — this plan introduces no new endpoint. Every consumed endpoint's rate-limit decision is already fixed in its own plan (`rbac-api-security.plan.md`'s login-specific rate limit; `internal-transfer-workflow.plan.md`'s "none, deferred" for the rest); not re-decided here.

## Explicitly Deferred

- The shared session module itself (token storage, expiry check, force-logout, voluntary logout) — already built by `admin-panel-ui.plan.md`'s `T01`; this plan only consumes it.
- Any Admin Panel screen (dashboard, monitoring, user/org management) — entirely `admin-panel-ui.spec.md`'s scope.
- A token refresh flow, and server-side token revocation before natural expiry — per spec, explicitly out of scope (`ADR-0001`); not invented here.
- Notifications and SLA/escalation indicators — out of scope project-wide.

## Sequencing

1. `StakeholderPanelLayout` (route guard reusing the shared module's guard component, `AC10`) + Login screen (`AC1`, `AC2`, calling the shared module's login function) + Logout control (`AC11`, reusing the shared module's logout action). Every other step composes inside this layout.
2. "My Requests" / "Pending Actions" list screen (`AC2c`) — `useMyRequests` hook over `API10`, role-filtered rendering, each item linking into Step 4's adaptive detail/action screen.
3. Submit Request screen (`AC3`) — Employee-only Formik/Yup form over `useSubmitRequest`.
4. The adaptive request detail/action screen: Employee own-status view + Withdraw (`AC4`, `AC5`), via `useRequestDetail`/`useWithdraw`.
5. Manager Decision panel within that same screen (`AC6`) — `useManagerDecision`, Yup-enforced required reason on reject.
6. HR Decision panel (`AC7`) — `useHrDecision`, same required-reason pattern.
7. Payroll/IT/Facilities task-completion panels — three structurally distinct forms (`AC8`), `usePayrollTask`/`useItTask`/`useFacilitiesTask`.
8. HR Final Mapping panel (`AC9`) — `useHrFinalMapping` plus `useManagersList` for the selector.
9. Root route redirect (`AC12`, added 2026-09-20) — `src/app/page.tsx` checks the session on mount and redirects to Login (none/expired) or the role's home page (valid), via a new shared `homeRouteForRole` helper reused by `LoginForm.tsx`'s own existing post-login redirect so the Admin-vs-everyone-else decision lives in exactly one place. Login itself gets the same already-authenticated check added, so it doesn't show the form to someone already holding a valid session.
10. **Visual-polish pass + navigation (`AC13`, added 2026-09-21)** — `StakeholderPanelLayout` gains a nav bar (My Requests for every role; Submit Request for Employee only, read from the session's own decoded role); every screen/panel (`MyRequestsList`, `SubmitRequestForm`, `RequestDetail` and its 6 embedded role panels, `LoginForm`) gets consistent Tailwind spacing/typography, matching the same convention `admin-panel-ui.T09` establishes for its own panel. No new behavior beyond the nav links — existing content/structure is restyled, not changed.
