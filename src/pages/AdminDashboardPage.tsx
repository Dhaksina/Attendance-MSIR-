import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  ClockAlert,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  Download,
  Building2,
  ChevronRight,
  Plus,
  Clock,
  Check,
  X,
  FileCheck2,
  Trash2,
  MapPin,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import { departmentStatsMock } from '../data/mockData';
import { useAttendance } from '../context/AttendanceContext';
import { PageId, EmployeeDirectoryItem } from '../types';
import { EmployeeLocationModal } from '../components/attendance/EmployeeLocationModal';

interface AdminDashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const {
    employees,
    regularizationRequests,
    approveRegularization,
    rejectRegularization,
    pendingRegularizationCount,
    deleteEmployee,
  } = useAttendance();

  const [selectedDept, setSelectedDept] = useState('All');
  const [locationModalEmployee, setLocationModalEmployee] = useState<EmployeeDirectoryItem | null>(null);

  const totalStaff = employees.length;
  const presentToday = employees.filter((e) => e.todayStatus === 'Present').length;
  const absentToday = employees.filter((e) => e.todayStatus === 'Absent').length;
  const onLeaveToday = employees.filter((e) => e.todayStatus === 'Leave').length;
  const lateToday = employees.filter((e) => e.todayStatus === 'Late').length;
  const turnoutRate = totalStaff > 0 ? ((presentToday / totalStaff) * 100).toFixed(1) : '0';
  const absentRate = totalStaff > 0 ? ((absentToday / totalStaff) * 100).toFixed(1) : '0';

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
    return Object.entries(map).map(([name, stat]) => ({
      name,
      total: stat.total,
      present: stat.present,
      leave: stat.leave,
      absent: stat.absent,
      rate: stat.total > 0 ? Number(((stat.present / stat.total) * 100).toFixed(1)) : 0,
    }));
  }, [employees]);

  const monthlyTrendData = [
    { month: 'May', rate: 91.2 },
    { month: 'Jun', rate: 93.0 },
    { month: 'Jul', rate: 92.4 },
    { month: 'Aug', rate: 94.8 },
    { month: 'Sep', rate: 93.5 },
    { month: 'Oct (Current)', rate: totalStaff > 0 ? Number(turnoutRate) : 0 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Admin Executive Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#123B66] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5C542]" />
              Executive Suite
            </span>
            <span className="text-xs text-[#667085]">HQ Workforce Intelligence</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Admin & HR Command Center
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Real-time campus headcount, department punctuality metrics, and workforce distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('admin-approvals')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#1a4a7f] shadow-soft-xs transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-[#F5C542]" />
            <span>Approvals Hub</span>
            {pendingRegularizationCount > 0 && (
              <span className="text-[10px] font-bold bg-[#EF4444] text-white px-1.5 py-0.2 rounded-full">
                {pendingRegularizationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate('employee-management')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#3D78C5]" />
            <span>Manage Employees</span>
          </button>
          <button
            onClick={() => onNavigate('monthly-reports')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#123B66] to-[#1E4E8C] hover:from-[#0E2E50] hover:to-[#173F73] shadow-soft-xs transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Monthly Attendance Reports</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4 text-[#3D78C5]" />
            <span>Analytics Reports</span>
          </button>
        </div>
      </div>

      {/* 5 Headcount Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Employees */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Total Staff
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#123B66]/10 text-[#123B66] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-2 font-mono">
            {totalStaff}
          </h3>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {totalStaff > 0 ? `${totalStaff} Active Staff` : 'No staff uploaded yet'}
          </span>
        </div>

        {/* Present */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Present Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-2 font-mono">
            {presentToday}
          </h3>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {turnoutRate}% Turnout rate
          </span>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Absent Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-2 font-mono">
            {absentToday}
          </h3>
          <span className="text-[11px] text-red-500 font-semibold mt-1 block">
            {absentRate}% of workforce
          </span>
        </div>

        {/* On Leave */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              On Leave
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FEF9C3] text-yellow-800 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-2 font-mono">
            {onLeaveToday}
          </h3>
          <span className="text-[11px] text-yellow-800 font-semibold mt-1 block">
            Approved leaves
          </span>
        </div>

        {/* Late Employees */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4EAF1] shadow-soft-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Late Arrivals
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <ClockAlert className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-2 font-mono">
            {lateToday}
          </h3>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
            Past 09:10 AM (Half Day Leave)
          </span>
        </div>
      </div>

      {/* Grid: Department Attendance Chart & Monthly Attendance Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Attendance Breakdown (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E4EAF1]/70">
              <div>
                <h3 className="font-bold text-[#172033] text-base sm:text-lg">
                  Department Attendance
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Present vs Absent ratios per business unit
                </p>
              </div>
              <span className="text-xs font-semibold text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-1 rounded-full">
                Live Roster
              </span>
            </div>

            <div className="space-y-4 mt-5">
              {departmentStats.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#667085]">
                  <Building2 className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-60" />
                  <p className="font-bold text-[#172033]">No employee data uploaded yet</p>
                  <p className="mt-1">Upload employees in the Directory to see department analytics.</p>
                </div>
              ) : (
                departmentStats.map((dept) => (
                  <div key={dept.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#172033]">{dept.name}</span>
                      <span className="font-mono font-semibold text-[#667085]">
                        <span className="text-[#3D78C5] font-bold">{dept.present}</span> / {dept.total} Present ({dept.rate}%)
                      </span>
                    </div>

                    <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#3D78C5] h-full"
                        style={{ width: `${dept.total > 0 ? (dept.present / dept.total) * 100 : 0}%` }}
                        title={`Present: ${dept.present}`}
                      />
                      <div
                        className="bg-[#F5C542] h-full"
                        style={{ width: `${dept.total > 0 ? (dept.leave / dept.total) * 100 : 0}%` }}
                        title={`Leave: ${dept.leave}`}
                      />
                      <div
                        className="bg-red-400 h-full"
                        style={{ width: `${dept.total > 0 ? (dept.absent / dept.total) * 100 : 0}%` }}
                        title={`Absent: ${dept.absent}`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 mt-5 border-t border-[#E4EAF1]/70 text-xs text-[#667085]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3D78C5]" />
                Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F5C542]" />
                Leave
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                Absent
              </span>
            </div>
            <span className="font-semibold text-emerald-600">Company Avg: 92.4%</span>
          </div>
        </div>

        {/* Monthly Attendance Trend (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E4EAF1]/70">
              <div>
                <h3 className="font-bold text-[#172033] text-base sm:text-lg">
                  Monthly Trend
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">Historical 6-month punctuality</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +3.2% YoY
              </span>
            </div>

            {/* Vertical Bar Representation */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-52 mt-6 pt-4 border-t border-[#E4EAF1]/40">
              {monthlyTrendData.map((d) => {
                const heightPercent = ((d.rate - 85) / 15) * 100;
                return (
                  <div key={d.month} className="flex flex-col items-center justify-end h-full group">
                    <span className="text-[10px] font-bold text-[#123B66] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.rate}%
                    </span>

                    <div className="w-full bg-[#F1F5F9] rounded-xl p-1 flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${Math.max(15, heightPercent)}%` }}
                        className="w-full bg-gradient-to-t from-[#123B66] to-[#3D78C5] group-hover:from-[#1b4b7d] group-hover:to-[#4e8ad8] rounded-lg transition-all shadow-soft-xs"
                      />
                    </div>

                    <span className="text-[11px] font-bold text-[#667085] mt-2 group-hover:text-[#123B66]">
                      {d.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EAF2FB] text-xs text-[#123B66] mt-4 flex items-center justify-between font-medium">
            <span>Peak Turnout:</span>
            <span className="font-bold font-mono">95.2% (Target Exceeded)</span>
          </div>
        </div>
      </div>

      {/* Missed Attendance Regularization Approvals (Admin Action Needed) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4EAF1]/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-bold text-[#172033] text-base sm:text-lg">
                Missed Attendance Regularization Approvals
              </h3>
              {pendingRegularizationCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {pendingRegularizationCount} Awaiting Decision
                </span>
              )}
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Review missed attendance claims. <strong>Attendance is marked as Present only when you approve.</strong>
            </p>
          </div>

          <button
            onClick={() => onNavigate('admin-approvals')}
            className="text-xs font-bold text-[#3D78C5] hover:text-[#123B66] transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Approvals Hub ({pendingRegularizationCount})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {regularizationRequests.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.status === 'Pending'
                  ? 'bg-[#F4F8FD] border-[#CBE0F7]'
                  : 'bg-[#F8FAFC] border-[#E4EAF1]'
              } flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={item.avatarUrl}
                  alt={item.employeeName}
                  className="w-10 h-10 rounded-xl object-cover border border-[#E4EAF1]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#172033]">{item.employeeName}</span>
                    <span className="text-xs font-mono font-semibold text-[#3D78C5]">({item.employeeId})</span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-white text-[#123B66] border border-[#E4EAF1]">
                      {item.department}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] mt-1">
                    Missed Date: <strong className="text-[#172033]">{item.date}</strong> • Requested: <span className="font-mono font-bold text-[#3D78C5]">{item.requestedCheckIn} → {item.requestedCheckOut}</span>
                  </p>
                  <p className="text-xs text-[#667085] mt-0.5 italic">
                    Reason: "{item.reason}" ({item.category})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {item.status === 'Pending' ? (
                  <>
                    <button
                      onClick={() => rejectRegularization(item.id, 'Discrepancy with access log.')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => approveRegularization(item.id, 'Approved by HR Administrator')}
                      className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-soft-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Grant Present</span>
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      item.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    {item.status === 'Approved' ? 'Regularized as Present' : 'Rejected'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Floor Attendance Stream */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF1]/70">
          <div>
            <h3 className="font-bold text-[#172033] text-base sm:text-lg">
              Live Workforce Check-In Roster
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">Biometric punches logged today</p>
          </div>
          <button
            onClick={() => onNavigate('employee-management')}
            className="text-xs font-bold text-[#3D78C5] hover:underline flex items-center gap-1"
          >
            <span>Full Directory</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {employees.slice(0, 8).map((emp) => (
            <div
              key={emp.id}
              className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex items-center gap-3 group relative hover:border-[#CBD5E1] transition-all"
            >
              <img
                src={emp.avatarUrl}
                alt={emp.fullName}
                className="w-10 h-10 rounded-xl object-cover border border-[#E4EAF1]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#172033] truncate">{emp.fullName}</p>
                <p className="text-[10px] text-[#667085] truncate">{emp.designation}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      emp.todayStatus === 'Present'
                        ? 'bg-emerald-500'
                        : emp.todayStatus === 'Late'
                        ? 'bg-amber-400'
                        : emp.todayStatus === 'Leave'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-[#667085]">
                    {emp.todayStatus} {emp.todayCheckIn ? `(${emp.todayCheckIn})` : ''}
                  </span>
                </div>

                {/* Where the employee is - Location indicator */}
                {emp.todayLocation && (
                  <button
                    onClick={() => setLocationModalEmployee(emp)}
                    className="text-[10px] text-[#123B66] bg-[#EAF2FB] hover:bg-[#d5e7fa] px-2 py-0.5 rounded-lg flex items-center gap-1 mt-1.5 transition-colors max-w-full text-left font-medium"
                    title={`View ${emp.fullName}'s exact punch location`}
                  >
                    <MapPin className="w-3 h-3 text-[#3D78C5] flex-shrink-0" />
                    <span className="truncate">{emp.todayLocation}</span>
                  </button>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete profile for ${emp.fullName} (ID: ${emp.employeeId})?`)) {
                    deleteEmployee(emp.id);
                  }
                }}
                className="p-1.5 rounded-lg text-[#667085] hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                title={`Delete ${emp.fullName}'s profile`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Admin View Employee Location Modal */}
      <EmployeeLocationModal
        isOpen={!!locationModalEmployee}
        onClose={() => setLocationModalEmployee(null)}
        employee={locationModalEmployee}
      />
    </div>
  );
};
