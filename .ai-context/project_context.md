# Project Context — Internal Transfer Journey System

## Business Objective

Replace an uncoordinated, manual internal-transfer process with a single digital system that lets employees initiate a transfer request and carries it through manager approval, HR eligibility validation, parallel execution (Payroll, IT, Facilities), and final organizational mapping — with full visibility and an immutable audit trail at every step (BRD-001, BRD-002, BRD-006).

## System Overview

Two interfaces over one backend:

- **Admin Panel** — dashboard (role/user counts, request counts and status breakdown), user management, department/business-unit management, role/job management, and transfer-request monitoring with full action history (BRD-002, BRD-003, BRD-004).
- **Stakeholder Panel** — role-specific workflow views for Employee, Manager, HR, Payroll, IT, and Facilities, each acting on the same underlying transfer request as it moves through the workflow (BRD-001).

Single organization, no external system integrations in this phase (no LDAP, no HRMS/Payroll system, no notification service beyond in-app confirmation) — per the SOW's stated assumptions and BRD-001's carried-forward constraints.

## Stakeholders (roles, not named individuals — none are named in the SOW)

| Role | Involvement |
|---|---|
| Employee | Initiates a transfer request; tracks its status and history; can withdraw only while Pending Manager Approval |
| Manager | Approves or rejects the request (first gate) |
| HR | Validates eligibility (≥90 days in current role), approves or rejects (second gate); performs final manager mapping after parallel execution |
| Payroll | Updates salary/compensation/tax/cost center, or marks "No Action Needed," as one of three parallel post-HR-approval tasks |
| IT | Provisions/revokes systems access, permissions, devices, as one of three parallel post-HR-approval tasks |
| Facilities | Arranges workspace/office logistics/location setup, as one of three parallel post-HR-approval tasks |
| Admin | Registers/manages all users (Employee registration is Admin+HR only), manages Departments/BUs and Roles/Jobs, monitors all requests |

No sponsor or business owner is named anywhere in the SOW for any of the above — see `discovery-analysis.md`'s Sign-off Gap.

## High-Level Flow (Internal Transfer Journey)

```
Employee submits request (dept/BU, location, role/job, effective date, optional reason)
        │
        ▼
Manager reviews → Approve (optional reason) ──────────────► Reject (mandatory reason) → CLOSED
        │
        ▼
HR validates eligibility (≥90 days in role) → Approve ────► Reject (reason) → CLOSED
        │
        ▼
Parallel, independent execution — none blocks another:
  ├── Payroll: update salary/compensation/tax/cost center, or "No Action Needed"
  ├── IT: provision/revoke systems access, permissions, devices
  └── Facilities: arrange workspace/office logistics/location
        │
        ▼
HR final action: map employee to new manager, finalize org update
        │
        ▼
Completion — employee receives in-app confirmation
```

Status is always displayed as `Pending: [Stakeholder]`; a request may remain pending indefinitely (no SLA/escalation in this phase); a rejected request cannot be resumed — a new request must be created (BRD-001).

## Out of Scope (this phase)

Notifications (Email/SMS/Push), SLA tracking/escalation, advanced eligibility rules, reporting/analytics beyond basic counts, external system integrations — see BRD.md's Coverage Note for the full list and reasoning.
