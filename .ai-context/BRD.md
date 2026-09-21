# Business Requirements Document

_Source: InternalTransferJourney–[SOW].md, generated 2026-09-09_

### BRD-001: End-to-end digital internal transfer workflow

**Raised by:** SOW — not specified
**Business need:** Employees, managers, and HR currently lack a single system to initiate, approve, and execute an internal transfer through its full lifecycle — manager approval, HR eligibility validation, parallel execution by Payroll/IT/Facilities, and final org mapping. The underlying need is to replace ad hoc, uncoordinated handling of transfers with one governed, sequenced process (§1 Project Overview, §2 Objectives: "Digitize the internal employee transfer process," §4 Workflow Summary).
**Sponsor:** Engineering assessment owner (acting as Product Owner for this exercise).
**Priority:** High — this is the system's core transactional purpose; every other in-scope capability exists to support it.
**Decided:**

- Sequence: Employee submits → Manager approve/reject → HR eligibility validation + approve/reject → parallel Payroll/IT/Facilities execution → HR final manager mapping → completion confirmation (§3.1.B, §4).
- Employee request fields: new Department/BU, new Location, new Role/Job Position, Effective Date, optional Reason (§3.1.B.1).
- HR eligibility rule: employee must be in current role ≥ 90 days (§3.1.B.3).
- Manager rejection requires a mandatory reason; manager approval reason is optional (§3.1.B.2).
- Rejection (by Manager or HR) closes the request permanently; a rejected request cannot be resumed — the employee must create a new request (§3.1.B.2–3, §5).
- Payroll/IT/Facilities tasks are parallel, independent execution tasks, not approval gates; Payroll may be marked "No Action Needed" (§3.1.B.4).
- Employee may withdraw a request only while it is in "Pending Manager Approval" state (§3.1.A "Post-submission capabilities," §5).
- No SLA or escalation mechanism; a request may remain pending indefinitely (§5).
- Status is displayed in the form `Pending: [Stakeholder]` (§5).
- Completion: employee receives confirmation of a successful transfer (§3.1.B.6).
  **Open at BRD stage:**
