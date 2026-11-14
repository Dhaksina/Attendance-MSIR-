import {
  UserProfile,
  DailyAttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  EmployeeDirectoryItem,
  ReportFilter,
  TaskItem,
  NotificationItem,
} from '../types';
import {
  currentUserMock,
  initialAttendanceHistory,
  initialLeaveBalances,
  initialLeaveRequests,
  employeeDirectoryMock,
  initialTasks,
  initialNotifications,
  departmentStatsMock,
} from '../data/mockData';

// Simulated latency helper
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const apiService = {
  // Authentication
  async login(credentials: { employeeIdOrEmail: string; password?: string }): Promise<ApiResponse<UserProfile>> {
    await delay(300);
    const { detectRoleFromId, ROLE_PASSWORDS } = await import('../context/AuthContext');
    const detected = detectRoleFromId(credentials.employeeIdOrEmail);
    const expected = ROLE_PASSWORDS[detected.roleType];

    if (credentials.password && credentials.password !== expected) {
      return {
        success: false,
        data: currentUserMock,
        message: `Incorrect password for ${detected.roleLabel}. Please verify credentials.`,
      };
    }

    return {
      success: true,
      data: currentUserMock,
      message: 'Logged in successfully',
    };
  },

  async logout(): Promise<ApiResponse<null>> {
    await delay(200);
    return { success: true, data: null, message: 'Logged out successfully' };
  },

  // Attendance
  async getTodayAttendance(): Promise<ApiResponse<DailyAttendanceRecord>> {
    await delay(150);
    return {
      success: true,
      data: initialAttendanceHistory[0],
    };
  },

  async checkIn(location: string = 'Office HQ'): Promise<ApiResponse<{ checkInTime: string; status: string }>> {
    await delay(350);
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return {
      success: true,
      data: {
        checkInTime: formatted,
        status: 'Present',
      },
      message: `Checked in successfully at ${formatted}`,
    };
  },

  async checkOut(): Promise<ApiResponse<{ checkOutTime: string; workingHours: string }>> {
    await delay(350);
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return {
      success: true,
      data: {
        checkOutTime: formatted,
        workingHours: '8h 45m',
      },
      message: `Checked out successfully at ${formatted}`,
    };
  },

  async getAttendanceHistory(filters?: {
    search?: string;
    month?: string;
    status?: string;
  }): Promise<ApiResponse<DailyAttendanceRecord[]>> {
    await delay(200);
    let results = [...initialAttendanceHistory];
    if (filters?.status && filters.status !== 'All') {
      results = results.filter((item) => item.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (item) =>
          item.date.toLowerCase().includes(q) ||
          item.dayName.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q))
      );
    }
    return {
      success: true,
      data: results,
    };
  },

  // Leave Management
  async getLeaves(): Promise<ApiResponse<{ balances: LeaveBalance[]; requests: LeaveRequest[] }>> {
    await delay(200);
    return {
      success: true,
      data: {
        balances: initialLeaveBalances,
        requests: initialLeaveRequests,
      },
    };
  },

  async applyLeave(payload: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>): Promise<ApiResponse<LeaveRequest>> {
    await delay(400);
    const newRequest: LeaveRequest = {
      ...payload,
      id: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
    };
    return {
      success: true,
      data: newRequest,
      message: 'Leave application submitted to manager for approval.',
    };
  },

  // Tasks
  async getTasks(): Promise<ApiResponse<TaskItem[]>> {
    await delay(150);
    return {
      success: true,
      data: initialTasks,
    };
  },

  // Profile
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    await delay(150);
    return {
      success: true,
      data: currentUserMock,
    };
  },

  async updateProfile(updatedData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    await delay(300);
    return {
      success: true,
      data: { ...currentUserMock, ...updatedData },
      message: 'Profile details updated successfully',
    };
  },

  // Notifications
  async getNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    await delay(150);
    return {
      success: true,
      data: initialNotifications,
    };
  },

  // Admin / Employees
  async getEmployees(search?: string, department?: string): Promise<ApiResponse<EmployeeDirectoryItem[]>> {
    await delay(250);
    let list = [...employeeDirectoryMock];
    if (department && department !== 'All') {
      list = list.filter((emp) => emp.department === department);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      data: list,
    };
  },

  async addEmployee(newEmployee: Omit<EmployeeDirectoryItem, 'id'>): Promise<ApiResponse<EmployeeDirectoryItem>> {
    await delay(400);
    const created: EmployeeDirectoryItem = {
      ...newEmployee,
      id: `EMP-${Math.floor(10 + Math.random() * 90)}`,
    };
    return {
      success: true,
      data: created,
      message: `Employee ${newEmployee.fullName} registered successfully`,
    };
  },

  async updateEmployee(id: string, updates: Partial<EmployeeDirectoryItem>): Promise<ApiResponse<Partial<EmployeeDirectoryItem>>> {
    await delay(300);
    return {
      success: true,
      data: { id, ...updates },
      message: 'Employee record updated successfully',
    };
  },

  async getReports(filters: ReportFilter): Promise<ApiResponse<{
    summary: { totalDays: number; presentPercent: number; avgWorkingHours: string; leavesCount: number };
    records: Array<{ label: string; value: string | number; metric: string }>;
    departmentSummary: typeof departmentStatsMock;
  }>> {
    await delay(350);
    return {
      success: true,
      data: {
        summary: {
          totalDays: 22,
          presentPercent: 95.4,
          avgWorkingHours: '8h 24m',
          leavesCount: 3,
        },
        records: [
          { label: 'Total Working Days in Cycle', value: 22, metric: 'Days' },
          { label: 'Punctuality Index', value: '91.8%', metric: 'On-time Rate' },
          { label: 'Average Check-in Time', value: '09:12 AM', metric: 'Standard Shift' },
          { label: 'Average Check-out Time', value: '06:19 PM', metric: 'Standard Shift' },
          { label: 'Overtime Accumulated', value: '6h 40m', metric: 'Compensatory' },
        ],
        departmentSummary: departmentStatsMock,
      },
      message: `Report generated for ${filters.type}`,
    };
  },
};
