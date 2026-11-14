import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DailyAttendanceRecord,
  WorkingTimelineItem,
  LeaveBalance,
  LeaveRequest,
  TaskItem,
  NotificationItem,
  EmployeeDirectoryItem,
  RegularizationRequest,
  CheckInLocation,
  EmployeeLeaveBalanceBreakdown,
} from '../types';
import {
  initialAttendanceHistory,
  initialLeaveBalances,
  initialLeaveRequests,
  initialTasks,
  initialNotifications,
  employeeDirectoryMock,
  initialRegularizationRequests,
} from '../data/mockData';
import { verifyGeofence, OFFICE_GEOFENCE } from '../utils/geofence';
import { useAuth } from './AuthContext';
import { dbService } from '../services/dbService';

interface AttendanceContextType {
  // Today's Status
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLocation: CheckInLocation | null;
  checkOutLocation: CheckInLocation | null;
  isTrackingLocation: boolean;
  locationError: string | null;
  workingDuration: string; // e.g. "8h 12m 45s"
  workingDurationSeconds: number;
  todayStatus: 'Not Checked In' | 'Present' | 'Day Completed';
  
  // Actions
  checkIn: (manualLocation?: Partial<CheckInLocation>) => Promise<CheckInLocation>;
  refreshLocation: () => Promise<CheckInLocation>;
  checkOut: (manualLocation?: Partial<CheckInLocation>) => Promise<CheckInLocation>;
  resetDay: () => void;
  
  // Timeline
  timelineItems: WorkingTimelineItem[];
  addTimelineNote: (title: string, description: string) => void;
  
  // History
  attendanceHistory: DailyAttendanceRecord[];
  
