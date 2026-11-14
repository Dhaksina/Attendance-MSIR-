import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { defaultAdminProfile } from '../data/mockData';
import { dbService } from '../services/dbService';

// One-time cache purge key to clear any legacy dummy data from browser localStorage
const PURGE_KEY = 'msir_v3_clean_slate';
try {
  if (typeof window !== 'undefined' && localStorage.getItem(PURGE_KEY) !== 'true') {
    localStorage.removeItem('msir_employees_directory');
    localStorage.removeItem('msir_employee_leave_balances');
    localStorage.removeItem('msir_attendance_history');
    localStorage.removeItem('msir_leave_requests');
    localStorage.removeItem('msir_regularization_requests');
    localStorage.removeItem('msir_custom_avatars');
    localStorage.removeItem('msir_auth_session');
    localStorage.setItem(PURGE_KEY, 'true');
  }
} catch {}

export const detectRoleFromId = (input: string): {
  role: UserRole;
  roleType: 'employee' | 'manager' | 'admin';
  roleLabel: string;
  badgeColor: string;
} => {
  const trimmed = (input || '').trim().toLowerCase();
  if (trimmed.startsWith('admin')) {
    return {
      role: 'admin',
      roleType: 'admin',
      roleLabel: 'HR Administrator',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    };
  }

  // Check if this employee ID exists in the employee directory
  try {
    const savedDirectory = localStorage.getItem('msir_employees_directory');
    const directoryList = savedDirectory ? JSON.parse(savedDirectory) : null;
    const list = Array.isArray(directoryList) && directoryList.length > 0 ? directoryList : null;
    if (list) {
      const match = list.find(
        (e: any) =>
          e.employeeId?.toLowerCase() === trimmed ||
          e.email?.toLowerCase() === trimmed
      );
      if (match) {
        if (match.isManager || match.designation?.toLowerCase().includes('director') || match.designation?.toLowerCase().includes('manager')) {
          return {
            role: 'manager',
            roleType: 'manager',
            roleLabel: 'Reporting Manager',
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          };
        }
        return {
          role: 'employee',
          roleType: 'employee',
          roleLabel: 'Employee',
          badgeColor: 'bg-blue-50 text-[#123B66] border-blue-200',
        };
      }
    }
  } catch {}

  return {
    role: 'employee',
    roleType: 'employee',
    roleLabel: 'Employee',
    badgeColor: 'bg-blue-50 text-[#123B66] border-blue-200',
  };
};

export const ROLE_PASSWORDS = {
  employee: 'msirindia1',
  manager: 'msirindia1',
  admin: 'msirindiaakk',
} as const;

export type RoleType = 'employee' | 'manager' | 'admin';

export const validateRolePassword = (
  roleType: RoleType,
  passwordInput: string
): { isValid: boolean; expectedPassword: string } => {
  const expected = ROLE_PASSWORDS[roleType];
  const isValid = passwordInput === expected;
  return {
    isValid,
    expectedPassword: expected,
  };
};

