import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Printer,
  ChevronRight,
  Eye,
  Building2,
  UserCheck,
  CalendarDays,
  FileCheck2,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  calculateAllEmployeesMonthlyAttendance,
  calculateEmployeeMonthlyAttendance,
  generateMonthlyAttendanceCSV,
  generateDailyAttendanceCSV,
  generateMonthlyAttendanceExcelXML,
  downloadFileBlob,
  EmployeeMonthlySummary,
} from '../utils/monthlyAttendanceReport';
import { ALL_CALIBRATION_DEPARTMENT_NAMES } from '../data/calibrationRoles';

interface MonthlyAttendanceReportPageProps {
  onNavigate?: (page: any) => void;
}

export const MonthlyAttendanceReportPage: React.FC<MonthlyAttendanceReportPageProps> = () => {
  const { user } = useAuth();
  const { employees, leaveRequests, regularizationRequests, addNotification } = useAttendance();

  // Selected filters
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // October by default
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [inspectEmployee, setInspectEmployee] = useState<EmployeeMonthlySummary | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const [exportDetailLevel, setExportDetailLevel] = useState<'summary' | 'daily'>('summary');
  const [showSalaryFormulaHelp, setShowSalaryFormulaHelp] = useState<boolean>(false);

  // Month list
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [2025, 2026, 2027];

  // Unique departments from directory or calibration departments fallback
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    if (set.size === 0) {
      ALL_CALIBRATION_DEPARTMENT_NAMES.forEach((dept) => set.add(dept));
    }
    return Array.from(set).sort();
  }, [employees]);

  // Compute monthly calculations for all employees with current filters
  const monthlySummaries = useMemo(() => {
    return calculateAllEmployeesMonthlyAttendance({
      employees,
      leaveRequests,
      regularizationRequests,
      year: selectedYear,
      month: selectedMonth,
      department: selectedDepartment,
      selectedEmployeeId: selectedEmployeeId,
    });
  }, [employees, leaveRequests, regularizationRequests, selectedYear, selectedMonth, selectedDepartment, selectedEmployeeId]);

  // Apply search query filter
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return monthlySummaries;
    const q = searchQuery.toLowerCase().trim();
    return monthlySummaries.filter(
      (s) =>
        s.employeeName.toLowerCase().includes(q) ||
        s.employeeId.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q)
    );
  }, [monthlySummaries, searchQuery]);

  // Aggregate high-level totals across the filtered list
  const aggregateTotals = useMemo(() => {
    const totalStaff = filteredSummaries.length;
    const totalPresentDays = filteredSummaries.reduce((acc, curr) => acc + curr.daysPresent, 0);
    const totalAbsentDays = filteredSummaries.reduce((acc, curr) => acc + curr.daysAbsent, 0);
    const totalPaidLeaves = filteredSummaries.reduce((acc, curr) => acc + curr.approvedPaidLeaveDays, 0);
    const totalUnpaidLeaves = filteredSummaries.reduce((acc, curr) => acc + curr.approvedUnpaidLeaveDays, 0);
    const totalPendingLeaves = filteredSummaries.reduce((acc, curr) => acc + curr.pendingLeaveDays, 0);
    const totalLateArrivals = filteredSummaries.reduce((acc, curr) => acc + curr.lateArrivals, 0);
    const totalPermissions = filteredSummaries.reduce((acc, curr) => acc + curr.permissionRecords, 0);
    const totalMissingPunches = filteredSummaries.reduce((acc, curr) => acc + curr.missingAttendanceRecords, 0);
    const totalPayableDays = filteredSummaries.reduce((acc, curr) => acc + curr.totalPayableDays, 0);
    const totalWorkingDays = filteredSummaries.length > 0 ? filteredSummaries[0].totalWorkingDays : 0;
    const totalCalendarDays = filteredSummaries.length > 0 ? filteredSummaries[0].totalDaysInMonth : 0;
    const averageAttendanceRate =
      totalStaff > 0
        ? Math.round(
            (filteredSummaries.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / totalStaff) * 10
          ) / 10
        : 0;

    return {
      totalStaff,
      totalWorkingDays,
      totalCalendarDays,
      totalPresentDays,
      totalAbsentDays,
      totalPaidLeaves,
      totalUnpaidLeaves,
      totalPendingLeaves,
      totalLateArrivals,
      totalPermissions,
      totalMissingPunches,
      totalPayableDays,
      averageAttendanceRate,
    };
  }, [filteredSummaries]);

  // Current month name
  const currentMonthName = months.find((m) => m.value === selectedMonth)?.label || 'Month';

  // Handle Export Download Execution
  const handleExecuteExport = () => {
    const targetSummaries =
      exportScope === 'selected' && inspectEmployee
        ? [inspectEmployee]
        : filteredSummaries;

    if (targetSummaries.length === 0) {
      alert('No employee records available to export for the current filters.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const baseFilename = `Monthly_Attendance_${currentMonthName}_${selectedYear}_${targetSummaries.length}Staff`;

    if (exportFormat === 'csv') {
      if (exportDetailLevel === 'daily') {
        const csvContent = generateDailyAttendanceCSV(targetSummaries, selectedMonth, selectedYear);
        downloadFileBlob(csvContent, `${baseFilename}_DailyRecords.csv`, 'text/csv;charset=utf-8;');
      } else {
        const csvContent = generateMonthlyAttendanceCSV(targetSummaries, selectedMonth, selectedYear);
        downloadFileBlob(csvContent, `${baseFilename}_SalarySummary.csv`, 'text/csv;charset=utf-8;');
      }
      addNotification('Download Complete', `Exported CSV report (${exportDetailLevel === 'daily' ? 'Daily Punches' : 'Monthly Summary'}).`, 'system');
      setShowExportModal(false);
    } else if (exportFormat === 'xlsx') {
      const excelXmlContent = generateMonthlyAttendanceExcelXML(
        targetSummaries,
        selectedMonth,
        selectedYear,
        exportDetailLevel === 'daily'
      );
      downloadFileBlob(excelXmlContent, `${baseFilename}.xls`, 'application/vnd.ms-excel');
      addNotification('Download Complete', `Exported Excel spreadsheet for ${currentMonthName} ${selectedYear}.`, 'system');
      setShowExportModal(false);
    } else if (exportFormat === 'pdf') {
      // Print-friendly view
      setShowExportModal(false);
      setTimeout(() => {
        window.print();
      }, 300);
      addNotification('Print Dialog', `Opened printable PDF attendance summary.`, 'system');
    }
  };

  // Quick single employee export helper
  const handleExportSingleEmployee = (emp: EmployeeMonthlySummary, format: 'xlsx' | 'csv') => {
    const filename = `Attendance_${emp.employeeId}_${emp.employeeName.replace(/\s+/g, '_')}_${currentMonthName}_${selectedYear}`;
    if (format === 'csv') {
      const csv = generateDailyAttendanceCSV([emp], selectedMonth, selectedYear);
      downloadFileBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
    } else {
      const xls = generateMonthlyAttendanceExcelXML([emp], selectedMonth, selectedYear, true);
      downloadFileBlob(xls, `${filename}.xls`, 'application/vnd.ms-excel');
    }
    addNotification('File Exported', `Downloaded attendance report for ${emp.employeeName} (${emp.employeeId}).`, 'system');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Header Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-3 py-1 rounded-full flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Payroll & HR Audits
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Salary Processing Ready
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-2">
            Monthly Attendance Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-2xl">
            Review detailed monthly attendance metrics, audit check-in/out records, calculate payable attendance days, and export salary processing data.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowSalaryFormulaHelp(!showSalaryFormulaHelp)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center gap-2"
            title="View salary payable days calculation logic"
          >
            <HelpCircle className="w-4 h-4 text-[#3D78C5]" />
            Salary Policy Rules
          </button>

          <button
            onClick={() => {
              setExportScope('all');
              setShowExportModal(true);
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#123B66] to-[#1E4E8C] hover:from-[#0E2E50] hover:to-[#173F73] shadow-soft-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* Salary Policy Help Box (Collapsible) */}
      {showSalaryFormulaHelp && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-5 text-xs text-[#123B66] shadow-soft-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm flex items-center gap-2 text-[#123B66]">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Company Salary Attendance Calculation Policy
            </h4>
            <button
              onClick={() => setShowSalaryFormulaHelp(false)}
              className="text-[#667085] hover:text-[#172033]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[#334155] leading-relaxed">
            Attendance data for monthly payroll follows standard statutory salary processing principles:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/90 p-3 rounded-xl border border-blue-100">
              <span className="font-bold text-[#123B66] block mb-1">Payable Days Formula</span>
              <p className="text-[11px] text-[#475569]">
                <code className="bg-blue-50 px-1 py-0.5 rounded font-mono text-[#123B66]">
                  Payable = Present + (Half Days × 0.5) + Approved Paid Leaves + Paid Holidays + Paid Weekly Offs - Unpaid Absences
                </code>
              </p>
            </div>
            <div className="bg-white/90 p-3 rounded-xl border border-blue-100">
              <span className="font-bold text-[#123B66] block mb-1">Loss of Pay (LOP)</span>
              <p className="text-[11px] text-[#475569]">
                Unapproved absences or unpaid leave requests are categorized as <span className="font-bold text-red-600">Loss of Pay (LOP)</span> and deducted from payable attendance.
              </p>
            </div>
            <div className="bg-white/90 p-3 rounded-xl border border-blue-100">
              <span className="font-bold text-[#123B66] block mb-1">Approved Corrections</span>
              <p className="text-[11px] text-[#475569]">
                Only manager/admin approved regularizations convert absent/missing punch records into valid attendance credit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Filters Bar: Month, Year, Department, Employee, Search */}
      <div className="bg-white rounded-2xl p-5 border border-[#E4EAF1] shadow-soft-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF1]">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#172033]">
            <Filter className="w-4 h-4 text-[#3D78C5]" />
            Report Filter Options
          </div>
          <span className="text-[11px] text-[#667085] font-medium">
            Active Period: <span className="font-bold text-[#123B66]">{currentMonthName} {selectedYear}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Month Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-1.5">
              Select Month
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#667085] absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-[#E4EAF1] bg-[#F8FAFC] text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-colors"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Year Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-1.5">
              Select Year
            </label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 text-[#667085] absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-[#E4EAF1] bg-[#F8FAFC] text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-colors"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-1.5">
              Department
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#667085] absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-[#E4EAF1] bg-[#F8FAFC] text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-colors"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-1.5">
              Employee Scope
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-[#667085] absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-[#E4EAF1] bg-[#F8FAFC] text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-colors"
              >
                <option value="All">All Employees ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-1.5">
              Search by Name / ID
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#667085] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-[#E4EAF1] bg-[#F8FAFC] text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#667085] hover:text-[#172033]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Summary Totals Cards at Top */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Employees Audited */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Employees
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#3D78C5]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-[#172033]">{aggregateTotals.totalStaff}</p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Working Days: <span className="font-bold text-[#172033]">{aggregateTotals.totalWorkingDays}</span> / {aggregateTotals.totalCalendarDays}
            </p>
          </div>
        </div>

        {/* Card 2: Total Days Present */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Total Present
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-emerald-600">{aggregateTotals.totalPresentDays}</p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Avg Rate: <span className="font-bold text-emerald-700">{aggregateTotals.averageAttendanceRate}%</span>
            </p>
          </div>
        </div>

        {/* Card 3: Days Absent / LOP */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Absences (LOP)
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-rose-600">{aggregateTotals.totalAbsentDays}</p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Unpaid Leaves: <span className="font-bold text-rose-700">{aggregateTotals.totalUnpaidLeaves}</span>
            </p>
          </div>
        </div>

        {/* Card 4: Approved Leaves */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Approved Leaves
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-indigo-600">{aggregateTotals.totalPaidLeaves}</p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Pending: <span className="font-bold text-amber-600">{aggregateTotals.totalPendingLeaves}</span>
            </p>
          </div>
        </div>

        {/* Card 5: Late & Permissions */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Late & Perm.
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-amber-600">
              {aggregateTotals.totalLateArrivals} <span className="text-xs font-bold text-[#667085]">late</span>
            </p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Permissions: <span className="font-bold text-[#172033]">{aggregateTotals.totalPermissions}</span> | Miss: <span className="font-bold text-rose-600">{aggregateTotals.totalMissingPunches}</span>
            </p>
          </div>
        </div>

        {/* Card 6: Payable Days for Salary */}
        <div className="bg-gradient-to-br from-[#123B66] to-[#1E4E8C] text-white rounded-2xl p-4 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              Payable Days (Salary)
            </span>
            <div className="p-1.5 rounded-lg bg-white/10 text-emerald-300">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-emerald-300">{aggregateTotals.totalPayableDays}</p>
            <p className="text-[11px] text-blue-100 mt-0.5">
              Official Payroll Attendance
            </p>
          </div>
        </div>
      </div>

      {/* 4. Monthly Attendance Summary Table */}
      <div className="bg-white rounded-3xl border border-[#E4EAF1] shadow-soft-xs overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-5 sm:px-6 border-b border-[#E4EAF1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC]/50">
          <div>
            <h3 className="font-extrabold text-base text-[#172033] flex items-center gap-2">
              <span>Employee Monthly Attendance Summary</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EAF2FB] text-[#3D78C5]">
                {filteredSummaries.length} Employees Listed
              </span>
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Showing attendance breakdown for {currentMonthName} {selectedYear}. Click "View Details" to inspect daily punches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setExportFormat('xlsx');
                setExportDetailLevel('summary');
                handleExecuteExport();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#123B66] bg-white hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center gap-1.5 shadow-soft-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Quick Excel
            </button>
            <button
              onClick={() => {
                setExportFormat('csv');
                setExportDetailLevel('summary');
                handleExecuteExport();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#123B66] bg-white hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center gap-1.5 shadow-soft-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#3D78C5]" />
              Quick CSV
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E4EAF1] text-[11px] font-bold text-[#667085] uppercase tracking-wider select-none">
                <th className="py-3.5 px-4">Employee Details</th>
                <th className="py-3.5 px-3 text-center">Work Days</th>
                <th className="py-3.5 px-3 text-center">Present</th>
                <th className="py-3.5 px-3 text-center">Absent (LOP)</th>
                <th className="py-3.5 px-3 text-center">Approved Leaves</th>
                <th className="py-3.5 px-3 text-center">Pending</th>
                <th className="py-3.5 px-3 text-center">Holidays / Offs</th>
                <th className="py-3.5 px-3 text-center">Late / Perm</th>
                <th className="py-3.5 px-3 text-center">Punches</th>
                <th className="py-3.5 px-3 text-center">Total Hours</th>
                <th className="py-3.5 px-3 text-center bg-emerald-50/60 text-emerald-800">Payable Days</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAF1] text-xs font-medium text-[#172033]">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-[#667085]">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <Search className="w-8 h-8 text-[#667085] mx-auto opacity-40" />
                      <p className="font-bold text-sm text-[#172033]">No employee attendance records found</p>
                      <p className="text-xs text-[#667085]">
                        Try adjusting your filters, department selection, or search term.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((summary) => (
                  <tr
                    key={summary.employeeId}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                  >
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#123B66] to-[#3D78C5] text-white flex items-center justify-center font-bold text-xs shadow-soft-xs">
                          {summary.employeeName.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => setInspectEmployee(summary)}
                            className="font-bold text-[#172033] hover:text-[#3D78C5] transition-colors text-left flex items-center gap-1"
                          >
                            <span>{summary.employeeName}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#3D78C5]" />
                          </button>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#667085] mt-0.5">
                            <span className="font-mono font-bold text-[#123B66]">{summary.employeeId}</span>
                            <span>•</span>
                            <span>{summary.department}</span>
                          </div>
                          <span className="text-[10px] text-[#667085] block truncate max-w-[140px]">
                            {summary.designation}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Total Working Days */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-[#172033]">{summary.totalWorkingDays}</span>
                      <span className="text-[10px] text-[#667085] block">days</span>
                    </td>

                    {/* Days Present */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {summary.daysPresent}
                      </span>
                      {summary.halfDays > 0 && (
                        <span className="text-[10px] text-amber-600 block mt-0.5">
                          +{summary.halfDays} half
                        </span>
                      )}
                    </td>

                    {/* Days Absent */}
                    <td className="py-3.5 px-3 text-center">
                      {summary.daysAbsent > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          {summary.daysAbsent}
                        </span>
                      ) : (
                        <span className="text-[#667085] text-xs">0</span>
                      )}
                    </td>

                    {/* Approved Leaves */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-bold text-[#172033]">
                        {summary.approvedPaidLeaveDays + summary.approvedUnpaidLeaveDays}
                      </div>
                      <div className="text-[10px] text-[#667085]">
                        <span className="text-emerald-700 font-bold">{summary.approvedPaidLeaveDays} Paid</span>
                        {summary.approvedUnpaidLeaveDays > 0 && (
                          <span className="text-rose-600 ml-1 font-bold">({summary.approvedUnpaidLeaveDays} Unpaid)</span>
                        )}
                      </div>
                    </td>

                    {/* Pending Leaves */}
                    <td className="py-3.5 px-3 text-center">
                      {summary.pendingLeaveDays > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {summary.pendingLeaveDays}
                        </span>
                      ) : (
                        <span className="text-[#667085] text-xs">-</span>
                      )}
                    </td>

                    {/* Holidays & Weekly Offs */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-[#172033]">{summary.weeklyOffDays + summary.holidays}</span>
                      <span className="text-[10px] text-[#667085] block">
                        {summary.weeklyOffDays} Off / {summary.holidays} Hol
                      </span>
                    </td>

                    {/* Late Arrivals & Permissions */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="text-xs">
                        {summary.lateArrivals > 0 ? (
                          <span className="font-bold text-amber-600">{summary.lateArrivals} Late</span>
                        ) : (
                          <span className="text-[#667085]">-</span>
                        )}
                      </div>
                      {summary.permissionRecords > 0 && (
                        <span className="text-[10px] text-blue-600 font-bold block">
                          {summary.permissionRecords} Perm
                        </span>
                      )}
                    </td>

                    {/* Punches & Missing records */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-[#172033]">
                        {summary.totalCheckIns} in / {summary.totalCheckOuts} out
                      </span>
                      {summary.missingAttendanceRecords > 0 ? (
                        <span className="text-[10px] font-bold text-rose-600 block">
                          {summary.missingAttendanceRecords} Missing
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 block">Complete</span>
                      )}
                    </td>

                    {/* Total Working Hours */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-[#172033]">{summary.totalWorkingHours}</span>
                      <span className="text-[10px] text-[#667085] block">
                        {summary.attendancePercentage}% rate
                      </span>
                    </td>

                    {/* Total Payable Days (Salary) */}
                    <td className="py-3.5 px-3 text-center bg-emerald-50/50">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-soft-xs">
                        {summary.totalPayableDays} Days
                      </span>
                      {summary.lossOfPayDays > 0 ? (
                        <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                          -{summary.lossOfPayDays} LOP
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                          Full Month
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectEmployee(summary)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#123B66] bg-[#EAF2FB] hover:bg-[#3D78C5] hover:text-white transition-colors flex items-center gap-1"
                          title="View day-by-day attendance punch log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleExportSingleEmployee(summary, 'xlsx')}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#123B66] hover:bg-[#F8FAFC] transition-colors"
                          title="Download Excel for this employee"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Day-by-Day Attendance Record Detail Modal */}
      {inspectEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-soft-xl border border-[#E4EAF1] overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#123B66] to-[#1E4E8C] text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg text-white">
                  {inspectEmployee.employeeName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black">{inspectEmployee.employeeName}</h3>
                    <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {inspectEmployee.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {inspectEmployee.designation} • {inspectEmployee.department} • Period: {currentMonthName} {selectedYear}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSingleEmployee(inspectEmployee, 'xlsx')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors flex items-center gap-1.5 border border-white/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export XLSX
                </button>
                <button
                  onClick={() => setInspectEmployee(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Stats Bar */}
            <div className="bg-[#F8FAFC] border-b border-[#E4EAF1] p-4 px-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-[#E4EAF1]">
                <span className="text-[10px] text-[#667085] uppercase font-bold block">Present Days</span>
                <span className="text-base font-extrabold text-emerald-600">{inspectEmployee.daysPresent}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E4EAF1]">
                <span className="text-[10px] text-[#667085] uppercase font-bold block">Days Absent (LOP)</span>
                <span className="text-base font-extrabold text-rose-600">{inspectEmployee.daysAbsent}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E4EAF1]">
                <span className="text-[10px] text-[#667085] uppercase font-bold block">Approved Leaves</span>
                <span className="text-base font-extrabold text-[#3D78C5]">
                  {inspectEmployee.approvedPaidLeaveDays} Paid / {inspectEmployee.approvedUnpaidLeaveDays} Unpaid
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E4EAF1]">
                <span className="text-[10px] text-[#667085] uppercase font-bold block">Late / Permissions</span>
                <span className="text-base font-extrabold text-amber-600">
                  {inspectEmployee.lateArrivals} late / {inspectEmployee.permissionRecords} perm
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E4EAF1]">
                <span className="text-[10px] text-[#667085] uppercase font-bold block">Total Hours</span>
                <span className="text-base font-extrabold text-[#172033]">{inspectEmployee.totalWorkingHours}</span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Payable Days (Salary)</span>
                <span className="text-base font-black text-emerald-700">{inspectEmployee.totalPayableDays} Days</span>
              </div>
            </div>

            {/* Day-by-Day Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="border border-[#E4EAF1] rounded-2xl overflow-hidden shadow-soft-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E4EAF1] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3">Day</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Check-In</th>
                      <th className="py-3 px-3 text-center">Check-Out</th>
                      <th className="py-3 px-3 text-center">Hours</th>
                      <th className="py-3 px-3 text-center">Punctuality</th>
                      <th className="py-3 px-3 text-center">Corrections</th>
                      <th className="py-3 px-4">Remarks / Policy Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4EAF1]">
                    {inspectEmployee.dailyRecords.map((day) => {
                      const isWeekendOrHoliday = day.isWeekend || day.isHoliday;
                      return (
                        <tr
                          key={day.date}
                          className={`hover:bg-[#F8FAFC] transition-colors ${
                            isWeekendOrHoliday ? 'bg-slate-50/60 text-[#667085]' : ''
                          }`}
                        >
                          {/* Date */}
                          <td className="py-2.5 px-3.5 font-bold font-mono text-[#172033]">
                            {day.date}
                          </td>

                          {/* Day Name */}
                          <td className="py-2.5 px-3 font-semibold text-[#667085]">
                            {day.dayName}
                          </td>

                          {/* Status Badge */}
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                day.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : day.status === 'Late'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : day.status === 'Absent'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : day.status === 'Leave'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : day.status === 'Holiday'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : day.status === 'Weekend'
                                  ? 'bg-gray-100 text-gray-600'
                                  : day.status === 'Half Day' || day.status === 'Half Day Leave'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {day.status}
                            </span>
                          </td>

                          {/* Check-In */}
                          <td className="py-2.5 px-3 text-center font-mono font-medium">
                            {day.checkIn || (isWeekendOrHoliday ? '-' : <span className="text-rose-500 font-bold">Missing</span>)}
                          </td>

                          {/* Check-Out */}
                          <td className="py-2.5 px-3 text-center font-mono font-medium">
                            {day.checkOut || (isWeekendOrHoliday ? '-' : day.checkIn ? <span className="text-amber-500 font-bold">Missing</span> : '-')}
                          </td>

                          {/* Hours */}
                          <td className="py-2.5 px-3 text-center font-semibold">
                            {day.workingHours !== '-' ? (
                              <span className="text-[#123B66] font-bold">{day.workingHours}</span>
                            ) : (
                              <span className="text-[#667085]">-</span>
                            )}
                          </td>

                          {/* Punctuality */}
                          <td className="py-2.5 px-3 text-center">
                            {day.isLate ? (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Late Arrival
                              </span>
                            ) : day.hasPermission ? (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                Permission
                              </span>
                            ) : (
                              <span className="text-[#667085] text-xs">-</span>
                            )}
                          </td>

                          {/* Regularization Corrections */}
                          <td className="py-2.5 px-3 text-center">
                            {day.isRegularized ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Approved Regularization
                              </span>
                            ) : (
                              <span className="text-[#667085] text-xs">-</span>
                            )}
                          </td>

                          {/* Notes / Remarks */}
                          <td className="py-2.5 px-4 text-[#475569]">
                            {day.notes ? (
                              <span>{day.notes}</span>
                            ) : day.holidayName ? (
                              <span className="font-semibold text-purple-700">{day.holidayName}</span>
                            ) : (
                              <span className="text-[#94A3B8] italic text-[11px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-[#E4EAF1] bg-[#F8FAFC] flex items-center justify-between">
              <span className="text-xs text-[#667085]">
                Records generated on: <span className="font-semibold text-[#172033]">{new Date().toLocaleDateString()}</span>
              </span>
              <button
                onClick={() => setInspectEmployee(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-[#123B66] bg-white hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Download Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-soft-xl border border-[#E4EAF1] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4EAF1]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-[#123B66]">
                  <Download className="w-5 h-5 text-[#3D78C5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#172033]">Download Attendance Data</h3>
                  <p className="text-xs text-[#667085]">
                    Export verified monthly records for salary and payroll processing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-[#667085] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#172033] uppercase tracking-wider block">
                1. Select Export Scope
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    exportScope === 'all'
                      ? 'border-[#3D78C5] bg-[#EAF2FB]/60 text-[#123B66] font-bold shadow-soft-xs'
                      : 'border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="font-extrabold block text-sm">All Employees</span>
                  <span className="text-[11px] opacity-80">
                    Export all {filteredSummaries.length} filtered employees
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (inspectEmployee) {
                      setExportScope('selected');
                    } else if (filteredSummaries.length > 0) {
                      setInspectEmployee(filteredSummaries[0]);
                      setExportScope('selected');
                    }
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    exportScope === 'selected'
                      ? 'border-[#3D78C5] bg-[#EAF2FB]/60 text-[#123B66] font-bold shadow-soft-xs'
                      : 'border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="font-extrabold block text-sm">Selected Employee</span>
                  <span className="text-[11px] opacity-80">
                    {inspectEmployee ? inspectEmployee.employeeName : 'Individual staff audit'}
                  </span>
                </button>
              </div>
            </div>

            {/* Detail Level Selection */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#172033] uppercase tracking-wider block">
                2. Report Content Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportDetailLevel('summary')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    exportDetailLevel === 'summary'
                      ? 'border-[#3D78C5] bg-[#EAF2FB]/60 text-[#123B66] font-bold shadow-soft-xs'
                      : 'border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="font-extrabold block text-sm">Monthly Summary</span>
                  <span className="text-[11px] opacity-80">
                    Totals & Payable Days for Salary
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportDetailLevel('daily')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    exportDetailLevel === 'daily'
                      ? 'border-[#3D78C5] bg-[#EAF2FB]/60 text-[#123B66] font-bold shadow-soft-xs'
                      : 'border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="font-extrabold block text-sm">Daily Punch Log</span>
                  <span className="text-[11px] opacity-80">
                    Day-by-day in/out & corrections
                  </span>
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#172033] uppercase tracking-wider block">
                3. File Format
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Excel Option */}
                <button
                  type="button"
                  onClick={() => setExportFormat('xlsx')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    exportFormat === 'xlsx'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-soft-xs ring-2 ring-emerald-500/20'
                      : 'border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs font-extrabold block">Excel (.xlsx)</span>
                  <span className="text-[10px] opacity-80">Multi-sheet</span>
                </button>

                {/* CSV Option */}
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    exportFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold shadow-soft-xs ring-2 ring-blue-500/20'
                      : 'border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1 text-[#3D78C5]" />
                  <span className="text-xs font-extrabold block">CSV (.csv)</span>
                  <span className="text-[10px] opacity-80">Universal</span>
                </button>

                {/* PDF Option */}
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    exportFormat === 'pdf'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold shadow-soft-xs ring-2 ring-rose-500/20'
                      : 'border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Printer className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                  <span className="text-xs font-extrabold block">PDF (.pdf)</span>
                  <span className="text-[10px] opacity-80">Printable</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4EAF1]">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#667085] hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteExport}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#123B66] to-[#1E4E8C] hover:from-[#0E2E50] hover:to-[#173F73] shadow-soft-sm transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Generate & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
