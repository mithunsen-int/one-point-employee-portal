# Project Constitution — Internal Transfer Journey System

_These are the non-negotiables for every feature built in this project. Every plan is checked against this file line by line at Gate 1 (sdd-methodology.md #8, #13). A plan silent on a rule here is a gap, not a pass._

## Testing Discipline

- Test-first is mandatory for every API endpoint and every state-changing operation — this includes every workflow transition (submit, approve, reject, withdraw, parallel-task completion, final mapping) and every User/Department/Role CRUD operation. No exception for "simple" endpoints (sdd-methodology.md #5.3).
- Frameworks: Jest + React Testing Library, per `int-standards.nextjs.md` #1, #12. No snapshot-only tests for logic-bearing components or hooks.
- Mongoose schema validation rules (the check-constraint-equivalent for MongoDB) must have a corresponding test proving the rule is actually enforced, not just declared (`int-standards.nextjs.md` #12).
- **Coverage floor:** BRD.md and the SOW state no numeric coverage target. This is intentionally left open rather than invented — a plan that states its own coverage number without a BRD/constitution basis is a Gate 1 gap, not a pass. The Tech Lead must set this floor explicitly (as a dated constitution amendment) before it can be enforced.

## Security Posture

- No employee personal or organizational data (name, department, role, or the salary/compensation/tax fields Payroll updates per BRD-001) may appear in application logs at any log level — only structured audit entries governed by BRD-006's audit trail requirement.
- Role-based authorization is enforced server-side, at the API layer, for all six roles (Employee, HR, Manager, Payroll, IT, Facilities) per BRD-007. Client-side role gating (hiding a button) is never a substitute for a server-side check.
- No external identity or system integration in this phase (no LDAP/SSO, no HRMS/Payroll system integration) — per the BRD-001/BRD-007 assumption carried from SOW §9. The specific internal authentication mechanism is not yet decided anywhere (BRD-007 open item) and must not be invented at plan stage without being raised as a Gate 1 question first.
- MongoDB is the sole approved datastore (`int-standards.nextjs.md` #1). No new datastore without an ADR.
- Treat all MongoDB query operators (`$where`, `$gt`, `$ne`, etc.) arriving from client input as untrusted. No route handler may pass a client-supplied object directly into a Mongoose query filter without validating its shape first (NoSQL injection — `int-standards.nextjs.md` #5, #9).
- Secrets, credentials, and tokens are never hardcoded or logged; environment variables only (`int-standards.nextjs.md` #9).
- Audit records (BRD-006) are immutable — no code path may update or delete an existing audit entry, only append new ones.

## Architectural Constraints

- Approved stack: Next.js (App Router), React functional components only (no class components), TypeScript strict mode, Tailwind CSS + shadcn/ui, Zustand for client/global state, TanStack Query for all server-state fetching, MongoDB + Mongoose, REST APIs.
- No new datastore, client-state library, or external system integration without an ADR — silently introducing one (e.g., adding Redux "just for this feature") is a Gate 1 rejection, not a Gate 2 comment.
- Departments and Roles are database-backed CRUD entities (BRD-004); all other static reference values are codebase-defined constants, maintained as dedicated single-source JavaScript modules per layer, updated only via code change and redeployment (BRD-005). A plan may not blur this distinction — e.g., a plan must not put Departments/Roles into a constants module, or put a codebase-defined constant into database CRUD, without a Gate 1 discussion first.
- The workflow engine must support the Payroll/IT/Facilities stage as three independently completable tasks — one stakeholder's completion or "No Action Needed" marking must never block or gate another's (BRD-001).
- All server data fetching goes through TanStack Query via custom hooks; no component fetches data directly or uses `useEffect` for API calls (`int-standards.nextjs.md` #5).

## Non-Functional Baselines

- BRD.md and the SOW state no numeric latency, throughput, availability, RPO, or RTO targets — SOW §7 states only qualitative goals ("handle concurrent workflow processing," "modular architecture for future rules/SLA"). This section intentionally carries no invented numbers. A plan touching an NFR must either cite a value stated in BRD.md/this file, or flag the absence as an explicit open question for Gate 1 — never assume a number.
- Audit history (BRD-006) is retained indefinitely by default, since no retention period is stated anywhere — no code path may delete audit records absent a future, explicitly approved retention policy.

## Versioning Rules

- This is a single-organization, internally-consumed system with no external partner integrations in this phase (BRD assumption, SOW §9) — the semver/deprecation-window discipline used for externally-consumed APIs does not apply as-is.
- Instead: once a spec's API Contract section (payload shape, status codes, exceptions) is Approved (Gate 1), changing it requires a spec revision and a new Gate 1 pass — no silent breaking change to an Approved contract during implementation.

---

_Amendments to this file go through the same review rigor as any spec — proposed as a short, dated change request, reviewed, never edited silently (sdd-methodology.md #8)._
