export type UserRole = 'employee' | 'admin' | 'manager';

export interface UserProfile {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  department: string;
  status: 'Active' | 'On Probation' | 'Notice Period' | 'Inactive';
  email: string;
  phone: string;
  manager: string;
  joiningDate: string;
  avatarUrl: string;
  role: UserRole;
  shift: string;
  workLocation: string;
  geofenceEnabled?: boolean;
  assignedGeofence?: string;
  isManager?: boolean;
}

export type LocationType = 'Office' | 'Client On-Site' | 'Field Work' | 'Work From Home';

export interface CheckInLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  address: string;
  city?: string;
  locationType: LocationType;
  siteName?: string;
  notes?: string;
  source: 'GPS (High Accuracy)' | 'Browser Geolocation' | 'Office Geofence' | 'Manual Pinpoint' | 'Network IP';
  timestamp: string;
  mapsUrl: string;
  isWithinGeofence?: boolean;
  geofenceDistance?: number;
  permittedRadius?: number;
}

export type CheckOutLocation = CheckInLocation;

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave' | 'Half Day' | 'Half Day Leave' | 'Holiday' | 'Weekend';

export interface DailyAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: string;
  checkIn: string | null; // e.g. "09:15 AM"
  checkOut: string | null; // e.g. "06:20 PM"
  workingHours: string; // e.g. "8h 35m" or "-"
  workingMinutes: number;
  breakDuration: string; // e.g. "45m"
  status: AttendanceStatus;
  note?: string;
  location?: string;
  locationData?: CheckInLocation;
  mapsUrl?: string;
  checkOutLocation?: string;
  checkOutLocationData?: CheckInLocation;
  checkOutMapsUrl?: string;
}

export interface WorkingTimelineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'check-in' | 'break-start' | 'break-end' | 'check-out' | 'meeting';
  completed: boolean;
  location?: string;
  mapsUrl?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  avatarUrl?: string;
  category?: 'Leave' | 'Permission';
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Compensatory Off' | 'Maternity/Paternity' | 'Official Permission (1-2 Hours)';
  fromDate: string;
  toDate: string;
  permissionTime?: string;
  days: number;
  reason: string;
  attachmentName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminRemarks?: string;
}

export interface LeaveBalance {
  type: 'Casual Leave' | 'Sick Leave' | 'Earned Leave';
  available: number;
  total: number;
  used: number;
  color: string;
}

export interface LeaveCategoryBalance {
  available: number;
  total: number;
  used: number;
}

export interface EmployeeLeaveBalanceBreakdown {
  casualLeave: LeaveCategoryBalance;
  sickLeave: LeaveCategoryBalance;
  earnedLeave: LeaveCategoryBalance;
  permissionsRemaining: number;
  permissionsTotal: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  category: 'Today' | 'Upcoming' | 'Completed';
  status: 'In Progress' | 'Pending Review' | 'Completed';
  assignee: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'attendance' | 'leave' | 'task' | 'system' | 'reminder';
  read: boolean;
  priority?: 'normal' | 'important';
}

export interface EmployeeDirectoryItem {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  manager: string;
  password?: string;
  shift?: string;
  status: 'Active' | 'On Probation' | 'Inactive';
  avatarUrl: string;
  todayStatus: AttendanceStatus;
  todayCheckIn?: string;
  todayCheckOut?: string;
  todayLocation?: string;
  todayLocationType?: LocationType;
  todayCoordinates?: { lat: number; lng: number };
  todayMapsUrl?: string;
  todayCheckOutLocation?: string;
  todayCheckOutCoordinates?: { lat: number; lng: number };
  todayCheckOutMapsUrl?: string;
  todayCheckOutLocationType?: LocationType;
  todayCheckOutLocationData?: CheckInLocation;
  isWithinGeofence?: boolean;
  geofenceDistance?: number;
  geofenceEnabled?: boolean;
  assignedGeofence?: string;
  isManager?: boolean;
}

export interface ReportFilter {
  type: 'Daily Attendance' | 'Monthly Attendance' | 'Employee Attendance' | 'Department Attendance' | 'Leave Report' | 'Late Attendance Report';
  startDate: string;
  endDate: string;
  department: string;
  employeeId: string;
  status: string;
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  avatarUrl: string;
  date: string; // YYYY-MM-DD
  punchType: 'Missed Check In' | 'Missed Check Out' | 'Both (Full Day)' | 'Late Arrival Regularization';
  requestedCheckIn: string; // e.g. "09:15 AM"
  requestedCheckOut: string; // e.g. "06:15 PM"
  reason: string;
  category: 'Biometric Device Glitch' | 'On-Duty Client Visit' | 'Forgot Punch' | 'Network Outage' | 'Official Travel' | 'Late Traffic / Transit Delay';
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type PageId =
  | 'dashboard'
  | 'attendance'
  | 'attendance-history'
  | 'leave'
  | 'profile'
  | 'notifications'
  | 'admin-dashboard'
  | 'admin-approvals'
  | 'employee-management'
  | 'manager-dashboard'
  | 'manager-approvals'
  | 'manager-team'
  | 'monthly-reports'
  | 'reports'
  | 'settings';


