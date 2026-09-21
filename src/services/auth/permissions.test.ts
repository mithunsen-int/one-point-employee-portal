import { checkPermission } from "@/services/auth/permissions";

describe("checkPermission — Employee (rbac-api-security.AC3/UT03)", () => {
  it("permits an Employee's own listed actions (complement of AC3)", () => {
    expect(checkPermission("Employee", "transfer.initiate")).toBe(true);
    expect(checkPermission("Employee", "transfer.viewOwnStatus")).toBe(true);
    expect(checkPermission("Employee", "transfer.withdrawOwnPendingManager")).toBe(true);
  });

  it("denies an Employee attempting a Manager-only action (UT03)", () => {
    expect(checkPermission("Employee", "transfer.reviewAsManager")).toBe(false);
  });
});

describe("checkPermission — Manager (rbac-api-security.AC4/UT04)", () => {
  it("permits a Manager's own listed action (complement of AC4)", () => {
    expect(checkPermission("Manager", "transfer.reviewAsManager")).toBe(true);
  });

  it("denies a Manager attempting HR eligibility validation (UT04)", () => {
    expect(checkPermission("Manager", "transfer.validateEligibilityAsHR")).toBe(false);
  });

  it("denies a Manager attempting to register a new Employee user (UT09, AC9 carve-out)", () => {
    expect(checkPermission("Manager", "user.registerEmployee")).toBe(false);
  });
});

describe("checkPermission — HR (rbac-api-security.AC5/UT05, AC9 carve-out)", () => {
  it("permits HR's own listed actions (complement of AC5)", () => {
    expect(checkPermission("HR", "transfer.validateEligibilityAsHR")).toBe(true);
    expect(checkPermission("HR", "transfer.reviewAsHR")).toBe(true);
    expect(checkPermission("HR", "transfer.finalManagerMappingAsHR")).toBe(true);
  });

  it("denies HR attempting a Payroll parallel-task action directly (UT05/QT13)", () => {
    expect(checkPermission("HR", "payroll.updateOwnTask")).toBe(false);
  });

  it("denies HR attempting an IT or Facilities parallel-task action (QT13)", () => {
    expect(checkPermission("HR", "it.provisionOrRevokeAccess")).toBe(false);
    expect(checkPermission("HR", "facilities.arrangeWorkspace")).toBe(false);
  });

  it("permits HR to register a new Employee user (AC9 carve-out: Admin or HR only)", () => {
    expect(checkPermission("HR", "user.registerEmployee")).toBe(true);
  });
});

describe("checkPermission — Payroll (rbac-api-security.AC6/UT06)", () => {
  it("permits Payroll's own listed actions (complement of AC6)", () => {
    expect(checkPermission("Payroll", "payroll.updateOwnTask")).toBe(true);
    expect(checkPermission("Payroll", "payroll.markNoActionNeeded")).toBe(true);
  });

  it("denies Payroll attempting to provision IT systems access (UT06)", () => {
    expect(checkPermission("Payroll", "it.provisionOrRevokeAccess")).toBe(false);
  });

  it("denies Payroll attempting a Facilities task action (QT14)", () => {
    expect(checkPermission("Payroll", "facilities.arrangeWorkspace")).toBe(false);
  });
});

describe("checkPermission — IT (rbac-api-security.AC7/UT07)", () => {
  it("permits IT's own listed action (complement of AC7)", () => {
    expect(checkPermission("IT", "it.provisionOrRevokeAccess")).toBe(true);
  });

  it("denies IT attempting Facilities workspace logistics (UT07)", () => {
    expect(checkPermission("IT", "facilities.arrangeWorkspace")).toBe(false);
  });

  it("denies IT attempting a Payroll task action (QT15)", () => {
    expect(checkPermission("IT", "payroll.updateOwnTask")).toBe(false);
  });
});

describe("checkPermission — Facilities (rbac-api-security.AC8/UT08)", () => {
  it("permits Facilities' own listed action (complement of AC8)", () => {
    expect(checkPermission("Facilities", "facilities.arrangeWorkspace")).toBe(true);
  });

  it("denies Facilities attempting to register a new Employee user (UT08)", () => {
    expect(checkPermission("Facilities", "user.registerEmployee")).toBe(false);
  });

  it("denies Facilities attempting a Payroll or IT task action (QT16)", () => {
    expect(checkPermission("Facilities", "payroll.updateOwnTask")).toBe(false);
    expect(checkPermission("Facilities", "it.provisionOrRevokeAccess")).toBe(false);
  });
});

describe("checkPermission — Admin (rbac-api-security.AC9/UT10/QT18)", () => {
  it("permits all three Admin action categories (UT10/QT18)", () => {
    expect(checkPermission("Admin", "admin.userManagement")).toBe(true);
    expect(checkPermission("Admin", "admin.departmentRoleManagement")).toBe(true);
    expect(checkPermission("Admin", "admin.transferMonitoring")).toBe(true);
  });

  it("permits Admin to register a new Employee user (AC9 carve-out)", () => {
    expect(checkPermission("Admin", "user.registerEmployee")).toBe(true);
  });
});

describe("checkPermission — AC9 registerEmployee carve-out, full role sweep (QT17)", () => {
  it.each(["Employee", "Payroll", "IT", "Facilities"] as const)(
    "denies %s attempting to register a new Employee user",
    (role) => {
      expect(checkPermission(role, "user.registerEmployee")).toBe(false);
    },
  );
});

describe("checkPermission — malformed/unknown role (rbac-api-security.AC2/QT08/QT09)", () => {
  it("denies when the role claim is missing or null, treated as no permitted actions (QT08)", () => {
    expect(checkPermission(null, "transfer.initiate")).toBe(false);
    expect(checkPermission(undefined, "transfer.initiate")).toBe(false);
  });

  it("denies when the role claim is a string outside the 7 known roles (QT09)", () => {
    expect(checkPermission("SuperAdmin", "transfer.initiate")).toBe(false);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT10 (Employee viewing a transfer request that is not their own), QT11
//   (Employee withdrawing a request in the wrong state), and QT12 (Manager
//   acting on a request not routed to them) all require resource-level context
//   (a specific request's ownership/routing/state) that this task's own scope
//   deliberately excludes — T05's prompt file fixes the check function's
//   signature as `(role, action)`, matching AC2's own wording ("user's role is
//   not permitted to perform the requested action"). Those three scenarios
//   belong to whichever endpoint has access to the specific record (chiefly
//   `internal-transfer-workflow`'s own future implementation), which must
//   layer its own ownership/state check on top of this coarse role-action gate
//   — not fabricated here as if this function could resolve them.