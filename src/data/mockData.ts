import {
  UserProfile,
  DailyAttendanceRecord,
  WorkingTimelineItem,
  LeaveRequest,
  LeaveBalance,
  TaskItem,
  NotificationItem,
  EmployeeDirectoryItem,
  RegularizationRequest,
} from '../types';

export const defaultAdminProfile: UserProfile = {
  id: 'adm-001',
  name: 'HR Administrator',
  employeeId: 'ADMIN',
  designation: 'Chief HR Administrator',
  department: 'People Operations & HR',
  status: 'Active',
  email: 'admin@atenhr.com',
  phone: '+91 98765 43210',
  manager: 'Executive Board',
  joiningDate: '01 Jan 2026',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  role: 'admin',
  shift: 'General Shift (09:00 AM - 05:30 PM)',
  workLocation: 'HQ - Tower B',
};

// Default profile is now HR Administrator. All mock employee profiles have been cleared.
export const currentUserMock: UserProfile = defaultAdminProfile;

export const initialLeaveBalances: LeaveBalance[] = [
  {
    type: 'Casual Leave',
    available: 12,
    total: 12,
    used: 0,
    color: '#3D78C5',
  },
  {
    type: 'Sick Leave',
    available: 8,
    total: 8,
    used: 0,
    color: '#123B66',
  },
  {
    type: 'Earned Leave',
    available: 18,
    total: 18,
    used: 0,
    color: '#F5C542',
  },
];

// All dummy leave requests cleared
export const initialLeaveRequests: LeaveRequest[] = [];

// All dummy regularization requests cleared
export const initialRegularizationRequests: RegularizationRequest[] = [];

// All dummy tasks cleared
export const initialTasks: TaskItem[] = [];

// All dummy notifications cleared
export const initialNotifications: NotificationItem[] = [];

// All dummy attendance history records cleared
export const initialAttendanceHistory: DailyAttendanceRecord[] = [];

// Clean weekly attendance chart representation
export const weeklyAttendanceMock = [
  { day: 'Mon', date: '-', status: 'Upcoming', hours: 0, checkIn: '-', checkOut: '-' },
  { day: 'Tue', date: '-', status: 'Upcoming', hours: 0, checkIn: '-', checkOut: '-' },
  { day: 'Wed', date: '-', status: 'Upcoming', hours: 0, checkIn: '-', checkOut: '-' },
  { day: 'Thu', date: '-', status: 'Upcoming', hours: 0, checkIn: '-', checkOut: '-' },
  { day: 'Fri', date: '-', status: 'Upcoming', hours: 0, checkIn: '-', checkOut: '-' },
  { day: 'Sat', date: '-', status: 'Weekend', hours: 0, checkIn: '-', checkOut: '-' },
  { day: 'Sun', date: '-', status: 'Weekend', hours: 0, checkIn: '-', checkOut: '-' },
];

// All dummy employees and managers cleared
export const employeeDirectoryMock: EmployeeDirectoryItem[] = [];

// All dummy department statistics cleared
export const departmentStatsMock: Array<{
  name: string;
  total: number;
  present: number;
  leave: number;
  absent: number;
  rate: number;
}> = [];
