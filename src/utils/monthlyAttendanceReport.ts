import { EmployeeDirectoryItem, LeaveRequest, RegularizationRequest, DailyAttendanceRecord, AttendanceStatus } from '../types';

export interface CompanyHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

// Configured Official Calendar Holidays for 2026 (MSIR India / Aten Systems)
export const COMPANY_HOLIDAYS_2026: CompanyHoliday[] = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-15', name: 'Pongal / Makar Sankranti' },
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-05-01', name: 'May Day / Labor Day' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-09-04', name: 'Krishna Jayanti' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-10-20', name: 'Vijayadashami / Dussehra' },
  { date: '2026-11-08', name: 'Deepavali / Diwali' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

export interface EmployeeDailyDetail {
  date: string; // YYYY-MM-DD
  dayName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus | 'Upcoming' | 'Pre-Joining';
  workingHours: string;
  workingMinutes: number;
  isLate: boolean;
  hasPermission: boolean;
  permissionDetails?: string;
  isRegularized: boolean;
  regularizationRemarks?: string;
  leaveType?: string;
  isPaidLeave: boolean;
  isUnpaidLeave: boolean;
  isMissingPunch: boolean;
  location?: string;
  notes?: string;
}

export interface EmployeeMonthlySummary {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: 'Active' | 'On Probation' | 'Inactive';
  year: number;
  month: number;
  monthName: string;
  
  // Calendar Totals
  totalDaysInMonth: number;
  totalWorkingDays: number;
  weeklyOffDays: number;
  holidays: number;
  
  // Attendance Counts
  daysPresent: number;
  daysAbsent: number;
  halfDays: number;
  approvedLeaveDays: number;
  pendingLeaveDays: number;
  lateArrivals: number;
  permissionRecords: number;
  totalCheckIns: number;
  totalCheckOuts: number;
  missingAttendanceRecords: number; // missing punch
  
  // Working Hours
  totalWorkingMinutes: number;
  totalWorkingHours: string;
  totalWorkingHoursFormatted: string; // e.g. "172h 30m"
  avgDailyWorkingHours: string;
  
  // Salary Processing Metrics (Requirement 4)
  approvedPaidLeaveDays: number;
  approvedUnpaidLeaveDays: number;
  lossOfPayDays: number;
  totalPayableDays: number; // calculated according to company policy
  attendancePercentage: number;
  
  // Daily Breakdown
  dailyRecords: EmployeeDailyDetail[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getMonthName = (month: number): string => {
  return MONTH_NAMES[month - 1] || 'Unknown';
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

/**
 * Computes the complete monthly attendance report and salary calculation data
 * for an employee for the specified year and month.
 */
export const calculateEmployeeMonthlyAttendance = (
  employee: EmployeeDirectoryItem,
  year: number,
  month: number, // 1-12
  allLeaveRequests: LeaveRequest[],
  allRegularizationRequests: RegularizationRequest[],
  historicalRecords: DailyAttendanceRecord[],
  systemDate: Date = new Date(2026, 9, 12) // Default system date: 12 Oct 2026
): EmployeeMonthlySummary => {
  const daysInMonth = getDaysInMonth(year, month);
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const monthName = getMonthName(month);
  
  const dailyRecords: EmployeeDailyDetail[] = [];
  
  // Relevant leaves for this employee
  const empLeaves = allLeaveRequests.filter(
    (l) => (l.employeeId || '').toLowerCase() === employee.employeeId.toLowerCase()
  );
  
  // Relevant regularizations for this employee
  const empRegs = allRegularizationRequests.filter(
    (r) => (r.employeeId || '').toLowerCase() === employee.employeeId.toLowerCase()
  );

  let weeklyOffCount = 0;
  let holidayCount = 0;
  let workingDaysCount = 0;
  
  let daysPresent = 0;
  let daysAbsent = 0;
  let halfDays = 0;
  let lateArrivals = 0;
  let approvedPaidLeaveDays = 0;
  let approvedUnpaidLeaveDays = 0;
  let pendingLeaveDays = 0;
  let permissionRecords = 0;
  let totalCheckIns = 0;
  let totalCheckOuts = 0;
  let missingAttendanceRecords = 0;
  let totalWorkingMinutes = 0;

  // Process day by day
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateFormatted = `${year}-${monthStr}-${dayStr}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holidayMatch = COMPANY_HOLIDAYS_2026.find((h) => h.date === dateFormatted);
    const isHoliday = !!holidayMatch;
    
    if (isWeekend) {
      weeklyOffCount++;
    } else if (isHoliday) {
      holidayCount++;
    } else {
      workingDaysCount++;
    }

    // Check pre-joining
    const joiningDateObj = employee.joiningDate ? new Date(employee.joiningDate) : new Date(2025, 0, 1);
    const isPreJoining = !isNaN(joiningDateObj.getTime()) && dateObj < joiningDateObj;

    // Check future / upcoming
    const isFuture = dateObj > systemDate;

    // Check approved regularization
    const approvedReg = empRegs.find(
      (r) => r.date === dateFormatted && r.status === 'Approved'
    );
    
    // Check leave requests on this date
    const leaveOnDate = empLeaves.find((l) => {
      const from = new Date(l.fromDate);
      const to = new Date(l.toDate);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return dateObj >= from && dateObj <= to;
    });

    // Check existing attendance history record
    const existingHist = historicalRecords.find((h) => h.date === dateFormatted);

    let checkIn: string | null = null;
    let checkOut: string | null = null;
    let workingMinutes = 0;
    let workingHours = '-';
    let status: AttendanceStatus | 'Upcoming' | 'Pre-Joining' = 'Present';
    let isLate = false;
    let hasPermission = false;
    let permissionDetails: string | undefined = undefined;
    let isRegularized = false;
    let regularizationRemarks: string | undefined = undefined;
    let leaveType: string | undefined = undefined;
    let isPaidLeave = false;
    let isUnpaidLeave = false;
    let isMissingPunch = false;
    let location: string | undefined = employee.todayLocation || 'Science & Industrial Resources, Chromepet';
    let notes: string | undefined = undefined;

    if (isPreJoining) {
      status = 'Pre-Joining';
      notes = 'Prior to employment commencement date';
    } else if (isHoliday) {
      status = 'Holiday';
      notes = holidayMatch?.name;
    } else if (isWeekend) {
      status = 'Weekend';
      notes = 'Standard Weekly Off';
    } else if (approvedReg) {
      // Authorized Regularization applied
      status = 'Present';
      checkIn = approvedReg.requestedCheckIn || '09:00 AM';
      checkOut = approvedReg.requestedCheckOut || '06:00 PM';
      workingMinutes = 540;
      workingHours = '9h 00m';
      isRegularized = true;
      regularizationRemarks = `Approved by ${approvedReg.reviewedBy || 'Manager'}: ${approvedReg.adminRemarks || approvedReg.reason}`;
      daysPresent++;
      totalCheckIns++;
      totalCheckOuts++;
      totalWorkingMinutes += workingMinutes;
    } else if (leaveOnDate) {
      if (leaveOnDate.category === 'Permission') {
        hasPermission = true;
        permissionDetails = leaveOnDate.permissionTime || '2 Hours Official Permission';
        permissionRecords++;
        if (leaveOnDate.status === 'Approved') {
          // Employee still present during workday
          status = 'Present';
          checkIn = '09:00 AM';
          checkOut = '05:30 PM';
          workingMinutes = 495;
          workingHours = '8h 15m';
          daysPresent++;
          totalCheckIns++;
          totalCheckOuts++;
          totalWorkingMinutes += workingMinutes;
          notes = `Approved Permission: ${permissionDetails}`;
        } else {
          status = 'Present';
          checkIn = '09:20 AM';
          checkOut = '06:00 PM';
          workingMinutes = 520;
          workingHours = '8h 40m';
          daysPresent++;
          totalCheckIns++;
          totalCheckOuts++;
          totalWorkingMinutes += workingMinutes;
          notes = `Pending Permission: ${permissionDetails}`;
        }
      } else {
        // Standard leave
        leaveType = leaveOnDate.leaveType;
        if (leaveOnDate.status === 'Approved') {
          status = 'Leave';
          const isUnpaid = leaveType.toLowerCase().includes('unpaid') || leaveType.toLowerCase().includes('loss of pay');
          if (isUnpaid) {
            isUnpaidLeave = true;
            approvedUnpaidLeaveDays += leaveOnDate.days >= 1 ? 1 : leaveOnDate.days;
          } else {
            isPaidLeave = true;
            approvedPaidLeaveDays += leaveOnDate.days >= 1 ? 1 : leaveOnDate.days;
          }
          notes = `Approved ${leaveType} (${leaveOnDate.reason})`;
        } else if (leaveOnDate.status === 'Pending') {
          if (!isFuture) {
            status = 'Leave';
            pendingLeaveDays += leaveOnDate.days >= 1 ? 1 : leaveOnDate.days;
            notes = `Pending ${leaveType} Application`;
          } else {
            status = 'Upcoming';
            pendingLeaveDays += leaveOnDate.days >= 1 ? 1 : leaveOnDate.days;
            notes = `Pending ${leaveType} Scheduled`;
          }
        } else {
          // Rejected leave
          if (!isFuture) {
            status = 'Absent';
            daysAbsent++;
            notes = `Rejected Leave: ${leaveOnDate.adminRemarks || 'Unexcused Absence'}`;
          } else {
            status = 'Upcoming';
          }
        }
      }
    } else if (isFuture) {
      status = 'Upcoming';
    } else {
      // Past or current workday
      // Use existing history if available, else derive consistent deterministic data
      if (existingHist && employee.employeeId === 'EMP41001') {
        status = existingHist.status;
        checkIn = existingHist.checkIn;
        checkOut = existingHist.checkOut;
        workingMinutes = existingHist.workingMinutes || 0;
        workingHours = existingHist.workingHours || '-';
        location = existingHist.location || location;
        notes = existingHist.note;
        
        if (status === 'Present') {
          daysPresent++;
          if (checkIn) totalCheckIns++;
          if (checkOut) totalCheckOuts++;
          totalWorkingMinutes += workingMinutes;
        } else if (status === 'Late') {
          daysPresent++;
          isLate = true;
          lateArrivals++;
          if (checkIn) totalCheckIns++;
          if (checkOut) totalCheckOuts++;
          totalWorkingMinutes += workingMinutes;
        } else if (status === 'Half Day') {
          halfDays++;
          if (checkIn) totalCheckIns++;
          if (checkOut) totalCheckOuts++;
          totalWorkingMinutes += workingMinutes;
        } else if (status === 'Absent') {
          daysAbsent++;
        }
      } else {
        // Evaluate based on employee's profile and active status
        const isCurrentDay = dateFormatted === `${systemDate.getFullYear()}-${(systemDate.getMonth()+1).toString().padStart(2, '0')}-${systemDate.getDate().toString().padStart(2, '0')}`;
        
        if (isCurrentDay) {
          if (employee.todayStatus === 'Present') {
            status = 'Present';
            checkIn = employee.todayCheckIn || '09:12 AM';
            checkOut = '06:15 PM';
            workingMinutes = 543;
            workingHours = '9h 03m';
            daysPresent++;
            totalCheckIns++;
            totalCheckOuts++;
            totalWorkingMinutes += workingMinutes;
          } else if (employee.todayStatus === 'Late') {
            status = 'Late';
            isLate = true;
            lateArrivals++;
            checkIn = employee.todayCheckIn || '09:42 AM';
            checkOut = '06:45 PM';
            workingMinutes = 543;
            workingHours = '9h 03m';
            daysPresent++;
            totalCheckIns++;
            totalCheckOuts++;
            totalWorkingMinutes += workingMinutes;
          } else if (employee.todayStatus === 'Leave') {
            status = 'Leave';
            isPaidLeave = true;
            approvedPaidLeaveDays += 1;
            notes = 'On Approved Leave';
          } else {
            status = 'Absent';
            daysAbsent++;
            notes = 'Absence Recorded';
          }
        } else {
          // Normal weekday deterministic calculation
          // Most employees are present with high punctuality (>95%)
          const seed = (employee.employeeId.charCodeAt(employee.employeeId.length - 1) || 1) + day;
          const isLateProb = seed % 17 === 0;
          const isAbsentProb = employee.status === 'Inactive' || (seed % 29 === 0);
          
          if (isAbsentProb) {
            status = 'Absent';
            daysAbsent++;
            notes = employee.status === 'Inactive' ? 'Account Deactivated' : 'Unplanned Absence';
          } else if (isLateProb) {
            status = 'Late';
            isLate = true;
            lateArrivals++;
            checkIn = '09:44 AM';
            checkOut = '06:50 PM';
            workingMinutes = 546;
            workingHours = '9h 06m';
            daysPresent++;
            totalCheckIns++;
            totalCheckOuts++;
            totalWorkingMinutes += workingMinutes;
          } else {
            status = 'Present';
            const minuteOffset = (seed % 15);
            checkIn = `09:${minuteOffset < 10 ? '0' + minuteOffset : minuteOffset} AM`;
            checkOut = '06:15 PM';
            workingMinutes = 540 - minuteOffset + 15;
            workingHours = `${Math.floor(workingMinutes/60)}h ${(workingMinutes%60).toString().padStart(2, '0')}m`;
            daysPresent++;
            totalCheckIns++;
            totalCheckOuts++;
            totalWorkingMinutes += workingMinutes;
          }
        }
      }
    }

    // Check missing punch
    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      isMissingPunch = true;
      missingAttendanceRecords++;
    }

    dailyRecords.push({
      date: dateFormatted,
      dayName,
      isWeekend,
      isHoliday,
      holidayName: holidayMatch?.name,
      checkIn,
      checkOut,
      status,
      workingHours,
      workingMinutes,
      isLate,
      hasPermission,
      permissionDetails,
      isRegularized,
      regularizationRemarks,
      leaveType,
      isPaidLeave,
      isUnpaidLeave,
      isMissingPunch,
      location,
      notes,
    });
  }

  // Format hours
  const totalHours = Math.floor(totalWorkingMinutes / 60);
  const remMinutes = totalWorkingMinutes % 60;
  const totalWorkingHoursFormatted = `${totalHours}h ${remMinutes.toString().padStart(2, '0')}m`;
  
  const avgMinutesPerDay = daysPresent > 0 ? Math.round(totalWorkingMinutes / daysPresent) : 0;
  const avgDailyWorkingHours = `${Math.floor(avgMinutesPerDay / 60)}h ${(avgMinutesPerDay % 60).toString().padStart(2, '0')}m`;

  const approvedLeaveDays = approvedPaidLeaveDays + approvedUnpaidLeaveDays;
  const lossOfPayDays = daysAbsent + approvedUnpaidLeaveDays;
  
  // Total Payable Days calculation according to company policy:
  // Paid Days = Days Present + (Half Days * 0.5) + Approved Paid Leaves + Paid Holidays + Paid Weekly Offs
  const totalPayableDays = Math.min(
    daysInMonth,
    Math.round((daysPresent + (halfDays * 0.5) + approvedPaidLeaveDays + weeklyOffCount + holidayCount) * 10) / 10
  );

  const attendancePercentage = workingDaysCount > 0
    ? Math.min(100, Math.round(((daysPresent + approvedPaidLeaveDays) / workingDaysCount) * 1000) / 10)
    : 100;

  return {
    employeeId: employee.employeeId,
    employeeName: employee.fullName,
    department: employee.department,
    designation: employee.designation,
    joiningDate: employee.joiningDate,
    status: employee.status,
    year,
    month,
    monthName,
    totalDaysInMonth: daysInMonth,
    totalWorkingDays: workingDaysCount,
    weeklyOffDays: weeklyOffCount,
    holidays: holidayCount,
    daysPresent,
    daysAbsent,
    halfDays,
    approvedLeaveDays,
    pendingLeaveDays,
    lateArrivals,
    permissionRecords,
    totalCheckIns,
    totalCheckOuts,
    missingAttendanceRecords,
    totalWorkingMinutes,
    totalWorkingHours: totalWorkingHoursFormatted,
    totalWorkingHoursFormatted,
    avgDailyWorkingHours,
    approvedPaidLeaveDays,
    approvedUnpaidLeaveDays,
    lossOfPayDays,
    totalPayableDays,
    attendancePercentage,
    dailyRecords,
  };
};

export interface CalculateMonthlyOptions {
  employees: EmployeeDirectoryItem[];
  year: number;
  month: number;
  leaveRequests?: LeaveRequest[];
  regularizationRequests?: RegularizationRequest[];
  historicalRecords?: DailyAttendanceRecord[];
  department?: string;
  selectedEmployeeId?: string;
}

/**
 * Generates monthly summaries for all filtered employees.
 * Supports either an options object or positional parameters.
 */
export function calculateAllEmployeesMonthlyAttendance(
  optionsOrEmployees: CalculateMonthlyOptions | EmployeeDirectoryItem[],
  yearParam?: number,
  monthParam?: number,
  allLeaveRequests?: LeaveRequest[],
  allRegularizationRequests?: RegularizationRequest[],
  historicalRecords?: DailyAttendanceRecord[],
  selectedDepartment?: string,
  selectedEmployeeId?: string
): EmployeeMonthlySummary[] {
  let employees: EmployeeDirectoryItem[];
  let year: number;
  let month: number;
  let leaveRequests: LeaveRequest[];
  let regularizationRequests: RegularizationRequest[];
  let histRecords: DailyAttendanceRecord[];
  let department: string | undefined;
  let empId: string | undefined;

  if (Array.isArray(optionsOrEmployees)) {
    employees = optionsOrEmployees;
    year = yearParam || new Date().getFullYear();
    month = monthParam || new Date().getMonth() + 1;
    leaveRequests = allLeaveRequests || [];
    regularizationRequests = allRegularizationRequests || [];
    histRecords = historicalRecords || [];
    department = selectedDepartment;
    empId = selectedEmployeeId;
  } else {
    employees = optionsOrEmployees.employees;
    year = optionsOrEmployees.year;
    month = optionsOrEmployees.month;
    leaveRequests = optionsOrEmployees.leaveRequests || [];
    regularizationRequests = optionsOrEmployees.regularizationRequests || [];
    histRecords = optionsOrEmployees.historicalRecords || [];
    department = optionsOrEmployees.department;
    empId = optionsOrEmployees.selectedEmployeeId;
  }

  let list = employees;
  
  if (department && department !== 'All' && department !== 'All Departments') {
    list = list.filter((e) => e.department.toLowerCase() === department.toLowerCase());
  }
  
  if (empId && empId !== 'All' && empId !== 'All Employees') {
    list = list.filter(
      (e) =>
        e.employeeId.toLowerCase() === empId.toLowerCase() ||
        e.fullName.toLowerCase() === empId.toLowerCase()
    );
  }

  return list.map((emp) =>
    calculateEmployeeMonthlyAttendance(
      emp,
      year,
      month,
      leaveRequests,
      regularizationRequests,
      histRecords
    )
  );
}

// ==========================================
// EXPORT HELPERS: CSV, EXCEL, AND PRINTABLE PDF
// ==========================================

/**
 * Generates a clean CSV file string for the Monthly Summary
 */
export const generateMonthlyAttendanceCSV = (
  summaries: EmployeeMonthlySummary[],
  month: string | number,
  year: number
): string => {
  const monthName = typeof month === 'number' ? getMonthName(month) : month;
  const headers = [
    'Employee ID',
    'Employee Name',
    'Department',
    'Designation',
    'Status',
    'Total Month Days',
    'Total Working Days',
    'Days Present',
    'Days Absent',
    'Half Days',
    'Approved Paid Leaves',
    'Approved Unpaid Leaves',
    'Pending Leaves',
    'Weekly Offs',
    'Holidays',
    'Late Arrivals',
    'Permissions (2h)',
    'Total Check-Ins',
    'Total Check-Outs',
    'Missing Punches',
    'Total Working Hours',
    'Avg Daily Hours',
    'Loss Of Pay Days (LOP)',
    'Total Payable Days (Salary)',
    'Attendance %',
  ];

  const rows = summaries.map((s) => [
    `"${s.employeeId}"`,
    `"${s.employeeName}"`,
    `"${s.department}"`,
    `"${s.designation}"`,
    `"${s.status}"`,
    s.totalDaysInMonth,
    s.totalWorkingDays,
    s.daysPresent,
    s.daysAbsent,
    s.halfDays,
    s.approvedPaidLeaveDays,
    s.approvedUnpaidLeaveDays,
    s.pendingLeaveDays,
    s.weeklyOffDays,
    s.holidays,
    s.lateArrivals,
    s.permissionRecords,
    s.totalCheckIns,
    s.totalCheckOuts,
    s.missingAttendanceRecords,
    `"${s.totalWorkingHoursFormatted}"`,
    `"${s.avgDailyWorkingHours}"`,
    s.lossOfPayDays,
    s.totalPayableDays,
    `"${s.attendancePercentage}%"`,
  ]);

  const metaHeader = [
    `"MSIR INDIA CALIBRATION - MONTHLY ATTENDANCE & SALARY AUDIT REPORT"`,
    `"Period: ${monthName} ${year}"`,
    `"Report Generated: ${new Date().toLocaleString()}"`,
    `"Total Employees Audited: ${summaries.length}"`,
    '',
  ];

  return [metaHeader.join('\n'), headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

/**
 * Generates a detailed CSV file containing daily attendance punches for all or selected employees.
 */
export const generateDailyAttendanceCSV = (
  summaries: EmployeeMonthlySummary[],
  month: string | number,
  year: number
): string => {
  const monthName = typeof month === 'number' ? getMonthName(month) : month;
  const headers = [
    'Date',
    'Day',
    'Employee ID',
    'Employee Name',
    'Department',
    'Designation',
    'Check-In Time',
    'Check-Out Time',
    'Status',
    'Working Hours',
    'Late Arrival',
    'Permission Used',
    'Authorized Correction',
    'Leave Category',
    'Location / Office',
    'Notes / Reason',
  ];

  const rows: string[] = [];

  summaries.forEach((s) => {
    s.dailyRecords.forEach((d) => {
      rows.push(
        [
          `"${d.date}"`,
          `"${d.dayName}"`,
          `"${s.employeeId}"`,
          `"${s.employeeName}"`,
          `"${s.department}"`,
          `"${s.designation}"`,
          `"${d.checkIn || '-'}"`,
          `"${d.checkOut || '-'}"`,
          `"${d.status}"`,
          `"${d.workingHours}"`,
          `"${d.isLate ? 'YES' : 'NO'}"`,
          `"${d.hasPermission ? (d.permissionDetails || 'YES') : 'NO'}"`,
          `"${d.isRegularized ? 'APPROVED' : 'NO'}"`,
          `"${d.leaveType || '-'}"`,
          `"${d.location || 'MSIR Campus'}"`,
          `"${d.notes || d.regularizationRemarks || '-'}"`,
        ].join(',')
      );
    });
  });

  const metaHeader = [
    `"MSIR INDIA CALIBRATION - DAILY ATTENDANCE AUDIT LOG"`,
    `"Period: ${monthName} ${year}"`,
    `"Generated: ${new Date().toLocaleString()}"`,
    '',
  ];

  return [metaHeader.join('\n'), headers.join(','), ...rows].join('\n');
};

/**
 * Generates an Excel-compatible XML Workbook (.xlsx / .xls format) with multi-sheet support,
 * styles, bold headers, and column widths. Opens seamlessly in MS Excel, Numbers, and Sheets.
 */
export const generateMonthlyAttendanceExcelXML = (
  summaries: EmployeeMonthlySummary[],
  month: string | number,
  year: number,
  includeDailyDetails: boolean = true
): string => {
  const monthName = typeof month === 'number' ? getMonthName(month) : month;
  const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#172033"/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#123B66"/>
  </Style>
  <Style ss:ID="HeaderSub">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#667085"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4EAF1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4EAF1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#123B66" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SalaryHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4EAF1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4EAF1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#172033"/>
   <Interior ss:Color="#F5C542" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#172033"/>
  </Style>
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#172033"/>
  </Style>
  <Style ss:ID="PayableCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#0F766E"/>
   <Interior ss:Color="#CCFBF1" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Monthly Attendance &amp; Salary">
  <Table ss:DefaultColumnWidth="80" ss:DefaultRowHeight="20">
   <Column ss:Width="80"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="130"/>
   <Column ss:Width="70"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Row ss:Height="30">
    <Cell ss:MergeAcross="7" ss:StyleID="HeaderTitle"><Data ss:Type="String">MSIR INDIA CALIBRATION - MONTHLY ATTENDANCE AUDIT</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="7" ss:StyleID="HeaderSub"><Data ss:Type="String">Month: ${monthName} ${year} | Report Date: ${new Date().toLocaleDateString()} | Audited Staff: ${summaries.length}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">EMP ID</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Employee Name</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Department</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Designation</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Working Days</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Present</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Absent</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Paid Leaves</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Unpaid Leaves</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Weekly Offs</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Holidays</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Late</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Permissions</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Total Hours</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Avg Hours</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Missing Punches</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Loss of Pay (LOP)</Data></Cell>
    <Cell ss:StyleID="SalaryHeader"><Data ss:Type="String">Payable Days (Salary)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Attendance %</Data></Cell>
   </Row>`;

  const rowsXml = summaries
    .map(
      (s) => `   <Row ss:Height="22">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${s.employeeId}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${s.employeeName}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${s.department}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${s.designation}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.totalWorkingDays}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.daysPresent}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.daysAbsent}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.approvedPaidLeaveDays}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.approvedUnpaidLeaveDays}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.weeklyOffDays}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.holidays}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.lateArrivals}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.permissionRecords}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${s.totalWorkingHoursFormatted}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${s.avgDailyWorkingHours}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.missingAttendanceRecords}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${s.lossOfPayDays}</Data></Cell>
    <Cell ss:StyleID="PayableCell"><Data ss:Type="Number">${s.totalPayableDays}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${s.attendancePercentage}%</Data></Cell>
   </Row>`
    )
    .join('\n');

  let dailySheetXml = '';
  if (includeDailyDetails) {
    dailySheetXml = `
 <Worksheet ss:Name="Detailed Daily Punches">
  <Table ss:DefaultColumnWidth="85" ss:DefaultRowHeight="20">
   <Column ss:Width="80"/>
   <Column ss:Width="70"/>
   <Column ss:Width="80"/>
   <Column ss:Width="130"/>
   <Column ss:Width="110"/>
   <Column ss:Width="75"/>
   <Column ss:Width="75"/>
   <Column ss:Width="70"/>
   <Column ss:Width="75"/>
   <Column ss:Width="50"/>
   <Column ss:Width="100"/>
   <Column ss:Width="160"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Day</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">EMP ID</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Employee Name</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Department</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Check-In</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Check-Out</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Hours</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Late</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Correction</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Remarks / Notes</Data></Cell>
   </Row>
${summaries
  .flatMap((s) =>
    s.dailyRecords.map(
      (d) => `   <Row>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${d.date}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${d.dayName.substring(0, 3)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${s.employeeId}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${s.employeeName}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${s.department}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${d.checkIn || '-'}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${d.checkOut || '-'}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${d.status}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${d.workingHours}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${d.isLate ? 'YES' : '-'}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${d.isRegularized ? 'APPROVED' : '-'}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${(d.notes || d.regularizationRemarks || '').replace(/[<>&]/g, ' ')}</Data></Cell>
   </Row>`
    )
  )
  .join('\n')}
  </Table>
 </Worksheet>`;
  }

  return `${xmlHeader}
${rowsXml}
  </Table>
 </Worksheet>${dailySheetXml}
</Workbook>`;
};

/**
 * Triggers native browser download for CSV or Excel files
 */
export const downloadFileBlob = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
