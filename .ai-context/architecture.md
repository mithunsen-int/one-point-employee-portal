# Architecture — Internal Transfer Journey System

_Living document — keep current or don't trust it (sdd-methodology.md #17). High-level only; implementation detail belongs in each feature's plan.md, not here._

## Modules

| Module | Layer | Responsibility | Backing BRD |
|---|---|---|---|
| Admin Panel UI | Next.js (App Router) | Dashboard, user/org management screens, request monitoring | BRD-002, BRD-003, BRD-004 |
| Stakeholder Panel UI | Next.js (App Router) | Role-specific request views (Employee, Manager, HR, Payroll, IT, Facilities) | BRD-001 |
| Auth/RBAC Service | API layer | Authenticates users, enforces role-based authorization on every endpoint | BRD-007 |
| Workflow Engine Service | API layer | Owns transfer-request state machine: submission, manager gate, HR gate, parallel task tracking, final mapping, completion | BRD-001 |
| User Management Service | API layer | CRUD for all six user roles; enforces Admin/HR-only Employee registration | BRD-003 |
| Org Structure Service | API layer | CRUD for Departments/Business Units and Roles/Jobs | BRD-004 |
| Audit Logging Service | API layer | Appends an immutable actor/action/timestamp record for every state-changing operation across all modules | BRD-006 |
| Data Layer | MongoDB + Mongoose | Persists Users, Departments, Roles, TransferRequests, AuditLogs | int-standards.nextjs.md #1 |

**Application constants (BRD-005) are not a service or a Data Layer entity.** All static reference values except Departments/Roles live in a dedicated, single-source JavaScript module per layer — one in the frontend codebase, one in the backend codebase — imported directly wherever needed, not fetched over HTTP. There is no API surface and no runtime file for this; updates happen through code change and redeployment.

## Client State

- **TanStack Query** — all server data (requests, users, org entities, dashboard counts) fetched and cached through custom hooks; no component fetches directly.
- **Zustand** — lightweight global UI/auth state only (e.g., current session role); not used for server data.

## Integration Points — Clarification

The SOW's Payroll, IT, and Facilities "stakeholders" are **internal role-based participants in the Workflow Engine**, not external systems — they act through the same Stakeholder Panel UI and Workflow Engine API as Manager and HR do. There is no external HRMS, Payroll system, or IT service-desk integration in this phase (BRD-001, BRD-007 assumption carried from SOW §9). This project has **no external integration points** at all in the current phase; if that changes, it is a constitution-level and architecture-level amendment, not an assumption to quietly build around.

## Data Flow

```
[Stakeholder Panel UI] → [Auth/RBAC Service] → [Workflow Engine Service] → [Data Layer: TransferRequests]
                                                        │
                                                        ├──► [Audit Logging Service] → [Data Layer: AuditLogs]
                                                        │      (every transition, on every module, is logged here)
                                                        │
                                                        └──► on HR approval, spawns 3 independent task records:
                                                             Payroll task | IT task | Facilities task
                                                             (each completed independently; none blocks another)

[Admin Panel UI] → [User Management / Org Structure Services] → [Data Layer]
                 → [Workflow Engine Service] (read-only: monitoring/dashboard queries)

[Any UI needing a static reference value] → [that layer's own constants module]  (in-process import, no network call)
```

- Dashboard and Transfer Request Monitoring (BRD-002) read from the same `TransferRequests` and `AuditLogs` collections the Workflow Engine writes to — no separate reporting store, consistent with "no reporting/analytics beyond basic counts" being out of scope.
- Application constants (BRD-005) are read via direct import from each layer's own module — Departments and Roles are the explicit exception, served from the Data Layer instead (BRD-004).

## ADRs

- **ADR-0001 — JWT bearer-token authentication for API access** (`.ai-context/decisions/ADR-0001-jwt-authentication.md`). Decided while completing `rbac-api-security.spec.md`'s API02 (login) contract — BRD-007 left the authentication mechanism undecided, and the choice meets the #13 significance bar (cross-cutting to every other spec's `Related:` list; reversing it later costs well over a day of rework). Does not decide token revocation or refresh-flow — both explicitly deferred, see the ADR's Consequences.

This ADR was created at spec-completion stage rather than plan stage, since the decision was blocking the spec's own API Contract section from being written — sdd-methodology.md #13 ties the ADR requirement to a decision's significance, not to which artefact happens to be in progress when it's made.

## Open Architectural Questions (not decided — do not resolve here)

See `discovery-analysis.md`'s Open Questions table for the full list; the ones with direct architectural weight are the authentication mechanism (BRD-007) and the Payroll/IT/Facilities task failure path (BRD-001) — both must be resolved at spec/plan stage, not assumed here.
