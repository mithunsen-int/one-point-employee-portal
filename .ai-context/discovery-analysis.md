# Discovery Analysis
_Source: InternalTransferJourney–[SOW].md — formalized into .ai-context/BRD.md_

## Purpose

This is the discovery record required by `sdd-methodology.md` #7. It precedes and backs `.ai-context/BRD.md`: spec authoring pulls from BRD.md, and every BRD.md entry traces back to a finding recorded here. Nothing in this file introduces a need not already present in BRD.md — it documents *how* each entry was arrived at, not new content.

## Discovery Method Applied

For each candidate business need in the SOW:
1. Distinguished the literal feature ask from the underlying business need, flagging any divergence.
2. Separated explicit SOW commitments ("Decided") from ambiguous or unstated items ("Open at BRD stage").
3. Did not invent any decision the SOW does not make.
4. Confirmed every candidate entry traces to a specific SOW section before writing it up.

## Needs vs. Literal Asks — Divergences Found

- **BRD-005 (Application constants management):** the SOW's own text states one mechanism ("must be configurable via a JSON config file," §5), but the entry's Business Need explicitly specifies a different one — dedicated, single-source JavaScript modules per layer (frontend and backend), codebase-controlled, updated only via code change and redeployment. This isn't a mechanism-vs-outcome divergence so much as the SOW's literal instruction being superseded by a more specific decision recorded directly in the Business Need. Recorded as such in BRD-005.
- **BRD-006 (Audit logging):** the SOW states a feature ("audit logging," §6.1–6.2), but read against §5's "no SLA/escalation mechanism, requests can remain indefinitely pending," the underlying need looks like a compensating control for accountability, since the system has no other mechanism to enforce timeliness. Recorded as a flagged divergence in BRD-006.
- All other entries (BRD-001 through BRD-004, BRD-007): the literal ask and the underlying need were found to align on inspection; no divergence is flagged for these.

## Sign-off Gap (per #7 — "get sign-off from whoever owns the decision") — Resolved 2026-09-09