const AUTH_STORAGE_KEY = 'msir_auth_session';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (emailOrId: string, password?: string, customRole?: UserRole) => Promise<UserRole>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved).user;
    } catch {}
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return true;
    } catch {}
    return false;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved).role;
    } catch {}
    return 'admin';
  });

  // Prefetch cloud employees directory on mount to guarantee logins work on fresh laptops
  useEffect(() => {
    dbService.getEmployees().catch(() => {});
  }, []);

  const login = async (emailOrId: string, password?: string, customRole?: UserRole): Promise<UserRole> => {
    const trimmed = (emailOrId || '').trim();
    const detected = detectRoleFromId(trimmed);
    const effectiveRole: UserRole = customRole || detected.role;

    // 1. Check local directory cache
    let matchingEmp: any = null;
    try {
      const savedDirectory = localStorage.getItem('msir_employees_directory');
      const directoryList = savedDirectory ? JSON.parse(savedDirectory) : [];
      matchingEmp = directoryList.find(
        (e: any) =>
          e.employeeId?.toLowerCase() === trimmed.toLowerCase() ||
          e.email?.toLowerCase() === trimmed.toLowerCase()
      );
    } catch {}

    // 2. Fallback: If not in local cache (fresh browser session), query cloud database!
    if (!matchingEmp && detected.roleType !== 'admin') {
      try {
        const cloudEmps = await dbService.getEmployees();
        if (cloudEmps && cloudEmps.length > 0) {
          matchingEmp = cloudEmps.find(
            (e: any) =>
              e.employeeId?.toLowerCase() === trimmed.toLowerCase() ||
              e.email?.toLowerCase() === trimmed.toLowerCase()
          );
        }
      } catch {}
    }

    // Only Admin can log in when directory is empty or employee not found
    if (detected.roleType !== 'admin') {
      if (!matchingEmp) {
        throw new Error(
          `Account "${trimmed}" not found in directory. Only HR Administrator ("admin") can log in until employee records are added or uploaded.`
        );
      }
      if (matchingEmp.status === 'Inactive') {
        throw new Error(
          `Login Blocked: The account for "${matchingEmp.fullName}" (ID: ${matchingEmp.employeeId}) has been marked Inactive by Administrator.`
        );
      }
    }

    // Password validation
    if (password !== undefined) {
      if (detected.roleType === 'admin') {
        if (password.trim() !== ROLE_PASSWORDS.admin) {
          throw new Error(`Incorrect password for HR Administrator.`);
        }
      } else if (matchingEmp) {
        const empPassword = matchingEmp.password || ROLE_PASSWORDS.employee;
        if (password.trim() !== empPassword && password.trim() !== ROLE_PASSWORDS.employee) {
          throw new Error(`Incorrect password for ${matchingEmp.fullName} (${matchingEmp.employeeId}).`);
        }
      }
    }

    // Resolve custom avatar if set
    let customAvatar: string | undefined = undefined;
    try {
      const caRaw = localStorage.getItem('msir_custom_avatars');
      if (caRaw) {
        const ca = JSON.parse(caRaw);
        customAvatar =
          ca[trimmed.toUpperCase()] ||
          ca[trimmed.toLowerCase()] ||
          (matchingEmp?.employeeId ? ca[matchingEmp.employeeId.toUpperCase()] : undefined);
      }
    } catch {}

    let profile: UserProfile;
    if (detected.roleType === 'admin') {
      profile = {
        ...defaultAdminProfile,
        id: 'adm-001',
        name: 'HR Administrator',
        employeeId: trimmed.toUpperCase() || 'ADMIN',
        designation: 'Chief HR Administrator',
        department: 'People Operations & HR',
        email: trimmed.includes('@') ? trimmed.toLowerCase() : 'admin@atenhr.com',
        role: 'admin',
        avatarUrl:
          customAvatar ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      };
    } else if (matchingEmp) {
      const isManager = Boolean(matchingEmp.isManager) || detected.roleType === 'manager';
      profile = {
        id: matchingEmp.id || `emp-${matchingEmp.employeeId.toLowerCase()}`,
        name: matchingEmp.fullName,
        employeeId: matchingEmp.employeeId,
        designation: matchingEmp.designation || (isManager ? 'Reporting Manager' : 'Employee Specialist'),
        department: matchingEmp.department || 'General',
        email: matchingEmp.email || `${matchingEmp.employeeId.toLowerCase()}@atenhr.com`,
        phone: matchingEmp.phone || '+91 98765 00000',
        manager: matchingEmp.manager || 'HR Administrator',
        status: matchingEmp.status || 'Active',
        role: isManager ? 'manager' : 'employee',
        shift: matchingEmp.shift || 'General Shift (09:00 AM - 05:30 PM)',
        workLocation: matchingEmp.assignedGeofence || 'HQ - Tower B',
        joiningDate: matchingEmp.joiningDate || new Date().toISOString().split('T')[0],
        avatarUrl:
          customAvatar ||
          matchingEmp.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(matchingEmp.fullName)}&background=123B66&color=fff`,
      };
      setRoleState(isManager ? 'manager' : 'employee');
    } else {
      throw new Error(`Account "${trimmed}" not found.`);
    }

    setIsAuthenticated(true);
    setRoleState(profile.role);
    setUser(profile);

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: profile, role: profile.role }));
      sessionStorage.removeItem('msir_checked_in');
      sessionStorage.removeItem('msir_checked_out');
      sessionStorage.removeItem('msir_checkin_time');
      sessionStorage.removeItem('msir_checkout_time');
      sessionStorage.removeItem('msir_checkin_location');
    } catch {}

    return profile.role;
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem('msir_checked_in');
      sessionStorage.removeItem('msir_checked_out');
      sessionStorage.removeItem('msir_checkin_time');
      sessionStorage.removeItem('msir_checkout_time');
      sessionStorage.removeItem('msir_checkin_location');
    } catch {}
    setIsAuthenticated(false);
    setUser(null);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: updatedUser, role: newRole }));
      } catch {}
    }
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: updatedUser, role }));
        if (data.avatarUrl) {
          const caRaw = localStorage.getItem('msir_custom_avatars');
          const ca = caRaw ? JSON.parse(caRaw) : {};
          if (updatedUser.employeeId) {
            ca[updatedUser.employeeId.toUpperCase()] = data.avatarUrl;
          }
          if (updatedUser.email) {
            ca[updatedUser.email.toLowerCase()] = data.avatarUrl;
          }
          localStorage.setItem('msir_custom_avatars', JSON.stringify(ca));
        }
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        logout,
        setRole,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
