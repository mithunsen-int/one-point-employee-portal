export type Role = "Employee" | "Manager" | "HR" | "Payroll" | "IT" | "Facilities" | "Admin";

export type Action =
  | "transfer.initiate"
  | "transfer.viewOwnStatus"
  | "transfer.withdrawOwnPendingManager"
  | "transfer.reviewAsManager"
  | "transfer.validateEligibilityAsHR"
  | "transfer.reviewAsHR"
  | "transfer.finalManagerMappingAsHR"
  | "payroll.updateOwnTask"
  | "payroll.markNoActionNeeded"
  | "it.provisionOrRevokeAccess"
  | "facilities.arrangeWorkspace"
  | "user.registerEmployee"
  | "admin.userManagement"
  | "admin.departmentRoleManagement"
  | "admin.transferMonitoring";

const KNOWN_ROLES: readonly Role[] = ["Employee", "Manager", "HR", "Payroll", "IT", "Facilities", "Admin"];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  Employee: new Set(["transfer.initiate", "transfer.viewOwnStatus", "transfer.withdrawOwnPendingManager"]),
  Manager: new Set(["transfer.reviewAsManager"]),
  HR: new Set([
    "transfer.validateEligibilityAsHR",
    "transfer.reviewAsHR",
    "transfer.finalManagerMappingAsHR",
    "user.registerEmployee",
  ]),
  Payroll: new Set(["payroll.updateOwnTask", "payroll.markNoActionNeeded"]),
  IT: new Set(["it.provisionOrRevokeAccess"]),
  Facilities: new Set(["facilities.arrangeWorkspace"]),
  Admin: new Set([
    "admin.userManagement",
    "admin.departmentRoleManagement",
    "admin.transferMonitoring",
    "user.registerEmployee",
  ]),
};

function isKnownRole(role: unknown): role is Role {
  return typeof role === "string" && (KNOWN_ROLES as readonly string[]).includes(role);
}

export function checkPermission(role: string | null | undefined, action: Action): boolean {
  if (!isKnownRole(role)) {
    return false;
  }
  return ROLE_PERMISSIONS[role].has(action);
}