The SOW itself names no sponsor, business owner, or decision-maker for any requirement (`Raised by` still correctly reads "SOW — not specified" on every entry — that fact about the source document hasn't changed). This was flagged as a standing gap.

**Resolution:** every BRD entry's `Sponsor` field has since been updated by the document owner to "Engineering assessment owner (acting as Product Owner for this exercise)." This is a deliberate, explicit self-assignment of the Product Owner role for the purposes of this exercise — not a claim that the SOW itself named a sponsor, and not a substitute for a real external business owner on an engagement with an actual client-side product organization. Recorded here so a future reader doesn't mistake "Sponsor now populated" for "SOW named a sponsor."

With this in place, each BRD entry is sign-off-complete for the purposes of this exercise, and spec drafting is no longer blocked on this gap.

## Open Questions Carried Forward

Full detail lives in each BRD entry's "Open at BRD stage" field — this table is a cross-entry index, not a duplicate.

| BRD Entry | Open Question | Blocks |
|---|---|---|
| BRD-001 | No failure/correction path defined for the parallel Payroll/IT/Facilities tasks | Workflow Engine spec |
| BRD-001 | No notification behavior defined for a Manager/HR rejection | Workflow Engine spec |
| BRD-002 | Full status taxonomy behind "status-wise breakdown" not enumerated | Admin Dashboard spec |
| BRD-003 | Authority to register non-Employee roles (HR/Manager/Payroll/IT/Facilities) is unstated | User Management spec |
| BRD-003 | Hard-delete vs. deactivation semantics unstated — in tension with BRD-006's immutability requirement | User Management spec — **resolved:** soft delete (`deletedAt`), 2026-09-10 |
| BRD-004 | "Optional" detailed view for Departments/Roles — unclear if in scope for this phase | Org Structure Management spec |
| BRD-005 | Which fields beyond the Departments/Roles exception count as application-level constants (e.g., Location is implied but not confirmed) | Application Constants Management spec |
| BRD-005 | Whether the frontend/backend constants modules are two independently maintained single-source files, or generated/shared from one common definition | Application Constants Management spec |
| BRD-006 | Audit record retention period unstated | Audit Trail spec |
| BRD-007 | No authentication mechanism, password policy, or session handling specified | Auth/RBAC spec — **resolved:** JWT, see ADR-0001 |
| BRD-003 | Whether Admin accounts are created through `user-management-console` or provisioned separately — SOW §3.1.A.2's Roles list for User Management excludes Admin entirely | Discovered while drafting `user-management-console.spec.md` — **resolved:** exactly one Admin, via one-time unauthenticated self-registration (`API06`), 2026-09-10 |
| BRD-003 | Whether HR can edit/view/delete existing Employee records (as opposed to only registering them) | Discovered while drafting `user-management-console.spec.md` — **resolved:** yes, full add/view/edit/delete over Employee-role records, 2026-09-10 |
| BRD-004 | The term "Role" is overloaded project-wide: BRD-004's "Role/Job Management" is an organizational job title, entirely distinct from the access-control Role (Employee/HR/Manager/...) in BRD-003/007 | Discovered while drafting `org-structure-management.spec.md` — resolved by renaming the entity "Job Role" throughout that spec; no BRD/spec content conflict, just a naming risk flagged for future specs to keep disambiguating |
| BRD-004 | Effect of deleting a Department/BU or Job Role already referenced by a transfer request (in-flight or historical) | `org-structure-management` fixes only the CRUD contract; referential-integrity behavior deferred to whichever of `org-structure-management`/`internal-transfer-workflow` ends up owning it |
| BRD-001 | Data source for "date employee started current role," needed by the ≥90-day HR eligibility check — no spec drafted so far (including `user-management-console`) defines this field | Discovered while drafting `internal-transfer-workflow.spec.md` — **resolved:** `dateOfJoining` field added to `user-management-console.API01`, 2026-09-10 |
| BRD-001 | Manager-routing data source ("the assigned Manager") — no field anywhere records an Employee's current manager | Discovered while re-checking specs before plan stage — **resolved:** `managerId` field added to `user-management-console.API01`, 2026-09-10 |
| BRD-006 | Whether audit logging scope extends to `user-management-console`/`org-structure-management` CRUD actions, or is limited to transfer-request lifecycle actions only — SOW's concrete examples are all transfer-request-specific, and neither of those other two specs declares any audit requirement | Discovered while drafting `transfer-audit-trail.spec.md`; scoped to transfer-request actions only in that spec, pending this decision |
| BRD-008 | Whether the Admin Panel UI and Stakeholder Panel UI decompose into one spec or two | **Resolved:** two specs, `admin-panel-ui.spec.md` and `stakeholder-panel-ui.spec.md`, drafted 2026-09-19 |
| BRD-008 | Login/session UI behavior (token storage, redirect-on-401) is implied by BRD-007's JWT decision but not described at the UI level anywhere in the SOW | **Resolved 2026-09-19:** token + computed `expiresAt` stored in `localStorage`; force-logout (clear + redirect to Login) once `expiresAt` passes or on any 401, whichever comes first (`stakeholder-panel-ui.AC1`/`AC2b`). Refresh and server-side revocation remain explicitly out of scope, per `ADR-0001`. |

## Discovery Gate Status

Per #7: "Discovery is a gate, not a formality — if you can't answer 'what problem, for whom, bounded how' in one paragraph, the spec is not ready to write." Every BRD entry passes that test as written, and the sign-off gap is now resolved (above). Discovery is complete for all eight entries (BRD-008 added 2026-09-19, formalizing the previously-untracked UI deliverable); the open questions in the table above are unresolved *ambiguities*, not sign-off gaps, and remain individually blocking for their respective specs until answered.
