import { EmployeeDirectoryItem } from '../types';

/**
 * Checks whether an employee's assigned manager matches the logged-in manager.
 * Supports variations such as:
 * - "Vikram Anand" vs "Vikram Anand (Engineering Director)" vs "Vikram Anand (Director of Engineering)"
 */
export const isEmployeeAssignedToManager = (
  employeeManagerField?: string,
  managerName?: string
): boolean => {
  if (!employeeManagerField || !managerName) return false;
  const cleanEmpMgr = employeeManagerField.toLowerCase().trim();
  const cleanMgr = managerName.toLowerCase().trim();

  if (cleanEmpMgr === cleanMgr) return true;
  if (cleanEmpMgr.includes(cleanMgr) || cleanMgr.includes(cleanEmpMgr)) return true;

  // Compare first & last name tokens
  const mgrTokens = cleanMgr.split(' ').filter(Boolean);
  if (mgrTokens.length >= 2) {
    if (cleanEmpMgr.includes(mgrTokens[0]) && cleanEmpMgr.includes(mgrTokens[1])) {
      return true;
    }
  }

  return false;
};

/**
 * Returns all employees assigned to a specific manager.
 */
export const getAssignedEmployeesForManager = (
  employees: EmployeeDirectoryItem[],
  managerName: string
): EmployeeDirectoryItem[] => {
  if (!managerName) return [];
  return employees.filter((emp) => isEmployeeAssignedToManager(emp.manager, managerName));
};

/**
 * Validates whether a manager has authorization to approve a specific request.
 * Enforces:
 * 1. Managers must NOT approve their own requests (self-approval prohibited).
 * 2. Managers must ONLY approve requests from employees assigned to them.
 */
export const validateManagerApprovalPermission = (
  req: { employeeId?: string; employeeName?: string },
  employees: EmployeeDirectoryItem[],
  manager: { employeeId?: string; name?: string; role?: string }
): { allowed: boolean; reason?: string } => {
  // Admin always has full bypass authority
  if (manager.role === 'admin') {
    return { allowed: true };
  }

  // 1. Check self-approval restriction
  if (
    (req.employeeId && manager.employeeId && req.employeeId.toLowerCase() === manager.employeeId.toLowerCase()) ||
    (req.employeeName && manager.name && req.employeeName.toLowerCase().trim() === manager.name.toLowerCase().trim())
  ) {
    return {
      allowed: false,
      reason: 'Self-Approval Restricted: You cannot approve your own request. This request must be reviewed by the HR Administrator.',
    };
  }

  // 2. Lookup employee's assigned reporting manager
  const targetEmployee = employees.find(
    (e) =>
      (req.employeeId && e.employeeId.toLowerCase() === req.employeeId.toLowerCase()) ||
      (req.employeeName && e.fullName.toLowerCase() === req.employeeName.toLowerCase())
  );

  if (!targetEmployee) {
    return {
      allowed: false,
      reason: 'Employee record not found in directory.',
    };
  }

  const isAssigned = isEmployeeAssignedToManager(targetEmployee.manager, manager.name);
  if (!isAssigned) {
    return {
      allowed: false,
      reason: `Unauthorized: ${targetEmployee.fullName} reports to ${targetEmployee.manager || 'another manager'}. You can only process requests for your assigned team.`,
    };
  }

  return { allowed: true };
};
