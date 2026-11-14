import React from 'react';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceCard } from '../components/attendance/AttendanceCard';
import { AttendanceStatCards } from '../components/attendance/AttendanceStatCards';
import { WeeklyAttendanceChart } from '../components/attendance/WeeklyAttendanceChart';
import { PageId } from '../types';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { attendanceHistory, leaveRequests } = useAttendance();

  const todayDateString = 'Thursday, 08 Oct 2026';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
              Overview
            </span>
            <span className="text-xs text-[#667085] flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#3D78C5]" />
              {todayDateString}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Good Morning, {user?.name || 'Administrator'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 leading-relaxed">
            Here's your attendance overview for today. Shift active until 05:45 PM.
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('leave')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center gap-1.5"
          >
            <CalendarDays className="w-4 h-4 text-[#3D78C5]" />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Primary Large Attendance Card */}
      <AttendanceCard />

      {/* 4 Attendance Summary Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#667085]">
            Monthly Attendance Metrics
          </h3>
          <button
            onClick={() => onNavigate('attendance-history')}
            className="text-xs font-semibold text-[#3D78C5] hover:underline flex items-center gap-1"
          >
            <span>View Full Log</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <AttendanceStatCards
          presentDays={attendanceHistory.filter((r) => r.status === 'Present').length}
          absentDays={attendanceHistory.filter((r) => r.status === 'Absent').length}
          lateDays={attendanceHistory.filter((r) => r.status === 'Late').length}
          workingHours={`${(attendanceHistory.filter((r) => r.status === 'Present').length * 8.5).toFixed(0)}h`}
        />
      </div>

      {/* Weekly Attendance Chart */}
      <div>
        <WeeklyAttendanceChart />
      </div>

      {/* Secondary Row: Recent Attendance Activity & Recent Leave Request Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance Activity */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E4EAF1]/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EAF2FB] text-[#3D78C5] flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-[#172033] text-base">Recent Attendance Activity</h4>
                <p className="text-xs text-[#667085]">Punches, shift duration & verified status</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('attendance-history')}
              className="text-xs font-bold text-[#3D78C5] hover:text-[#123B66] flex items-center gap-1"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {attendanceHistory.slice(0, 3).map((record) => (
              <div
                key={record.id}
                onClick={() => onNavigate('attendance-history')}
                className="p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E4EAF1] cursor-pointer transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172033]">{record.date}</span>
                    <span className="text-[10px] text-[#667085]">({record.dayName})</span>
                  </div>
                  <p className="text-xs text-[#667085] mt-0.5">
                    {record.checkIn ? `${record.checkIn} - ${record.checkOut || 'Active'}` : 'No punch recorded'}
                    {record.workingHours ? ` • ${record.workingHours}` : ''}
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    record.status === 'Present'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : record.status === 'Late'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : record.status === 'Leave'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Requests Overview */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E4EAF1]/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-[#172033] text-base">Leave Requests</h4>
                <p className="text-xs text-[#667085]">Recent submissions & approval status</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('leave')}
              className="text-xs font-bold text-[#3D78C5] hover:text-[#123B66] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {leaveRequests.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172033]">{req.leaveType}</span>
                    <span className="text-xs text-[#667085]">({req.days} days)</span>
                  </div>
                  <p className="text-xs text-[#667085] mt-0.5">
                    {req.fromDate} to {req.toDate}
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    req.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : req.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
