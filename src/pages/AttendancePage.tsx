import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coffee,
  MapPin,
  CalendarCheck,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  FileCheck,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceCard } from '../components/attendance/AttendanceCard';
import { AttendanceCalendar } from '../components/attendance/AttendanceCalendar';
import { RegularizationModal } from '../components/attendance/RegularizationModal';

export const AttendancePage: React.FC = () => {
  const {
    isCheckedIn,
    isCheckedOut,
    checkInTime,
    checkOutTime,
    workingDuration,
    todayStatus,
    attendanceHistory,
    regularizationRequests,
    checkInLocation,
    checkOutLocation,
  } = useAttendance();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header with Live Date & Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
              Time & Attendance
            </span>
            <span className="text-xs text-[#667085] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#3D78C5]" />
              {checkInLocation?.city || 'Chennai'} • GPS Geofenced
            </span>
            {isCheckedOut && checkOutLocation && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 font-semibold">
                <MapPin className="w-3 h-3 text-amber-600" />
                Checked Out: {checkOutLocation.city || 'Chromepet, Tambaram'}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Attendance Dashboard
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs text-[#667085] font-medium">
            <span className="flex items-center gap-1.5 text-[#172033] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#3D78C5]" />
              {currentDateFormatted}
            </span>
            <span>•</span>
            <span className="font-mono text-[#3D78C5] bg-[#EAF2FB] px-2 py-0.5 rounded-lg font-bold text-xs">
              {currentTime}
            </span>
          </div>
        </div>

        {/* Current status pill & Apply Regularization */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsRegModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center gap-1.5 shadow-soft-xs"
          >
            <Plus className="w-4 h-4 text-[#3D78C5]" />
            <span>Apply Regularization</span>
          </button>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isCheckedIn && !isCheckedOut
                  ? 'bg-emerald-500 animate-pulse'
                  : isCheckedOut
                  ? 'bg-blue-500'
                  : 'bg-amber-400'
              }`}
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Current Status</p>
              <p className="text-sm font-bold text-[#172033]">{todayStatus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Check In / Check Out Card */}
      <AttendanceCard />

      {/* Detailed Status Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
          <span className="text-xs text-[#667085] font-medium block">Check In Time</span>
          <span className="text-lg font-extrabold font-mono text-[#172033] mt-1 block">
            {checkInTime || '--:--'}
          </span>
          <span className={`text-[11px] font-semibold mt-0.5 block ${
            !isCheckedIn
              ? 'text-[#667085]'
              : attendanceHistory[0]?.status === 'Half Day Leave' || attendanceHistory[0]?.status === 'Half Day'
              ? 'text-orange-600 font-bold'
              : 'text-emerald-600'
          }`}>
            {!isCheckedIn
              ? 'Not checked in'
              : attendanceHistory[0]?.status === 'Half Day Leave' || attendanceHistory[0]?.status === 'Half Day'
              ? 'Half Day Leave (Late > 09:10 AM)'
              : 'On Time (Shift 09:00 AM)'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
          <span className="text-xs text-[#667085] font-medium block">Check Out Time</span>
          <span className="text-lg font-extrabold font-mono text-[#172033] mt-1 block">
            {checkOutTime || '--:--'}
          </span>
          <span className="text-[11px] text-[#667085] font-medium mt-0.5 block">
            Expected: 05:30 PM
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
          <span className="text-xs text-[#667085] font-medium block">Working Hours</span>
          <span className="text-lg font-extrabold font-mono text-[#3D78C5] mt-1 block">
            {isCheckedIn ? workingDuration : '0h 0m'}
          </span>
          <span className="text-[11px] text-[#667085] font-medium mt-0.5 block">
            Minimum 8.0h requirement
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
          <span className="text-xs text-[#667085] font-medium block">Break Duration</span>
          <span className="text-lg font-extrabold font-mono text-amber-600 mt-1 block">
            45m
          </span>
          <span className="text-[11px] text-[#667085] font-medium mt-0.5 block">
            Allowance: 60m total
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E4EAF1] shadow-soft-xs col-span-2 sm:col-span-1">
          <span className="text-xs text-[#667085] font-medium block">Attendance Status</span>
          <span className="text-lg font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" />
            <span>{isCheckedIn ? 'Present' : 'Pending'}</span>
          </span>
          <span className="text-[11px] text-[#667085] font-medium mt-0.5 block">
            Biometric match 100%
          </span>
        </div>
      </div>

      {/* Monthly Attendance Calendar */}
      <div>
        <AttendanceCalendar />
      </div>

      {/* Missed Attendance Regularization Requests Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4EAF1]/70">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#3D78C5]" />
              <h3 className="font-bold text-[#172033] text-base sm:text-lg">
                My Attendance Regularization Requests
              </h3>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Attendance correction claims. <strong>Attendance is marked as Present only upon HR Admin approval.</strong>
            </p>
          </div>

          <button
            onClick={() => setIsRegModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#123B66] hover:bg-[#1b4b7d] transition-colors flex items-center gap-1.5 shadow-soft-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#F5C542]" />
            <span>Apply Regularization</span>
          </button>
        </div>

        <div className="space-y-3">
          {regularizationRequests.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-[#172033] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#3D78C5]" />
                    Missed Date: {item.date}
                  </span>
                  <span className="text-xs text-[#667085] font-mono">({item.punchType})</span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-[#EAF2FB] text-[#3D78C5]">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-[#667085] line-clamp-1">{item.reason}</p>
                <div className="flex items-center gap-3 text-[11px] text-[#667085] pt-1">
                  <span>Requested: <strong className="font-mono text-[#172033]">{item.requestedCheckIn} - {item.requestedCheckOut}</strong></span>
                  <span>•</span>
                  <span>Applied: {item.appliedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    item.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {item.status === 'Approved' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : item.status === 'Pending' ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{item.status === 'Pending' ? 'Pending Admin Approval' : item.status}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regularization Modal */}
      <RegularizationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        defaultDate="2026-09-18"
      />
    </div>
  );
};
