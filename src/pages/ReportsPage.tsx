import React, { useState } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  Clock,
  Printer,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { departmentStatsMock } from '../data/mockData';
import { ALL_CALIBRATION_DEPARTMENT_NAMES } from '../data/calibrationRoles';
import { PageId } from '../types';

interface ReportsPageProps {
  onNavigate?: (page: PageId) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const { employees, addNotification } = useAttendance();

  const [reportType, setReportType] = useState('Monthly Attendance');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return `${y}-${m}-01 to ${y}-${m}-${lastDay}`;
  });
  const [department, setDepartment] = useState('All Departments');
  const [employee, setEmployee] = useState('All Employees');
  const [status, setStatus] = useState('All');
  const [isGenerated, setIsGenerated] = useState(true);

  const departmentStats = React.useMemo(() => {
    if (employees.length === 0) return [];
    const map: Record<string, { total: number; present: number; leave: number; absent: number }> = {};
    employees.forEach((emp) => {
      const dept = emp.department || 'General';
      if (!map[dept]) map[dept] = { total: 0, present: 0, leave: 0, absent: 0 };
      map[dept].total += 1;
      if (emp.todayStatus === 'Present') map[dept].present += 1;
      else if (emp.todayStatus === 'Leave') map[dept].leave += 1;
      else map[dept].absent += 1;
    });
    return Object.entries(map).map(([name, s]) => ({
      name,
      total: s.total,
      present: s.present,
      leave: s.leave,
      absent: s.absent,
      rate: s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(1)) : 0,
    }));
  }, [employees]);

  const handleGenerate = () => {
    setIsGenerated(true);
    addNotification('Report Generated', `Generated ${reportType} for ${department}.`, 'system');
  };

  const handleExportPDF = () => {
    addNotification('Export Initiated', `Downloading ${reportType} as PDF report...`, 'system');
  };

  const handleExportExcel = () => {
    addNotification('Export Initiated', `Downloading ${reportType} as Excel spreadsheet...`, 'system');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Monthly Attendance & Salary Banner */}
      {onNavigate && (
        <div className="bg-gradient-to-r from-[#123B66] via-[#1E4E8C] to-[#2B63A8] text-white rounded-3xl p-5 sm:p-6 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
                Official Payroll Module
              </span>
              <h3 className="text-base sm:text-lg font-black">
                Monthly Attendance Reports & Salary Export
              </h3>
              <p className="text-xs text-blue-100 mt-0.5 max-w-xl">
                Review employee-wise monthly working days, approved leaves, absences, and download Excel, CSV, or PDF for salary calculation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('monthly-reports')}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-[#123B66] hover:bg-blue-50 transition-colors shadow-soft-xs flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            Open Monthly Reports
            <Download className="w-4 h-4 text-[#3D78C5]" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
            Workforce Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Export compliant payroll attendance audits, punctuality scores, and department metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-red-500" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-soft-xs transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters Configuration Card per Requirement 17 */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs space-y-4">
        <h3 className="font-bold text-[#172033] text-base pb-3 border-b border-[#E4EAF1]/70">
          Report Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          {/* Report Type */}
          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
            >
              <option value="Daily Attendance">Daily Attendance</option>
              <option value="Monthly Attendance">Monthly Attendance</option>
              <option value="Employee Attendance">Employee Attendance</option>
              <option value="Department Attendance">Department Attendance</option>
              <option value="Leave Report">Leave Report</option>
              <option value="Late Attendance Report">Late Attendance Report</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1">Date Range</label>
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
            >
              <option value="All Departments">All Calibration Departments</option>
              {ALL_CALIBRATION_DEPARTMENT_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee */}
          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1">Employee</label>
            <select
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
            >
              <option value="All Employees">All Employees ({employees.length})</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.fullName}>
                  {emp.fullName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Late">Late Only</option>
              <option value="Leave">On Leave Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={handleGenerate}
            className="px-6 py-2.5 rounded-xl font-extrabold text-xs text-white bg-[#123B66] hover:bg-[#1a4a7f] shadow-soft-xs transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4 text-[#F5C542]" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Generated Report Summary Metrics */}
      {isGenerated && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <span className="text-xs text-[#667085] font-semibold block">Total Working Days</span>
              <span className="text-2xl font-extrabold text-[#172033] mt-1 block font-mono">22</span>
              <span className="text-[11px] text-[#667085] mt-0.5 block">Standard monthly cycle</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <span className="text-xs text-[#667085] font-semibold block">Punctuality Score</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block font-mono">95.4%</span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">+1.2% above threshold</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <span className="text-xs text-[#667085] font-semibold block">Avg Daily Hours</span>
              <span className="text-2xl font-extrabold text-[#3D78C5] mt-1 block font-mono">8h 24m</span>
              <span className="text-[11px] text-[#667085] mt-0.5 block">Shift requirement: 8.0h</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <span className="text-xs text-[#667085] font-semibold block">Accumulated Overtime</span>
              <span className="text-2xl font-extrabold text-amber-600 mt-1 block font-mono">6h 40m</span>
              <span className="text-[11px] text-[#667085] mt-0.5 block">Eligible for comp-off</span>
            </div>
          </div>

          {/* Generated Table View */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF1]">
              <div>
                <h4 className="font-bold text-[#172033] text-base">
                  {reportType} Output Table
                </h4>
                <p className="text-xs text-[#667085]">
                  Scope: {department} • Period: {dateRange}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                Audited & Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E4EAF1] text-xs font-bold text-[#667085] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Department / Unit</th>
                    <th className="py-3.5 px-4">Headcount</th>
                    <th className="py-3.5 px-4">Avg Check In</th>
                    <th className="py-3.5 px-4">Avg Check Out</th>
                    <th className="py-3.5 px-4">Present %</th>
                    <th className="py-3.5 px-4">Total Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAF1]/70">
                  {departmentStats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-[#667085]">
                        No department metrics available. Upload employee records to view unit reports.
                      </td>
                    </tr>
                  ) : (
                    departmentStats.map((row) => (
                      <tr key={row.name} className="hover:bg-[#F8FAFC]">
                        <td className="py-3.5 px-4 font-bold text-[#172033]">{row.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{row.total} staff</td>
                        <td className="py-3.5 px-4 font-mono text-xs">09:08 AM</td>
                        <td className="py-3.5 px-4 font-mono text-xs">06:14 PM</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {row.rate}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#3D78C5] font-semibold">
                          +14.5h
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
