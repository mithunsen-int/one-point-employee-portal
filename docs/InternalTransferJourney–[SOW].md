# Statement of Work (SOW)  
## Project: Internal Transfer Journey System

---

## 1. Project Overview

The objective of this project is to design and implement a **Digital Internal Transfer Journey System** that enables employees to initiate, track, and manage internal transfer requests seamlessly within the organization.

The system will consist of two primary interfaces:

- **Admin Panel**
- **Stakeholder Panel**

The solution will streamline cross-functional workflows involving Employees, Managers, HR, Payroll, IT, and Facilities.

---

## 2. Objectives

- Digitize the internal employee transfer process
- Provide end-to-end visibility of transfer requests
- Enable role-based workflow execution
- Maintain audit history of all actions
- Ensure centralized user and organizational management

---

## 3. Scope of Work

### 3.1 In-Scope

#### A. Admin Panel

1. **Dashboard**
   - Display total count of:
     - Employees
     - HRs
     - Managers
     - Payroll users
     - IT users
     - Facilities users
   - Display:
     - Total internal transfer requests
     - Status-wise breakdown

2. **User Management**
   - Create/Register users (Admin & HR only for Employees)
   - Roles:
     - Employee
     - HR
     - Manager
     - Payroll
     - IT
     - Facilities
   - Features:
     - Add / Edit / Delete users
     - List view of users
     - Detailed user profile view

3. **Department / Business Unit Management**
   - Add / Edit / Delete
   - List view
   - Optional detailed view

4. **Role / Job Management**
   - Add / Edit / Delete
   - List view
   - Optional detailed view

5. **Transfer Request Monitoring**
   - View all employee transfer requests
   - Status tracking
   - Detailed request view including:
     - Request data
     - Full action history (who, what, when)

---

#### B. Stakeholder Panel

##### 1. Employee Workflow

- Initiate Transfer Request:
  - Select:
    - New Department / Business Unit
    - New Location
    - New Role / Job Position
  - Provide:
    - Effective Date
    - Optional Reason
  - Submit request

- Post-submission capabilities:
  - View request status
  - View action history (stakeholder + timestamp)
  - View pending stakeholders
  - Withdraw request (only in **Pending Manager Approval** state)

---

##### 2. Manager Workflow

- Review request
- Actions:
  - Approve (with optional reason)
  - Reject (mandatory reason)

- Outcomes:
  - Approval → moves to HR validation
  - Rejection → request closed

---

##### 3. HR Workflow

- Eligibility validation:
  - Employee must be in current role ≥ 90 days

- Actions:
  - Approve (Confirm transfer)
  - Reject (with reason)

- Outcomes:
  - Approval → triggers parallel tasks
  - Rejection → request closed

---

##### 4. Parallel Stakeholder Workflow (Post HR Approval)

Executed independently and in parallel by:

###### a. Payroll
- Update:
  - Salary
  - Compensation
  - Tax
  - Cost center
- Option:
  - Mark as **No Action Needed**

###### b. IT
- Provision / revoke:
  - Systems access
  - Permissions
  - Devices

###### c. Facilities
- Arrange:
  - Workspace
  - Office logistics
  - Location setup

> Note: These are execution tasks, not approval steps.

---

##### 5. Final HR Action

- Map employee to new Manager
- Finalize organizational update

---

##### 6. Completion

- Employee receives confirmation of successful transfer

---

## 4. Workflow Summary

1. Employee submits request  
2. Manager approval/rejection  
3. HR eligibility validation  
4. HR approval/rejection  
5. Parallel execution:
   - Payroll
   - IT
   - Facilities  
6. HR final mapping  
7. Completion & notification  

---

## 5. Business Rules & Constraints

- No SLA or escalation mechanism
- Requests can remain indefinitely pending
- Status displayed as:
  - `Pending: [Stakeholder]`
- Only **Admin and HR** can register employees
- Static dropdown values (except departments & roles):
  - Must be configurable via **JSON config file**
- Rejected requests cannot be resumed:
  - Employee must create a new request
- Withdrawal allowed only in:
  - `Pending Manager Approval`

---

## 6. Functional Requirements

### 6.1 Core Modules

- Authentication & Role-based Access
- User Management
- Organization Management (Departments, Roles)
- Transfer Request Engine
- Workflow Engine (multi-step + parallel tasks)
- Audit Logging
- Configuration Management (JSON-driven dropdowns)

---

### 6.2 Audit & Tracking

- Track all actions with:
  - Actor (user)
  - Action performed
  - Timestamp
- Maintain immutable request history

---

## 7. Non-Functional Requirements

- **Performance:** Handle concurrent workflow processing
- **Scalability:** Modular architecture for future rules/SLA
- **Security:**
  - Role-based authorization
  - Secure APIs
- **Maintainability:**
  - Config-driven dropdowns
  - Extensible workflow design
- **Usability:**
  - Clear status visibility
  - Intuitive UI for each role

---

## 8. Deliverables

- Admin Panel UI
- Stakeholder Panel UI
- Backend APIs
- Workflow engine implementation
- Database schema
- Configurable JSON setup
- Audit logging system
- Deployment setup

---

## 9. Assumptions

- Single organization context
- No external integrations (e.g., payroll systems, LDAP)
- No notification system beyond basic confirmation
- No SLA/escalation in this phase

---

## 10. Out of Scope

- Notifications (Email/SMS/Push)
- SLA tracking and escalation
- Advanced eligibility rules
- Reporting & analytics dashboards beyond basic counts
- External system integrations

---

## 11. Future Enhancements (Optional)

- SLA & escalation engine
- Notification system
- Advanced HR rules engine
- Integration with HRMS/Payroll systems
- Analytics dashboard

---

## 12. Acceptance Criteria

- All workflows execute as defined
- Role-based actions enforced correctly
- Parallel task execution works independently
- Audit history is complete and accurate
- Admin can fully manage users and organization structure
- Employee can track and manage requests as specified

---