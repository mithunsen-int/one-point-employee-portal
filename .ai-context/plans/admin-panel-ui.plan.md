# Plan: Admin Panel UI

## Derived From
.ai-context/specs/admin-panel-ui.spec.md (Status: Approved)

## Architecture Approach

- **New frontend module, no new backend module.** `architecture.md`'s Admin Panel UI module (Next.js App Router) gets its first real implementation here — a pure consumption layer over `transfer-admin-oversight`, `user-management-console`, and `org-structure-management`'s already-Merged APIs. Per `int-standards.nextjs.md` #2/#3.1's feature-based structure, this lands at `src/modules/admin-panel-ui/`, with sub-folders for pages, hooks, and a thin service layer — not a technical-type split (`components/`, `utils/`) at the project root.
- **Service layer** (`src/modules/admin-panel-ui/services/`): one file per consumed backend spec — `dashboardService.ts` and `monitoringService.ts` (`transfer-admin-oversight.API01`–`API03`), `usersService.ts` (`user-management-console.API01`–`API05`), `orgStructureService.ts` (`org-structure-management.API01`–`API09`). Each is a thin `fetch` wrapper returning typed data; no component calls `fetch` directly (`int-standards.nextjs.md` #5).
- **Hooks layer** (`src/modules/admin-panel-ui/hooks/`): one TanStack Query hook per screen's read (`useDashboard`, `useTransferRequestsList`, `useTransferRequestDetail`, `useUsers`, `useDepartments`, `useJobRoles`) plus one mutation hook per write action (`useCreateUser`/`useEditUser`/`useDeleteUser`, and the Department/Job Role equivalents), each invalidating the relevant list query on success (`int-standards.nextjs.md` #5 — "invalidate or update queries after mutations").
- **Forms** (`AC5`'s create/edit user, and Department/Job Role create/edit): Formik + Yup, per `int-standards.nextjs.md` #11 — this is not a new, plan-invented choice; the project's own frontend standard already commits every form in the project to this pairing, and this plan is simply the first to need one. Flagged explicitly since `constitution.md`'s own Architectural Constraints list doesn't separately name a form library.
- **Cross-spec build assignment, decided explicitly rather than left blocked.** Every screen in this spec needs a route guard (`AC8`/`AC9`/`AC10`) and a Logout control (`AC11`), whose underlying session mechanics — reading the `localStorage` token, decoding the role, checking `expiresAt`, clearing on expiry/401/manual logout — are normatively defined by `stakeholder-panel-ui.spec.md`'s own contract (`AC1`/`AC2b`/`AC11`), not this spec's. Rather than block this plan on `stakeholder-panel-ui.plan.md` (not yet drafted), **this plan's `T01` builds the shared `src/shared/auth/` module itself** (session hook, guard components, logout action), implemented strictly to `stakeholder-panel-ui.AC1`/`AC2b`/`AC11`'s already-Approved contract — not this plan's own invention of the behavior, just its first implementation. `stakeholder-panel-ui.plan.md`, when drafted, must reuse this module rather than rebuild it; its own Login-screen task only needs to call into it (write the token/`expiresAt` on success). This decision is recorded here **and must be carried into `stakeholder-panel-ui.plan.md`'s own Architecture Approach** when that plan is drafted, so a future reader isn't confused about why a session module implementing `stakeholder-panel-ui`'s ACs was built by an `admin-panel-ui` task — see `status.md`'s forward-pointer note.
- **Route structure:** Next.js App Router pages under `src/app/(admin)/` — `dashboard`, `transfer-requests`, `transfer-requests/[id]`, `users`, `departments`, `job-roles` — each a thin page component composing the module's hooks/components, per `int-standards.nextjs.md` #3.2's Data Flow (UI → Hooks → State → Service → Backend).

## Data Model

**N/A — no new MongoDB collection, no new Mongoose schema.** This plan introduces zero backend capability, exactly as the spec states. The closest equivalent "data model" is a set of TypeScript interfaces mirroring each consumed API response shape (`DashboardSummary`, `TransferRequestListItem`, `TransferRequestDetail`, `UserListItem`, `UserDetail`, `DepartmentListItem`, `JobRoleListItem`), defined once in the service layer and reused by hooks/components, per `int-standards.nextjs.md` #4.4 ("define strict interfaces for API responses"). `int-standards.nextjs.md`'s Database Layer section (Mongoose validators, NoSQL-injection guarding) does not apply to this plan — no route handler is written here.

## Constitution Check

| Rule | ✓ | Justification |
|---|---|---|
| Test-first for every endpoint/state-changing op (Testing Discipline) | ✓ | No new endpoint exists to test-first. Extended to this plan's actual units of work: every hook and every logic-bearing component gets a Red RTL/hook test before implementation, per this project's standing test-first discipline (not just the literal "endpoint" wording). |
| Jest + RTL, no snapshot-only tests for logic-bearing components (Testing Discipline) | ✓ | RTL covers every screen/component; no bare snapshot test is used as the sole coverage for anything with conditional logic (e.g., role-gating, the duplicate-username error path). |
| Mongoose schema validators tested (Testing Discipline) | N/A | No new schema introduced. |
| Coverage floor (Testing Discipline) | ✓ | None set project-wide; not invented here. |
| No employee personal/compensation data in logs (Security Posture) | ✓ | No `console.log`/logger call anywhere in this plan's scope touches API response data; errors surfaced to the Admin are rendered on-screen, not logged with payload content. |
| Role-based authorization enforced server-side (Security Posture) | ✓ | Every consumed endpoint already enforces this independently (verified at each source spec's own Gate 2). This plan's client-side route guard (`AC8`) is explicitly documented as UX only — every hook must still handle a 401/403 response from its own call. |
| No external identity/system integration (Security Posture) | N/A | This plan doesn't touch the authentication mechanism itself, only consumes its result. |
| MongoDB sole datastore, no new datastore (Architectural Constraints / Security Posture) | ✓ | No datastore touched at all — pure frontend. |
| No client-supplied object into a Mongoose filter unvalidated (Security Posture) | N/A | No route handler is written by this plan. |
| Secrets/credentials never hardcoded or logged (Security Posture) | ✓ | The API base URL is the only configuration value this plan needs; sourced from an environment variable, never hardcoded. No token handling occurs in this plan's own code (owned by `stakeholder-panel-ui`). |
| Audit records immutable (Security Posture) | N/A | This plan writes no audit entries. |
| Approved stack only (Architectural Constraints) | ✓ | Next.js App Router, React functional components, TypeScript strict, Tailwind + shadcn/ui, TanStack Query, plus Formik + Yup per `int-standards.nextjs.md` #11 (see Architecture Approach) — no additional library introduced beyond what's already committed project-wide. |
| No new datastore/client-state library/external integration without ADR (Architectural Constraints) | ✓ | Formik + Yup is not a *state-management* library (it doesn't compete with Zustand/TanStack Query's roles) and is already named in `int-standards.nextjs.md`'s committed stack, not a new undecided choice — no ADR triggered. |
| Departments/Roles are DB-backed CRUD vs. codebase constants distinction (Architectural Constraints) | ✓ | This plan doesn't alter that mechanism, only renders screens against `org-structure-management`'s existing CRUD API and (for any other dropdown) `application-constants-management`'s frontend constants module. |
| All server fetching via TanStack Query custom hooks, no direct fetch/`useEffect` (Architectural Constraints) | ✓ | Every read/write goes through the hooks layer described above; no component calls `fetch` or uses `useEffect` for data. |
| No numeric latency/throughput/availability targets invented (Non-Functional Baselines) | ✓ | None stated in `constitution.md`; none invented here. |
| Approved API Contract changes require spec revision + new Gate 1 (Versioning Rules) | N/A | This plan changes no API Contract — it only consumes already-fixed contracts. |

**Rate limit decisions:** N/A — this plan introduces no new endpoint. Every consumed endpoint's rate-limit decision was already fixed in its own plan (`transfer-admin-oversight.plan.md`, `user-management-console.plan.md`, `org-structure-management.plan.md`), each "none, deferred" for authenticated, non-public surfaces; not re-decided here.

## Explicitly Deferred

- **The Login screen itself** (the form, submit handler, credential fields, invalid-credential error display) — `stakeholder-panel-ui.AC1`/`AC2` remain that spec's own scope; this plan builds the shared session *module* those ACs' behavior is implemented against (see Architecture Approach), not the screen that first populates it.
- The transfer-request submission and lifecycle-action screens (`stakeholder-panel-ui.AC3`–`AC9`) — entirely that spec's scope, untouched by this plan.
- `user-management-console.API06` (Admin self-registration bootstrap) UI, if any — per spec, undecided; not built here.
- Filtering/search, real-time refresh, export/reporting on any screen — per spec, out of scope; this plan does not invent client-side versions of capabilities the consumed APIs don't back.
- Job Role detail view — not built at the API layer; not built here.

## Sequencing

1. Shared `src/shared/auth/` module (session hook, guard components, logout action — implementing `stakeholder-panel-ui.AC1`/`AC2b`/`AC11`'s contract, per the Architecture Approach decision above) **plus** `AdminPanelLayout`, the route guard, and the Logout control that consume it (`AC8`, `AC9`, `AC10`, `AC11`). No longer blocked on a separate plan — built here. Every other step composes inside this layout.
2. Dashboard screen (`AC1`) — `useDashboard` hook over `dashboardService.ts`.
3. Transfer Request Monitoring list screen (`AC2`) — `useTransferRequestsList` hook, each row linking to Step 4.
4. Transfer Request Detail screen (`AC3`) — `useTransferRequestDetail` hook, rendering the full field set plus `actionHistory`.
5. User Management screen (`AC4`, `AC5`) — list + Formik/Yup create/edit forms + delete action, `useUsers` plus mutation hooks.
6. Department Management screen (`AC6`) — list + detail + Formik/Yup create/edit forms + delete action, `useDepartments` plus mutation hooks.
7. Job Role Management screen (`AC7`) — list + Formik/Yup create/edit forms + delete action, `useJobRoles` plus mutation hooks (no detail view, matching the API).
8. **Visual-polish pass + navigation (`AC12`, added 2026-09-21)** — `AdminPanelLayout` gains a nav bar linking to all 5 screens; every screen (`Dashboard`, `MonitoringList`, `TransferRequestDetail`, `UserManagement`, `DepartmentManagement`, `JobRoleManagement`) gets consistent Tailwind spacing/typography and, where they render tabular/form content, the already-adopted shadcn/ui `Table`/`Card`/`Button`/`Input`/`Label` primitives applied consistently rather than plain HTML. No new behavior beyond the nav links themselves — existing content/structure is restyled, not changed, so every existing RTL test's text/role queries must keep passing unmodified.
9. **Create User form's Manager field becomes a selector (`AC5`, added 2026-09-21)** — the user asked for the Manager field, shown when `role: "Employee"`, to be a list of available Managers rather than a free-text ID input. `UserManagement.tsx` already fetches every user (as Admin, unfiltered) via its own `useUsers()` — filtering that already-in-memory list to `role === "Manager"` populates the selector with zero new endpoint or service call needed.