  // Leaves & Permissions
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  getEmployeeLeaveBalances: (employeeId?: string) => EmployeeLeaveBalanceBreakdown;
  applyLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) => void;
  cancelLeaveRequest: (id: string) => void;
  approveLeave: (id: string, adminRemarks?: string, reviewerName?: string) => void;
  rejectLeave: (id: string, adminRemarks?: string, reviewerName?: string) => void;

  // Missed Attendance Regularization (Employee applies, Manager/Admin approves)
  regularizationRequests: RegularizationRequest[];
  pendingRegularizationCount: number;
  applyRegularization: (
    req: Omit<RegularizationRequest, 'id' | 'status' | 'appliedDate' | 'reviewedBy' | 'reviewedAt' | 'adminRemarks'>
  ) => void;
  approveRegularization: (id: string, adminRemarks?: string, reviewerName?: string) => void;
  rejectRegularization: (id: string, adminRemarks?: string, reviewerName?: string) => void;
  
  // Tasks
  tasks: TaskItem[];
  toggleTaskStatus: (id: string) => void;
  addTask: (task: Omit<TaskItem, 'id'>) => void;
  
  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (title: string, message: string, type?: NotificationItem['type']) => void;
  
  // Employee Directory (Admin)
  employees: EmployeeDirectoryItem[];
  addEmployee: (emp: Omit<EmployeeDirectoryItem, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<EmployeeDirectoryItem>) => void;
  deleteEmployee: (id: string) => void;
  toggleEmployeeStatus: (id: string) => void;
  importEmployees: (newEmployees: EmployeeDirectoryItem[]) => void;
  clearAllData: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Helper storage key scoped per employee
  const getEmpStorageKey = (empId: string) => `msir_att_${empId}`;

  // Today's attendance state - defaults to false (Check In option available upon entering application)
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [isCheckedOut, setIsCheckedOut] = useState<boolean>(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [workingDurationSeconds, setWorkingDurationSeconds] = useState<number>(0);

  // Real-time Check-In Location state
  const [checkInLocation, setCheckInLocation] = useState<CheckInLocation | null>(null);
  const [checkOutLocation, setCheckOutLocation] = useState<CheckInLocation | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Timeline items
  const [timelineItems, setTimelineItems] = useState<WorkingTimelineItem[]>(() => {
    try {
      const checkedIn = sessionStorage.getItem('msir_checked_in') === 'true';
      const cTime = sessionStorage.getItem('msir_checkin_time');
      if (checkedIn && cTime) {
        return [
          {
            id: 'tl-1',
            time: cTime,
            title: 'Check In',
            description: `GPS Verified at ${OFFICE_GEOFENCE.name}, Chromepet, Tambaram`,
            type: 'check-in',
            completed: true,
            location: OFFICE_GEOFENCE.address,
            mapsUrl: `https://www.google.com/maps?q=${OFFICE_GEOFENCE.latitude},${OFFICE_GEOFENCE.longitude}`,
          },
          {
            id: 'tl-2',
            time: '01:00 PM',
            title: 'Lunch Break (Scheduled)',
            description: 'Standard 45-minute meal break',
            type: 'break-start',
            completed: false,
          },
          {
            id: 'tl-3',
            time: '01:45 PM',
            title: 'Back to Work',
            description: 'Resumed workstation activity',
            type: 'break-end',
            completed: false,
          },
          {
            id: 'tl-4',
            time: '05:45 PM',
            title: 'Check Out',
            description: 'Scheduled end of day shift',
            type: 'check-out',
            completed: false,
          },
        ];
      }
    } catch {}
    return [
      {
        id: 'tl-1',
        time: '09:15 AM',
        title: 'Check In (Scheduled)',
        description: 'General Shift (09:15 AM - 05:45 PM). Awaiting entry punch.',
        type: 'check-in',
        completed: false,
      },
      {
        id: 'tl-2',
        time: '01:00 PM',
        title: 'Lunch Break (Scheduled)',
        description: 'Standard 45-minute meal break',
        type: 'break-start',
        completed: false,
      },
      {
        id: 'tl-3',
        time: '01:45 PM',
        title: 'Back to Work',
        description: 'Resumed workstation activity',
        type: 'break-end',
        completed: false,
      },
      {
        id: 'tl-4',
        time: '05:45 PM',
        title: 'Check Out',
        description: 'Scheduled end of day shift',
        type: 'check-out',
        completed: false,
      },
    ];
  });

  // History state
  const [attendanceHistory, setAttendanceHistory] = useState<DailyAttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('msir_attendance_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialAttendanceHistory;
  });

  useEffect(() => {
    try {
      localStorage.setItem('msir_attendance_history', JSON.stringify(attendanceHistory));
    } catch {}
  }, [attendanceHistory]);
  
  // Leaves state
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(initialLeaveBalances);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('msir_leave_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialLeaveRequests;
  });

  useEffect(() => {
    try {
      localStorage.setItem('msir_leave_requests', JSON.stringify(leaveRequests));
    } catch {}
  }, [leaveRequests]);

  // Per-employee leave balances registry with persistence
  const [employeeBalancesMap, setEmployeeBalancesMap] = useState<Record<string, EmployeeLeaveBalanceBreakdown>>(() => {
    try {
      const saved = localStorage.getItem('msir_employee_leave_balances');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('msir_employee_leave_balances', JSON.stringify(employeeBalancesMap));
    } catch {}
  }, [employeeBalancesMap]);

  const getEmployeeLeaveBalances = (employeeId?: string): EmployeeLeaveBalanceBreakdown => {
    const id = employeeId || user?.employeeId || 'ADMIN';
    if (employeeBalancesMap[id]) {
      return employeeBalancesMap[id];
    }
    return {
      casualLeave: { available: 12, total: 12, used: 0 },
      sickLeave: { available: 8, total: 8, used: 0 },
      earnedLeave: { available: 18, total: 18, used: 0 },
      permissionsRemaining: 2,
      permissionsTotal: 2,
    };
  };
  
  // Regularization requests state (missed attendance)
  const [regularizationRequests, setRegularizationRequests] = useState<RegularizationRequest[]>(() => {
    try {
      const saved = localStorage.getItem('msir_regularization_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialRegularizationRequests;
  });

  useEffect(() => {
    try {
      localStorage.setItem('msir_regularization_requests', JSON.stringify(regularizationRequests));
    } catch {}
  }, [regularizationRequests]);

  // Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  
  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Employees state (for Admin) with localStorage persistence
  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('msir_employees_directory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return employeeDirectoryMock;
  });

  // Real-time synchronization across laptops & cloud database
  useEffect(() => {
    // 1. Initial full fetch
    const syncFromCloud = async () => {
      try {
        const cloudEmps = await dbService.getEmployees();
        if (cloudEmps && cloudEmps.length > 0) {
          setEmployees(cloudEmps);
        }
        const cloudAtt = await dbService.getAttendanceRecords();
        if (cloudAtt && cloudAtt.length > 0) {
          setAttendanceHistory(cloudAtt);
        }
        const cloudLeaves = await dbService.getLeaveRequests();
        if (cloudLeaves && cloudLeaves.length > 0) {
          setLeaveRequests(cloudLeaves);
        }
        const cloudRegs = await dbService.getRegularizationRequests();
        if (cloudRegs && cloudRegs.length > 0) {
          setRegularizationRequests(cloudRegs);
        }
      } catch (err) {
        console.warn('Initial cloud sync notice:', err);
      }
    };
    syncFromCloud();

    // 2. Real-time Firebase listeners (instantly sync across all laptops!)
    const unsubLeaves = dbService.subscribeToLeaveRequests((leaves) => {
      if (Array.isArray(leaves)) {
        setLeaveRequests(leaves);
      }
    });

    const unsubRegs = dbService.subscribeToRegularizations((regs) => {
      if (Array.isArray(regs)) {
        setRegularizationRequests(regs);
      }
    });

    const unsubEmps = dbService.subscribeToEmployees((emps) => {
      if (Array.isArray(emps) && emps.length > 0) {
        setEmployees(emps);
      }
    });

    const unsubAtt = dbService.subscribeToAttendance((records) => {
      if (Array.isArray(records) && records.length > 0) {
        setAttendanceHistory(records);
      }
    });

    // 3. Periodic background poll (every 4 seconds) as bulletproof safety net
    const pollInterval = setInterval(() => {
      syncFromCloud();
    }, 4000);

    return () => {
      unsubLeaves();
      unsubRegs();
      unsubEmps();
      unsubAtt();
      clearInterval(pollInterval);
    };
  }, []);

  // Sync employees to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('msir_employees_directory', JSON.stringify(employees));
    } catch {}
  }, [employees]);

  // Synchronize attendance status per active logged-in employee
  useEffect(() => {
    // Purge legacy un-scoped session keys so they never cross-contaminate any user
    try {
      sessionStorage.removeItem('msir_checked_in');
      sessionStorage.removeItem('msir_checked_out');
      sessionStorage.removeItem('msir_checkin_time');
      sessionStorage.removeItem('msir_checkout_time');
      sessionStorage.removeItem('msir_checkin_location');
      localStorage.removeItem('msir_checkin_location');
    } catch {}

    const empId = user?.employeeId || 'EMP41001';
    const userId = user?.id;

    // 1. Check if this specific employee has an active session
    try {
      const saved = sessionStorage.getItem(getEmpStorageKey(empId));
      if (saved) {
        const parsed = JSON.parse(saved);
        setIsCheckedIn(Boolean(parsed.isCheckedIn));
        setIsCheckedOut(Boolean(parsed.isCheckedOut));
        setCheckInTime(parsed.checkInTime || null);
        setCheckOutTime(parsed.checkOutTime || null);
        setCheckInLocation(parsed.checkInLocation || null);
        setCheckOutLocation(parsed.checkOutLocation || null);
        setWorkingDurationSeconds(parsed.workingDurationSeconds || 0);
        return;
      }
    } catch {}

    // 2. Otherwise check from employees directory
    const empRecord = employees.find(
      (e) => (empId && e.employeeId === empId) || (userId && e.id === userId)
    );

    if (empRecord && empRecord.todayCheckIn && empRecord.todayStatus === 'Present') {
      setIsCheckedIn(true);
      setIsCheckedOut(Boolean(empRecord.todayCheckOut));
      setCheckInTime(empRecord.todayCheckIn);
      setCheckOutTime(empRecord.todayCheckOut || null);
      setWorkingDurationSeconds(0);
      if (empRecord.todayLocation) {
        setCheckInLocation({
          latitude: empRecord.todayCoordinates?.lat || OFFICE_GEOFENCE.latitude,
          longitude: empRecord.todayCoordinates?.lng || OFFICE_GEOFENCE.longitude,
          accuracy: 12,
          address: empRecord.todayLocation,
          city: 'Chromepet, Tambaram',
          locationType: (empRecord.todayLocationType as any) || 'Office',
          source: 'Office Geofence',
          timestamp: empRecord.todayCheckIn,
          mapsUrl: empRecord.todayMapsUrl || `https://www.google.com/maps?q=${empRecord.todayCoordinates?.lat || OFFICE_GEOFENCE.latitude},${empRecord.todayCoordinates?.lng || OFFICE_GEOFENCE.longitude}`,
          isWithinGeofence: empRecord.isWithinGeofence !== false,
          geofenceDistance: empRecord.geofenceDistance,
          permittedRadius: OFFICE_GEOFENCE.permittedRadiusMeters,
        });
      } else {
        setCheckInLocation(null);
      }

      if (empRecord.todayCheckOutLocation) {
        setCheckOutLocation({
          latitude: empRecord.todayCheckOutCoordinates?.lat || OFFICE_GEOFENCE.latitude,
          longitude: empRecord.todayCheckOutCoordinates?.lng || OFFICE_GEOFENCE.longitude,
          accuracy: 12,
          address: empRecord.todayCheckOutLocation,
          city: 'Chromepet, Tambaram',
          locationType: (empRecord.todayCheckOutLocationType as any) || 'Office',
          source: 'GPS (High Accuracy)',
          timestamp: empRecord.todayCheckOut || '',
          mapsUrl: empRecord.todayCheckOutMapsUrl || `https://www.google.com/maps?q=${empRecord.todayCheckOutCoordinates?.lat || OFFICE_GEOFENCE.latitude},${empRecord.todayCheckOutCoordinates?.lng || OFFICE_GEOFENCE.longitude}`,
          isWithinGeofence: true,
          permittedRadius: OFFICE_GEOFENCE.permittedRadiusMeters,
        });
      } else {
        setCheckOutLocation(null);
      }
    } else {
      // Default: Employee has NOT checked in yet today!
      setIsCheckedIn(false);
      setIsCheckedOut(false);
      setCheckInTime(null);
      setCheckOutTime(null);
      setCheckInLocation(null);
      setCheckOutLocation(null);
      setWorkingDurationSeconds(0);
    }
  }, [user?.employeeId, user?.id]);

  // Live working timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isCheckedIn && !isCheckedOut) {
      interval = setInterval(() => {
        setWorkingDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, isCheckedOut]);

  // Format seconds into readable format "Xh Ym Zs"
  const formatDuration = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const workingDuration = formatDuration(workingDurationSeconds);

  const todayStatus: 'Not Checked In' | 'Present' | 'Day Completed' = !isCheckedIn
    ? 'Not Checked In'
    : isCheckedOut
    ? 'Day Completed'
    : 'Present';

  // Acquire location via browser HTML5 Geolocation with reverse geocoding
  const acquireLocation = async (manualLocation?: Partial<CheckInLocation>): Promise<CheckInLocation> => {
    setIsTrackingLocation(true);
    setLocationError(null);

    const chosenType = manualLocation?.locationType || 'Office';

    const geo = verifyGeofence(
      manualLocation?.latitude || OFFICE_GEOFENCE.latitude,
      manualLocation?.longitude || OFFICE_GEOFENCE.longitude
    );

    // If manual coordinates passed
    if (manualLocation && manualLocation.latitude && manualLocation.longitude) {
      const manualGeo = verifyGeofence(manualLocation.latitude, manualLocation.longitude);
      const loc: CheckInLocation = {
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
        accuracy: manualLocation.accuracy || 15,
        address: manualLocation.address || 'Verified Workplace Perimeter',
        city: manualLocation.city || 'Chennai',
        locationType: chosenType,
        siteName: manualLocation.siteName,
        notes: manualLocation.notes,
        source: manualLocation.source || 'Manual Pinpoint',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        mapsUrl: `https://www.google.com/maps?q=${manualLocation.latitude},${manualLocation.longitude}`,
        isWithinGeofence: manualGeo.isWithin,
        geofenceDistance: manualGeo.distance,
        permittedRadius: manualGeo.permittedRadius,
      };
      setIsTrackingLocation(false);
      return loc;
    }

    // Try HTML5 Geolocation
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 9000,
            maximumAge: 0,
          });
        });

        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy || 15);
        const liveGeo = verifyGeofence(lat, lng);

        let address = `Coordinates: ${lat}° N, ${lng}° E`;
        let city = 'Chennai';

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const place = addr.suburb || addr.neighbourhood || addr.road || addr.industrial || addr.commercial || '';
            const cityPart = addr.city || addr.town || addr.county || addr.state_district || 'Chennai';
            city = cityPart;
            if (place && cityPart) {
              address = `${place}, ${cityPart}`;
            } else if (data.display_name) {
              const parts = data.display_name.split(',').map((p: string) => p.trim());
              address = parts.slice(0, 3).join(', ');
            }
          }
        } catch {
          address = `GPS Location (${lat}° N, ${lng}° E)`;
        }

        const loc: CheckInLocation = {
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          address: manualLocation?.address || address,
          city,
          locationType: chosenType,
          siteName: manualLocation?.siteName,
          notes: manualLocation?.notes,
          source: 'GPS (High Accuracy)',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
          isWithinGeofence: liveGeo.isWithin,
          geofenceDistance: liveGeo.distance,
          permittedRadius: liveGeo.permittedRadius,
        };

        setIsTrackingLocation(false);
        return loc;
      } catch (err: any) {
        let errMsg = 'Location permission unavailable or timed out.';
        if (err?.code === 1) {
          errMsg = 'Location permission was denied in browser. Defaulted to Office Geofence.';
        } else if (err?.code === 2) {
          errMsg = 'GPS coordinates unavailable. Defaulted to Office Geofence.';
        } else if (err?.code === 3) {
          errMsg = 'Location request timed out. Defaulted to Office Geofence.';
        }
        setLocationError(errMsg);
      }
    } else {
      setLocationError('Geolocation is not supported by your browser. Defaulted to Office Geofence.');
    }

    // Default fallback geofence for Science & Industrial Resources
    const fallbackLoc: CheckInLocation = {
      latitude: OFFICE_GEOFENCE.latitude,
      longitude: OFFICE_GEOFENCE.longitude,
      accuracy: 12,
      address: manualLocation?.address || OFFICE_GEOFENCE.address,
      city: 'Chromepet, Tambaram',
      locationType: chosenType,
      siteName: manualLocation?.siteName || OFFICE_GEOFENCE.name,
      notes: manualLocation?.notes,
      source: 'Office Geofence',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      mapsUrl: `https://www.google.com/maps?q=${OFFICE_GEOFENCE.latitude},${OFFICE_GEOFENCE.longitude}`,
      isWithinGeofence: geo.isWithin,
      geofenceDistance: geo.distance,
      permittedRadius: geo.permittedRadius,
    };

    setIsTrackingLocation(false);
    return fallbackLoc;
  };

  // Check In action with real-time location tracking
  const checkIn = async (manualLocation?: Partial<CheckInLocation>) => {
    const loc = await acquireLocation(manualLocation);
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const empId = user?.employeeId || 'EMP41001';
    const userId = user?.id;

    setIsCheckedIn(true);
    setIsCheckedOut(false);
    setCheckInTime(formatted);
    setCheckInLocation(loc);
    setWorkingDurationSeconds(0);

    try {
      sessionStorage.setItem(
        getEmpStorageKey(empId),
        JSON.stringify({
          isCheckedIn: true,
          isCheckedOut: false,
          checkInTime: formatted,
          checkOutTime: null,
          checkInLocation: loc,
          workingDurationSeconds: 0,
        })
      );
      sessionStorage.removeItem('msir_checked_in');
      sessionStorage.removeItem('msir_checked_out');
      sessionStorage.removeItem('msir_checkin_time');
      sessionStorage.removeItem('msir_checkout_time');
      sessionStorage.removeItem('msir_checkin_location');
      localStorage.setItem('msir_checkin_location', JSON.stringify(loc));
    } catch {}

    setTimelineItems((prev) => [
      {
        id: `tl-${Date.now()}`,
        time: formatted,
        title: 'Check In',
        description: `GPS Verified at ${loc.address} (${loc.latitude}° N, ${loc.longitude}° E • ±${loc.accuracy}m)`,
        type: 'check-in',
        completed: true,
        location: loc.address,
        mapsUrl: loc.mapsUrl,
      },
      ...prev.filter((i) => i.type !== 'check-in'),
    ]);

    // Update history record today
    setAttendanceHistory((prev) =>
      prev.map((rec, idx) =>
        idx === 0
          ? {
              ...rec,
              checkIn: formatted,
              status: 'Present',
              location: loc.address,
              mapsUrl: loc.mapsUrl,
              locationData: loc,
            }
          : rec
      )
    );

    // Update employees directory so Admin sees where THIS employee is in real time!
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === empId || emp.id === userId || (empId === 'EMP41001' && emp.id === 'EMP-01')
          ? {
              ...emp,
              todayStatus: 'Present',
              todayCheckIn: formatted,
              todayLocation: loc.address,
              todayLocationType: loc.locationType,
              todayCoordinates: { lat: loc.latitude, lng: loc.longitude },
              todayMapsUrl: loc.mapsUrl,
            }
          : emp
      )
    );

    addNotification(
      'Attendance Marked with Location',
      `Checked in at ${formatted} from ${loc.address} (${loc.locationType} - ${loc.source}).`,
      'attendance'
    );

    return loc;
  };

  const refreshLocation = async () => {
    const loc = await acquireLocation();
    setCheckInLocation(loc);
    try {
      const empId = user?.employeeId || 'EMP41001';
      sessionStorage.setItem(
        getEmpStorageKey(empId),
        JSON.stringify({
          isCheckedIn,
          isCheckedOut,
          checkInTime,
          checkOutTime,
          checkInLocation: loc,
          workingDurationSeconds,
        })
      );
      localStorage.setItem('msir_checkin_location', JSON.stringify(loc));
    } catch {}
    return loc;
  };

  // Check Out action with GPS location tracking
  const checkOut = async (manualLocation?: Partial<CheckInLocation>) => {
    setIsTrackingLocation(true);
    setLocationError(null);

    const loc = await acquireLocation(manualLocation);
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const empId = user?.employeeId || 'EMP41001';
    const userId = user?.id;

    setIsCheckedOut(true);
    setCheckOutTime(formatted);
    setCheckOutLocation(loc);
    setIsTrackingLocation(false);

    try {
      sessionStorage.setItem(
        getEmpStorageKey(empId),
        JSON.stringify({
          isCheckedIn: true,
          isCheckedOut: true,
          checkInTime: checkInTime || formatted,
          checkOutTime: formatted,
          checkInLocation,
          checkOutLocation: loc,
          workingDurationSeconds,
        })
      );
      sessionStorage.removeItem('msir_checked_in');
      sessionStorage.removeItem('msir_checked_out');
      sessionStorage.removeItem('msir_checkin_time');
      sessionStorage.removeItem('msir_checkout_time');
      sessionStorage.removeItem('msir_checkin_location');
      localStorage.setItem('msir_checkout_location', JSON.stringify(loc));
    } catch {}

    // Update check out in timeline
    setTimelineItems((prev) =>
      prev.map((item) =>
        item.type === 'check-out'
          ? {
              ...item,
              time: formatted,
              completed: true,
              description: `Shift completed & GPS verified checkout at ${loc.address} (${loc.latitude.toFixed(4)}° N, ${loc.longitude.toFixed(4)}° E • ±${loc.accuracy}m)`,
              location: loc.address,
              mapsUrl: loc.mapsUrl,
            }
          : item
      )
    );

    // Update history today record
    const hours = Math.floor(workingDurationSeconds / 3600);
    const minutes = Math.floor((workingDurationSeconds % 3600) / 60);
    const formattedHours = `${hours}h ${minutes}m`;

    setAttendanceHistory((prev) =>
      prev.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              checkOut: formatted,
              workingHours: formattedHours,
              workingMinutes: Math.floor(workingDurationSeconds / 60),
              checkOutLocation: loc.address,
              checkOutLocationData: loc,
              checkOutMapsUrl: loc.mapsUrl,
            }
          : item
      )
    );

    // Update employees directory for THIS employee
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === empId || emp.id === userId || (empId === 'EMP41001' && emp.id === 'EMP-01')
          ? {
              ...emp,
              todayCheckOut: formatted,
              todayCheckOutLocation: loc.address,
              todayCheckOutCoordinates: { lat: loc.latitude, lng: loc.longitude },
              todayCheckOutMapsUrl: loc.mapsUrl,
              todayCheckOutLocationType: loc.locationType,
              todayCheckOutLocationData: loc,
            }
          : emp
      )
    );

    addNotification(
      'Check Out Recorded with Location',
      `Shift ended at ${formatted} from ${loc.address} (${loc.locationType}). Total duration: ${formattedHours}. Rest well!`,
      'attendance'
    );

    return loc;
  };

  const resetDay = () => {
    const empId = user?.employeeId || 'EMP41001';
    const userId = user?.id;

    setIsCheckedIn(false);
    setIsCheckedOut(false);
    setCheckInTime(null);
    setCheckOutTime(null);
    setCheckInLocation(null);
    setCheckOutLocation(null);
    setWorkingDurationSeconds(0);
    try {
      sessionStorage.removeItem(getEmpStorageKey(empId));
      sessionStorage.removeItem('msir_checked_in');
      sessionStorage.removeItem('msir_checked_out');
      sessionStorage.removeItem('msir_checkin_time');
      sessionStorage.removeItem('msir_checkout_time');
      sessionStorage.removeItem('msir_checkin_location');
      localStorage.removeItem('msir_checkin_location');
      localStorage.removeItem('msir_checkout_location');
    } catch {}

    setTimelineItems([
      {
        id: 'tl-1',
        time: '09:15 AM',
        title: 'Check In (Scheduled)',
        description: 'General Shift (09:15 AM - 05:45 PM). Awaiting entry punch.',
        type: 'check-in',
        completed: false,
      },
      {
        id: 'tl-2',
        time: '01:00 PM',
        title: 'Lunch Break (Scheduled)',
        description: 'Standard 45-minute meal break',
        type: 'break-start',
        completed: false,
      },
      {
        id: 'tl-3',
        time: '01:45 PM',
        title: 'Back to Work',
        description: 'Resumed workstation activity',
        type: 'break-end',
        completed: false,
      },
      {
        id: 'tl-4',
        time: '05:45 PM',
        title: 'Check Out',
        description: 'Scheduled end of day shift',
        type: 'check-out',
        completed: false,
      },
    ]);

    setAttendanceHistory((prev) =>
      prev.map((rec, idx) =>
        idx === 0
          ? {
              ...rec,
              checkIn: null,
              checkOut: null,
              workingHours: '-',
              workingMinutes: 0,
              status: 'Absent',
              note: 'Scheduled General Shift (09:15 AM - 05:45 PM)',
            }
          : rec
      )
    );

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === empId || emp.id === userId || (empId === 'EMP41001' && emp.id === 'EMP-01')
          ? {
              ...emp,
              todayStatus: 'Absent' as any,
              todayCheckIn: undefined,
              todayCheckOut: undefined,
              todayLocation: undefined,
            }
          : emp
      )
    );
  };

  const addTimelineNote = (title: string, description: string) => {
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setTimelineItems((prev) => [
      ...prev,
      {
        id: `tl-${Date.now()}`,
        time: formatted,
        title,
        description,
        type: 'meeting',
        completed: true,
      },
    ]);
  };

  // Apply Leave
  const applyLeave = (req: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) => {
    const newReq: LeaveRequest = {
      ...req,
      id: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
    dbService.saveLeaveRequest(newReq);

    // Update available balance preview
    setLeaveBalances((prev) =>
      prev.map((bal) =>
        bal.type === req.leaveType
          ? { ...bal, available: Math.max(0, bal.available - req.days), used: bal.used + req.days }
          : bal
      )
    );

    addNotification(
      'Leave Request Submitted',
      `Your request for ${req.leaveType} (${req.days} days) is pending manager review.`,
      'leave'
    );
  };

  const cancelLeaveRequest = (id: string) => {
    setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
    dbService.deleteLeaveRequest(id);
    addNotification('Leave Request Cancelled', 'The pending leave request was removed.', 'leave');
  };

  // Admin Leave & Permission Approvals
  const approveLeave = (
    id: string,
    adminRemarks: string = 'Approved by HR Administrator',
    reviewerName: string = 'HR Administrator'
  ) => {
    const reviewedAt = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const targetReq = leaveRequests.find((l) => l.id === id);

    if (targetReq && targetReq.status !== 'Approved') {
      const empId = targetReq.employeeId || 'EMP41001';
      const isPermission =
        targetReq.category === 'Permission' ||
        targetReq.leaveType.toLowerCase().includes('permission');

      setEmployeeBalancesMap((prev) => {
        const current = prev[empId] || {
          casualLeave: { available: 8, total: 12, used: 4 },
          sickLeave: { available: 5, total: 8, used: 3 },
          earnedLeave: { available: 12, total: 18, used: 6 },
          permissionsRemaining: 2,
          permissionsTotal: 2,
        };

        if (isPermission) {
          return {
            ...prev,
            [empId]: {
              ...current,
              permissionsRemaining: Math.max(0, current.permissionsRemaining - 1),
            },
          };
        }

        const days = targetReq.days || 1;
        const leaveKey: 'casualLeave' | 'sickLeave' | 'earnedLeave' =
          targetReq.leaveType === 'Sick Leave'
            ? 'sickLeave'
            : targetReq.leaveType === 'Earned Leave'
            ? 'earnedLeave'
            : 'casualLeave';

        const updatedCat = {
          ...current[leaveKey],
          available: Math.max(0, current[leaveKey].available - days),
          used: current[leaveKey].used + days,
        };

        return {
          ...prev,
          [empId]: {
            ...current,
            [leaveKey]: updatedCat,
          },
        };
      });

      // If approved request is for logged-in user, also sync leaveBalances state
      if ((empId === 'EMP41001' || empId === '015212' || empId === 'E12345') && !isPermission) {
        setLeaveBalances((prev) =>
          prev.map((bal) =>
            bal.type === targetReq.leaveType
              ? {
                  ...bal,
                  available: Math.max(0, bal.available - targetReq.days),
                  used: bal.used + targetReq.days,
                }
              : bal
          )
        );
      }
    }

    setLeaveRequests((prev) => {
      const updatedList = prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: 'Approved' as const,
              reviewedBy: reviewerName || 'HR Administrator',
              reviewedAt,
              adminRemarks,
            }
          : l
      );
      const updatedItem = updatedList.find((l) => l.id === id);
      if (updatedItem) dbService.saveLeaveRequest(updatedItem);
      return updatedList;
    });
    addNotification('Leave / Permission Approved', `Request ${id} was approved by ${reviewerName || 'HR Administrator'}.`, 'leave');
  };

  const rejectLeave = (
    id: string,
    adminRemarks: string = 'Rejected by HR Administrator',
    reviewerName: string = 'HR Administrator'
  ) => {
    const reviewedAt = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    setLeaveRequests((prev) => {
      const updatedList = prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: 'Rejected' as const,
              reviewedBy: reviewerName || 'HR Administrator',
              reviewedAt,
              adminRemarks,
            }
          : l
      );
      const updatedItem = updatedList.find((l) => l.id === id);
      if (updatedItem) dbService.saveLeaveRequest(updatedItem);
      return updatedList;
    });
    addNotification('Leave / Permission Rejected', `Request ${id} was rejected by ${reviewerName || 'Administrator'}: ${adminRemarks}`, 'leave');
  };

  // Attendance Regularization (Missed Attendance Application)
  const applyRegularization = (
    req: Omit<RegularizationRequest, 'id' | 'status' | 'appliedDate' | 'reviewedBy' | 'reviewedAt' | 'adminRemarks'>
  ) => {
    const newReq: RegularizationRequest = {
      ...req,
      id: `REG-${Math.floor(2050 + Math.random() * 9000)}`,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    setRegularizationRequests((prev) => [newReq, ...prev]);
    dbService.saveRegularizationRequest(newReq);

    addNotification(
      'Regularization Submitted',
      `Missed attendance request for ${req.date} submitted. Attendance will be marked after Manager/Admin approval.`,
      'attendance'
    );
  };

  // Manager or Admin approves regularization: Only then the attendance is granted & marked Present
  const approveRegularization = (
    id: string,
    adminRemarks: string = 'Approved by HR Administrator',
    reviewerName: string = 'HR Administrator'
  ) => {
    const target = regularizationRequests.find((r) => r.id === id);
    if (!target) return;

    const reviewedAt = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    // 1. Update regularization request state to Approved & sync to DB
    setRegularizationRequests((prev) => {
      const updatedList = prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Approved' as const,
              adminRemarks,
              reviewedBy: reviewerName || 'HR Administrator',
              reviewedAt,
            }
          : r
      );
      const updated = updatedList.find((r) => r.id === id);
      if (updated) dbService.saveRegularizationRequest(updated);
      return updatedList;
    });

    // 2. Automatically regularize the attendance history record: change status to 'Present'
    setAttendanceHistory((prev) => {
      const exists = prev.find((item) => item.date === target.date);
      if (exists) {
        const updated = prev.map((item) =>
          item.date === target.date
            ? {
                ...item,
                checkIn: target.requestedCheckIn,
                checkOut: target.requestedCheckOut,
                workingHours: '8h 30m',
                workingMinutes: 510,
                status: 'Present' as const,
                note: `Regularized by ${reviewerName || 'Admin'}: ${adminRemarks}`,
              }
            : item
        );
        const record = updated.find((item) => item.date === target.date);
        if (record) dbService.saveAttendanceRecord(record);
        return updated;
      } else {
        const dateObj = new Date(target.date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const newRecord: DailyAttendanceRecord = {
          id: `ATT-REG-${Date.now()}`,
          date: target.date,
          dayName: dayNames[dateObj.getDay()] || 'Weekday',
          checkIn: target.requestedCheckIn,
          checkOut: target.requestedCheckOut,
          workingHours: '8h 30m',
          workingMinutes: 510,
          breakDuration: '45m',
          status: 'Present',
          note: `Regularized by ${reviewerName || 'Admin'}: ${adminRemarks}`,
        };
        dbService.saveAttendanceRecord(newRecord);
        return [newRecord, ...prev];
      }
    });

    // 3. Update employee directory status if matched
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === target.employeeId
          ? { ...emp, todayStatus: 'Present', todayCheckIn: target.requestedCheckIn }
          : emp
      )
    );

    // 4. Send official notification
    addNotification(
      'Regularization Approved',
      `Attendance for ${target.employeeName} on ${target.date} has been regularized and confirmed as Present by ${reviewerName || 'Administrator'}.`,
      'attendance'
    );
  };

  // Manager or Admin rejects regularization: remains Absent/Unapproved
  const rejectRegularization = (
    id: string,
    adminRemarks: string = 'Rejected by HR Administrator',
    reviewerName: string = 'HR Administrator'
  ) => {
    const target = regularizationRequests.find((r) => r.id === id);
    if (!target) return;

    const reviewedAt = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    setRegularizationRequests((prev) => {
      const updatedList = prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Rejected' as const,
              adminRemarks,
              reviewedBy: reviewerName || 'HR Administrator',
              reviewedAt,
            }
          : r
      );
      const updated = updatedList.find((r) => r.id === id);
      if (updated) dbService.saveRegularizationRequest(updated);
      return updatedList;
    });

    addNotification(
      'Regularization Rejected',
      `Missed attendance request for ${target.date} was rejected by ${reviewerName || 'Administrator'}: ${adminRemarks}`,
      'attendance'
    );
  };

  const pendingRegularizationCount = regularizationRequests.filter((r) => r.status === 'Pending').length;

  // Task actions
  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isDone = t.status === 'Completed';
          return {
            ...t,
            status: isDone ? 'In Progress' : 'Completed',
            category: isDone ? 'Today' : 'Completed',
          };
        }
        return t;
      })
    );
  };

  const addTask = (newTask: Omit<TaskItem, 'id'>) => {
    const item: TaskItem = {
      ...newTask,
      id: `TSK-${Math.floor(400 + Math.random() * 500)}`,
    };
    setTasks((prev) => [item, ...prev]);
    addNotification('New Task Created', `Task "${item.title}" added to your list.`, 'task');
  };

  // Notification actions
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = (title: string, message: string, type: NotificationItem['type'] = 'system') => {
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title,
      message,
      time: 'Just now',
      type,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Employee Directory actions
  const addEmployee = (emp: Omit<EmployeeDirectoryItem, 'id'>) => {
    const lat = emp.todayCoordinates?.lat || OFFICE_GEOFENCE.latitude;
    const lng = emp.todayCoordinates?.lng || OFFICE_GEOFENCE.longitude;
    const geo = verifyGeofence(lat, lng);
    const created: EmployeeDirectoryItem = {
      ...emp,
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      geofenceEnabled: emp.geofenceEnabled !== undefined ? emp.geofenceEnabled : true,
      assignedGeofence: emp.assignedGeofence || 'Science & Industrial Resources (Chromepet, Tambaram • 2km)',
      isWithinGeofence: emp.geofenceEnabled === false ? true : geo.isWithin,
      geofenceDistance: geo.distance,
    };
    setEmployees((prev) => [created, ...prev]);
    dbService.saveEmployee(created);
    addNotification('Employee Added', `${emp.fullName} has been added to the directory.`, 'system');
  };

  const updateEmployee = (id: string, updates: Partial<EmployeeDirectoryItem>) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
          const updated = { ...emp, ...updates };
          if (updates.todayCoordinates) {
            const geo = verifyGeofence(updates.todayCoordinates.lat, updates.todayCoordinates.lng);
            updated.isWithinGeofence = updated.geofenceEnabled === false ? true : geo.isWithin;
            updated.geofenceDistance = geo.distance;
          }
          dbService.saveEmployee(updated);
          return updated;
        }
        return emp;
      })
    );
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find((e) => e.id === id);
    if (target) {
      dbService.deleteEmployee(target.employeeId);
    }
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  const toggleEmployeeStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
          const newStatus: EmployeeDirectoryItem['status'] = emp.status === 'Inactive' ? 'Active' : 'Inactive';
          const notificationTitle = newStatus === 'Active' ? 'Employee Activated' : 'Employee Deactivated';
          const notificationMsg =
            newStatus === 'Active'
              ? `${emp.fullName} (${emp.employeeId}) account has been re-activated. Login access is granted.`
              : `${emp.fullName} (${emp.employeeId}) account has been deactivated. Login access is now blocked.`;
          addNotification(notificationTitle, notificationMsg, 'system');
          const updated = {
            ...emp,
            status: newStatus,
            todayStatus: (newStatus === 'Inactive' ? 'Absent' : emp.todayStatus) as EmployeeDirectoryItem['todayStatus'],
          };
          dbService.saveEmployee(updated);
          return updated;
        }
        return emp;
      })
    );
  };

  const importEmployees = (newEmployees: EmployeeDirectoryItem[]) => {
    setEmployees((prev) => {
      const incomingIds = new Set(newEmployees.map((e) => e.employeeId.toUpperCase()));
      const filtered = prev.filter((e) => !incomingIds.has(e.employeeId.toUpperCase()));
      const combined = [...newEmployees, ...filtered];
      try {
        localStorage.setItem('msir_employees_directory', JSON.stringify(combined));
      } catch {}
      return combined;
    });
    dbService.bulkSaveEmployees(newEmployees);
    addNotification('Employees Imported', `Successfully imported ${newEmployees.length} employee accounts.`, 'system');
  };

  const clearAllData = () => {
    setEmployees([]);
    setAttendanceHistory([]);
    setLeaveRequests([]);
    setRegularizationRequests([]);
    setTasks([]);
    setNotifications([]);
    setEmployeeBalancesMap({});
    try {
      localStorage.removeItem('msir_employees_directory');
      localStorage.removeItem('msir_attendance_history');
      localStorage.removeItem('msir_leave_requests');
      localStorage.removeItem('msir_regularization_requests');
      localStorage.removeItem('msir_employee_leave_balances');
      localStorage.removeItem('msir_custom_avatars');
    } catch {}
    addNotification('Data Reset', 'All employee, manager, attendance, and leave records have been cleared.', 'system');
  };

  return (
    <AttendanceContext.Provider
      value={{
        isCheckedIn,
        isCheckedOut,
        checkInTime,
        checkOutTime,
        checkInLocation,
        checkOutLocation,
        isTrackingLocation,
        locationError,
        workingDuration,
        workingDurationSeconds,
        todayStatus,
        checkIn,
        refreshLocation,
        checkOut,
        resetDay,
        timelineItems,
        addTimelineNote,
        attendanceHistory,
        leaveBalances,
        leaveRequests,
        getEmployeeLeaveBalances,
        applyLeave,
        cancelLeaveRequest,
        approveLeave,
        rejectLeave,
        regularizationRequests,
        pendingRegularizationCount,
        applyRegularization,
        approveRegularization,
        rejectRegularization,
        tasks,
        toggleTaskStatus,
        addTask,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        toggleEmployeeStatus,
        importEmployees,
        clearAllData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