- No failure/correction path is defined for the parallel Payroll/IT/Facilities tasks beyond Payroll's "No Action Needed" option — what happens if IT or Facilities cannot complete their task (e.g., a device/workspace is unavailable) is unstated.
- No notification behavior is defined for a Manager or HR rejection — §3.1.B.6 only describes a confirmation on successful completion; whether/how the employee is informed of a rejection is unstated (Notifications generally are Out of Scope per §10, but even an in-app status update path for rejection isn't described).
- Whether an employee can have more than one active transfer request at a time is unstated.
- Whether "Manager" in the Manager Workflow always means the employee's current manager (as opposed to a manager of the destination department) is unstated.
  **Notes:** The parallel Payroll/IT/Facilities workflow (§3.1.B.4) is treated as part of this single end-to-end process rather than a separate BRD entry, since it is one stage of the same request lifecycle, not an independent business need. Out-of-scope items explicitly named in the SOW (notifications beyond basic confirmation, SLA/escalation, advanced eligibility rules) are carried into "Decided"/"Open" above rather than treated as gaps, since the SOW is explicit about excluding them (§9, §10).

---

### BRD-002: Centralized transfer visibility and administrative oversight

**Raised by:** SOW — not specified
**Business need:** Whoever administers the transfer process needs a consolidated view of organizational headcounts and transfer volume/status, and the ability to inspect any individual request's full history, rather than having to track this manually. This is stated directly as a project objective: "Provide end-to-end visibility of transfer requests" (§2), realized through the Admin Panel's Dashboard and Transfer Request Monitoring (§3.1.A.1, §3.1.A.5).
**Sponsor:** Engineering assessment owner (acting as Product Owner for this exercise).
**Priority:** High — named explicitly as a project objective (§2), distinct from the transactional workflow itself (BRD-001).
**Decided:**

- Dashboard displays counts of Employees, HRs, Managers, Payroll users, IT users, and Facilities users (§3.1.A.1).
- Dashboard displays total internal transfer requests and a status-wise breakdown (§3.1.A.1).
- Transfer Request Monitoring shows all employee transfer requests with status tracking, and a detailed view including request data and full action history (who, what, when) (§3.1.A.5).
- Reporting/analytics beyond these basic counts is explicitly Out of Scope (§10).
  **Open at BRD stage:**
- The full set of statuses making up the "status-wise breakdown" is not enumerated beyond the `Pending: [Stakeholder]` pattern (§5) — whether Approved/Rejected/Completed are also tracked as distinct dashboard-visible statuses is unstated.
- Whether the monitoring view supports filtering or search (e.g., by department, status, date range) is unstated — SOW only says "View all employee transfer requests."
- Refresh behavior (real-time vs. on-demand/periodic) for dashboard counts is unstated.
  **Notes:** Bundled as one entry because both capabilities serve the same underlying need (administrative oversight of the same data) and are adjacent items under Admin Panel §3.1.A. Depends on BRD-001 (the workflow that generates the requests/statuses being monitored) and BRD-006 (the audit data backing "full action history").

---

### BRD-003: Centralized user management across all roles

**Raised by:** SOW — not specified
**Business need:** The business needs one controlled place to create and maintain accounts for every role in the process (Employee, HR, Manager, Payroll, IT, Facilities), since access to the system and to workflow actions is role-gated, and this is called out as a specific constraint rather than a generic CRUD ask: only Admin and HR may register employees (§3.1.A.2, §5).
**Sponsor:** Engineering assessment owner (acting as Product Owner for this exercise).
**Priority:** Medium — a supporting/enabling capability for BRD-001, not itself the transactional core, but explicitly in scope with a named business rule.
**Decided:**

- Roles: Employee, HR, Manager, Payroll, IT, Facilities (§3.1.A.2).
- Features: Add / Edit / Delete users, list view, detailed user profile view (§3.1.A.2).
- Only Admin and HR can register/create Employee users (§3.1.A.2, §5).
- No external identity integration (e.g., LDAP) in this phase (§9).
  **Open at BRD stage:**
- Who is authorized to register non-Employee roles (HR, Manager, Payroll, IT, Facilities users) is unstated — the SOW's restriction is scoped specifically to "for Employees," leaving the other five roles' registration authority unspecified.
- Authentication mechanism (credentials, password policy, session handling) is not described anywhere in the SOW.
- Whether "Delete" is a hard delete or a deactivation is unstated — this matters directly against BRD-006's immutable-audit-history requirement, since removing a user could otherwise orphan or weaken historical action records.
  **Notes:** This is the literal feature the SOW asks for ("User Management") and also appears to match the real underlying need (controlled account provisioning tied to role-based process participation) — no divergence flagged.

---

### BRD-004: Organizational structure management (Departments/BUs and Roles/Jobs)

**Raised by:** SOW — not specified
**Business need:** The business needs its department/business-unit and role/job taxonomy to stay current and admin-editable, since these are the values employees select as the destination of a transfer request (§3.1.B.1) and are explicitly carved out from the codebase-defined constants approach used for other static values (§5).
**Sponsor:** Engineering assessment owner (acting as Product Owner for this exercise).
**Priority:** Medium — a supporting/enabling capability for BRD-001; explicitly in scope but not called out as a standalone objective.
**Decided:**

- Department/Business Unit Management: Add / Edit / Delete, list view, optional detailed view (§3.1.A.3).
- Role/Job Management: Add / Edit / Delete, list view, optional detailed view (§3.1.A.4).
- Departments and roles are explicitly excluded from the codebase-defined constants approach — they are managed as live, database-backed entities instead (§5).
  **Open at BRD stage:**
- The SOW marks the "detailed view" for both Department/BU and Role/Job as "Optional" (§3.1.A.3–4) without saying who decides whether it's built — whether this is in scope for the current phase is unresolved.
- Behavior when a Department/BU or Role/Job referenced by an in-flight or historical transfer request is later edited or deleted is unstated.
  **Notes:** Related to BRD-005 (Centralized Application Constants Management) by contrast — the SOW explicitly treats Departments and Roles as the exception to that rule, so the two entries should be read together at spec time to avoid the two reference-data-management approaches being conflated.

---

### BRD-005: Centralized Application Constants Management

**Raised by:** SOW — not specified
**Business need:** The system requires a centralized and standardized approach for managing application-wide constants to ensure consistency, reduce duplication, and simplify maintainability across both frontend and backend systems.

All reference values (e.g., dropdown options, statuses, workflow constants) should be defined in dedicated, single-source JavaScript modules within each layer (frontend and backend). This ensures that all parts of the application consume a consistent set of values and prevents discrepancies caused by scattered or hardcoded definitions.

These constants are considered application-level configuration, meaning:
- They are controlled through the codebase (not via runtime or admin updates)
- Any changes follow the standard development lifecycle
- Updates require code modification and redeployment to take effect

**Sponsor:** Engineering assessment owner (acting as Product Owner for this exercise).
**Priority:** Medium — named directly as a Maintainability non-functional requirement (§7) and a Business Rule (§5), but narrower in scope than the core workflow.
**Decided:**

- All static reference values except Departments and Roles are application-level constants, controlled entirely through the codebase (§5; Business Need above).
- Each layer (frontend, backend) maintains its own dedicated, single-source JavaScript module for these constants — not a shared runtime file, not a database record, not an admin-editable screen.
- Updates follow the standard development lifecycle: code change plus redeployment. No runtime or admin-accessible update path exists for these values.
- This is also referenced as a Maintainability NFR: "Config-driven dropdowns" (§7) and appears as a Core Module: "Configuration Management (JSON-driven dropdowns)" (§6.1) — the SOW's own wording there ("JSON config file") is superseded by this entry's Business Need, which specifies per-layer JavaScript modules instead (see Notes).
  **Open at BRD stage:**
- The SOW does not enumerate which fields count as reference values under this rule. The Employee request form includes a "New Location" field (§3.1.B.1); since Location isn't named as an exception alongside Departments and Roles, it's implied to be one of these application-level constants, but this should be confirmed rather than assumed before spec drafting — Location management isn't otherwise described anywhere (no "Location Management" admin section exists, unlike Departments and Roles).
- Whether the frontend and backend modules are two independently maintained, single-source files (each authoritative for its own layer) or are meant to be generated/shared from one common definition is not specified by the Business Need text — read here as the former (one dedicated module per layer) unless confirmed otherwise before spec drafting.
  **Notes:** This entry supersedes the SOW's literal "JSON config file" instruction (§5) with the Business Need's more specific architectural direction — codebase-defined JavaScript modules per layer, not a runtime-read file and not an admin-editable screen. Related to BRD-004 by contrast — the SOW explicitly treats Departments and Roles as the exception to this rule, so the two entries should be read together at spec time to avoid the two reference-data-management approaches being conflated.

---

### BRD-006: Complete audit trail of all workflow actions

**Raised by:** SOW — not specified
**Business need:** The literal ask is "audit logging" (§6.1, §6.2), but reading it against §5's explicit statement that there is no SLA/escalation mechanism and requests can remain indefinitely pending, the underlying business need looks like a compensating control: since the system won't enforce timeliness, it must at least guarantee complete, tamper-proof traceability of who did what and when, for accountability purposes. This divergence (literal "audit logging" vs. the accountability/compliance need behind it) is flagged per Discovery Rules.
**Sponsor:** Engineering assessment owner (acting as Product Owner for this exercise).
**Priority:** High — named as both a Core Module (§6.1) and a dedicated requirements subsection (§6.2), and is a stated Acceptance Criterion: "Audit history is complete and accurate" (§12).
**Decided:**

- Every action is tracked with actor (user), action performed, and timestamp (§6.2).
- Request history is immutable (§6.2).
- Employees can view the action history (stakeholder + timestamp) and pending stakeholders for their own requests (§3.1.B.1).
- Admins can view full action history (who, what, when) in the detailed request view (§3.1.A.5).
  **Open at BRD stage:**
- No retention period is stated for audit records.
- Whether roles other than Admin and the requesting Employee (e.g., the approving Manager or HR) can view a request's full audit history, versus only their own action, is unstated.
- Whether audit data can be exported is unstated — the SOW excludes "Reporting & analytics dashboards beyond basic counts" (§10), which suggests audit access is view-only inside the system, but this isn't stated explicitly enough to treat as decided.
  **Notes:** Depends on BRD-001 (the workflow actions being logged) and feeds BRD-002 (the detailed request view surfaces this data).

---

### BRD-007: Role-based access control and API security

**Raised by:** SOW — not specified
**Business need:** With six distinct roles performing materially different and sometimes sensitive actions (HR approving eligibility, Payroll updating salary/compensation/tax, IT provisioning system access), the business needs assurance that each role can only perform the actions appropriate to it, and that the underlying APIs enforcing this cannot be bypassed. Stated as a Core Module ("Authentication & Role-based Access," §6.1) and a Security NFR (§7).
**Sponsor:** Engineering assessment owner (acting as Product Owner for this exercise).
**Priority:** High — a security non-functional requirement with no stated opt-out, and a precondition for every role-specific workflow action in BRD-001.
**Decided:**

- Core module: Authentication & Role-based Access (§6.1).
- Security NFR: role-based authorization; secure APIs (§7).
- Stated Acceptance Criterion: "Role-based actions enforced correctly" (§12).
- No external identity/auth integration (e.g., LDAP) in this phase (§9).
  **Open at BRD stage:**
- No authentication mechanism (session-based, token-based, SSO) is specified.
- No password policy, session timeout, or account-lockout behavior is specified.
- "Secure APIs" is not decomposed into concrete requirements (e.g., transport encryption, rate limiting, input validation) anywhere in the SOW — left as a bare aspiration at this stage.
  **Notes:** Cuts across every other entry (BRD-001 through BRD-006) as an enforcement layer rather than a standalone feature; kept as its own entry because the SOW names it as a distinct Core Module and NFR, not because it's functionally separable from the others.

---

### BRD-008: Admin Panel UI and Stakeholder Panel UI

**Raised by:** SOW — not specified
**Business need:** Every capability decided in BRD-001 through BRD-007 (submit/approve/reject a transfer, monitor requests, manage users, manage org structure, view audit history, role-gated actions) is currently only reachable via a REST API — no human user, in any of the six roles, has a way to actually use the system. The underlying need is a working UI surface for each of the two named audiences: Admins (oversight, user/org-structure management) and everyone else (submitting and acting on transfer requests). Stated directly in §1 ("web-based portal"), §7 ("intuitive, responsive UI" as a Usability NFR), and §8 (Admin Panel UI and Stakeholder Panel UI both named as Deliverables).
**Sponsor:** Engineering assessment owner (acting as Product Owner for this exercise).
**Priority:** High — without it, none of BRD-001 through BRD-007's already-Merged capabilities are actually usable by a human.
**Decided:**

- Two audience-scoped panels, matching the SOW's own naming: Admin Panel UI (Admin-only: dashboard, transfer-request monitoring + detail view, user management, org-structure management) and Stakeholder Panel UI (Employee/Manager/HR/Payroll/IT/Facilities: submit a request, act on a request per role, view own-request status) (§8).
- Stack already decided in `architecture.md` ahead of any UI spec existing: Next.js App Router, React functional components only, TypeScript strict mode, Tailwind CSS + shadcn/ui, Zustand for client/global state, TanStack Query for all server-state fetching (`constitution.md`'s Architectural Constraints) — consuming the REST APIs BRD-001 through BRD-007 already define and that are already implemented.
- No new backend capability is implied by this entry — every screen is a consumption layer over an already-Merged API.
  **Open at BRD stage:**
- Whether this decomposes into one spec or two (mirroring the Admin/Stakeholder split named in §8) is left to spec drafting, not decided here — see Notes.
- Login/session UI (token storage, redirect-on-401 behavior) is implied by BRD-007's JWT decision (ADR-0001) but not described anywhere in the SOW at the UI level.
- No wireframe, page-by-page layout, or navigation structure exists anywhere in the SOW — only the two panel names and their constituent modules (§8) are given.
  **Notes:** This entry was deliberately not written at project kickoff — `BRD.md`'s original Coverage Note treated §8's Deliverables list (including Admin Panel UI) as tracing back into BRD-001–007 rather than standing alone, since a deliverable isn't itself a business need. That call stands for every *other* §8 item (APIs, database schema, deployment setup), which are still not separate entries. The UI is written up here as the one exception, because unlike those other deliverables, it was never actually built as part of any of the 7 specs it was assumed to trace into (`discovery-analysis.md`'s Open Questions table, entry dated 2026-09-19) — leaving it unentered any longer would mean no spec ever owns it. Given the natural Admin/Stakeholder audience split named directly in §8, this is expected to produce two specs, not one — analogous to BRD-004/BRD-005's "read together, decompose separately" relationship — but that split is a spec-drafting decision, not fixed here.

---

## Coverage Note

The following parts of the SOW did not translate into a BRD entry:

- **§8 Deliverables** — the remaining build artifacts (APIs, database schema, deployment setup, etc.) not already covered by BRD-008 above, none of which is a business need in itself; each traces back to one or more of BRD-001 through BRD-007 rather than standing alone.
- **§9 Assumptions** — single-org context, no external integrations, no notification system beyond basic confirmation, no SLA/escalation. These are constraints on scope, not requirements themselves; they've been folded into the relevant entries' "Decided" fields (chiefly BRD-001 and BRD-007) rather than listed separately.
- **§10 Out of Scope** and **§11 Future Enhancements** — notifications (Email/SMS/Push), SLA tracking/escalation, advanced eligibility rules, reporting/analytics dashboards, external system integrations, an SLA/escalation engine, an HR rules engine, HRMS/Payroll integration, and an analytics dashboard. These are explicitly excluded or deferred by the SOW itself, so per the Discovery Rules they are not written into any BRD entry as in-scope needs; they are referenced only as boundaries within relevant entries' "Open"/"Notes" fields where the exclusion affects an in-scope item's meaning (e.g., BRD-001's rejection-notification gap, BRD-006's no-export note).
- **§12 Acceptance Criteria** — a restatement, at a high level, of requirements already captured individually across BRD-001, BRD-002, BRD-006, BRD-007, and BRD-003/004; not a distinct business need, so referenced from those entries ("Priority" and "Decided" fields) instead of duplicated as its own entry.
- **Purely commercial/contractual terms and timelines** — none are present in this SOW; there is no pricing, payment, or delivery-date section to exclude.
