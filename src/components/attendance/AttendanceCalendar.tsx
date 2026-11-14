import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Coffee,
  X,
  Plus,
  FileCheck,
} from 'lucide-react';
import { AttendanceStatus, DailyAttendanceRecord } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { RegularizationModal } from './RegularizationModal';

export const AttendanceCalendar: React.FC = () => {
  const { attendanceHistory } = useAttendance();
  const [selectedRecord, setSelectedRecord] = useState<DailyAttendanceRecord | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regTargetDate, setRegTargetDate] = useState<string>('2026-10-05');

  // Month state - October 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to determine day statuses for the month of October 2026
  const daysInMonth = 31;
  const firstDayOfWeek = 4; // Oct 1, 2026 was a Thursday (0 = Sun, 1 = Mon, ..., 4 = Thu)

  // Map known statuses from history or generate deterministic ones for October
  const getDayStatus = (day: number): { status: AttendanceStatus; record?: DailyAttendanceRecord } => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const found = attendanceHistory.find((item) => item.date === formattedDate);
    if (found) {
      return { status: found.status, record: found };
    }

    // Default calculations for other days of the month
    const dateObj = new Date(currentYear, currentMonth, day);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        status: 'Weekend',
        record: {
          id: `ATT-MOCK-${day}`,
          date: formattedDate,
          dayName: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          workingMinutes: 0,
          breakDuration: '-',
          status: 'Weekend',
          note: 'Scheduled weekly rest day',
        },
      };
    }

    if (day === 2) {
      return {
        status: 'Holiday',
        record: {
          id: `ATT-HOL-${day}`,
          date: formattedDate,
          dayName: 'Friday',
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          workingMinutes: 0,
          breakDuration: '-',
          status: 'Holiday',
          note: 'National Holiday (Gandhi Jayanti)',
        },
      };
    }

    if (day === 18) {
      return {
        status: 'Absent',
        record: {
          id: `ATT-ABS-${day}`,
          date: formattedDate,
          dayName: 'Sunday',
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          workingMinutes: 0,
          breakDuration: '-',
          status: 'Absent',
          note: 'Unplanned absence / Sick leave notice',
        },
      };
    }

    if (day === 15 || day === 16) {
      return {
        status: 'Leave',
        record: {
          id: `ATT-LEAVE-${day}`,
          date: formattedDate,
          dayName: day === 15 ? 'Thursday' : 'Friday',
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          workingMinutes: 0,
          breakDuration: '-',
          status: 'Leave',
          note: 'Approved Casual Leave',
        },
      };
    }

    if (day === 21) {
      return {
        status: 'Half Day Leave',
        record: {
          id: `ATT-HALF-${day}`,
          date: formattedDate,
          dayName: 'Wednesday',
          checkIn: '09:15 AM',
          checkOut: '01:45 PM',
          workingHours: '4h 30m',
          workingMinutes: 270,
          breakDuration: '15m',
          status: 'Half Day Leave',
          note: 'Approved Half Day Leave (Personal)',
          location: 'Office HQ',
        },
      };
    }

    // Past days default to present
    if (day <= 8) {
      return {
        status: 'Present',
        record: {
          id: `ATT-NORM-${day}`,
          date: formattedDate,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          checkIn: '09:12 AM',
          checkOut: '06:18 PM',
          workingHours: '8h 26m',
          workingMinutes: 506,
          breakDuration: '45m',
          status: 'Present',
          location: 'HQ Campus - Tower B',
        },
      };
    }

    // Other days in October
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return {
      status: isWeekend ? 'Weekend' : 'Present',
      record: {
        id: `ATT-OCT-${day}`,
        date: formattedDate,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        checkIn: isWeekend ? null : '09:15 AM',
        checkOut: isWeekend ? null : '06:00 PM',
        workingHours: isWeekend ? '-' : '8h 45m',
        workingMinutes: isWeekend ? 0 : 525,
        breakDuration: isWeekend ? '-' : '45m',
        status: isWeekend ? 'Weekend' : 'Present',
        location: isWeekend ? undefined : 'Office HQ',
        note: isWeekend ? 'Scheduled weekly rest day' : 'Scheduled working day',
      },
    };
  };

  // Color mapping:
  // Present = Blue (#3D78C5)
  // Late & Half Day Leave = Orange (#F97316)
  // Leave = Yellow (#F5C542)
  // Absent = Red (#EF4444)
  // Holiday = Light Gray (#CBD5E1)
  // Weekend = Light Blue (#EAF2FB)
  const getStatusColorClasses = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'bg-[#3D78C5] text-white hover:bg-[#285da6] shadow-soft-xs';
      case 'Late':
      case 'Half Day':
      case 'Half Day Leave':
        return 'bg-[#F97316] text-white hover:bg-[#ea580c] shadow-soft-xs font-bold';
      case 'Leave':
        return 'bg-[#F5C542] text-[#172033] hover:bg-[#e0b236] shadow-soft-xs font-bold';
      case 'Absent':
        return 'bg-[#EF4444] text-white hover:bg-red-600 shadow-soft-xs';
      case 'Holiday':
        return 'bg-[#CBD5E1] text-[#1e293b] hover:bg-slate-300';
      case 'Weekend':
        return 'bg-[#EAF2FB] text-[#3D78C5] hover:bg-blue-100 border border-[#CBE0F7]';
      default:
        return 'bg-slate-50 text-[#667085] hover:bg-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs">
      {/* Calendar Header with Navigation & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E4EAF1]/70">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#3D78C5]" />
              <h3 className="font-bold text-[#172033] text-base sm:text-lg">
                {monthNames[currentMonth]} {currentYear}
              </h3>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Click on any date to inspect verified punch times or apply regularization
            </p>
          </div>

          <button
            onClick={() => {
              setRegTargetDate(selectedRecord ? selectedRecord.date : '2026-10-05');
              setIsRegModalOpen(true);
            }}
            className="sm:hidden px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#123B66] hover:bg-[#1b4b7d] transition-all flex items-center gap-1 shadow-soft-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#F5C542]" />
            <span>Regularize</span>
          </button>
        </div>

        {/* Legend & Action */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#3D78C5]" />
              <span className="text-[#172033] font-medium">Present (Blue)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F97316]" />
              <span className="text-[#172033] font-medium">Late / Half Day (Orange)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F5C542]" />
              <span className="text-[#172033] font-medium">Leave (Yellow)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
              <span className="text-[#172033] font-medium">Absent (Red)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#CBD5E1]" />
              <span className="text-[#172033] font-medium">Holiday (Gray)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EAF2FB] border border-[#3D78C5]" />
              <span className="text-[#172033] font-medium">Weekend (Light Blue)</span>
            </div>
          </div>

          <button
            onClick={() => {
              setRegTargetDate(selectedRecord ? selectedRecord.date : '2026-10-05');
              setIsRegModalOpen(true);
            }}
            className="hidden sm:flex px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#123B66] hover:bg-[#1b4b7d] transition-all items-center gap-1.5 shadow-soft-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#F5C542]" />
            <span>Apply Regularization</span>
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2.5 text-center mt-5 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-xs font-bold uppercase tracking-wider text-[#667085] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {/* Leading blank slots */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-14 sm:h-20 rounded-2xl bg-[#F8FAFC]/50 border border-transparent" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const { status, record } = getDayStatus(day);
          const isToday = day === 8;

          return (
            <button
              key={day}
              onClick={() => {
                if (record) setSelectedRecord(record);
              }}
              className={`h-14 sm:h-20 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between text-left transition-all duration-150 relative group ${
                record ? 'cursor-pointer' : 'cursor-default'
              } ${getStatusColorClasses(status)} ${
                isToday ? 'ring-3 ring-[#123B66] ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-bold">{day}</span>
                {isToday && (
                  <span className="hidden sm:inline-block text-[9px] font-extrabold uppercase px-1 rounded bg-[#123B66] text-white">
                    Today
                  </span>
                )}
              </div>

              <div className="hidden sm:block">
                <span className="text-[10px] truncate block opacity-90 leading-tight">
                  {status}
                </span>
                {record?.workingHours && record.workingHours !== '-' && (
                  <span className="text-[9px] font-mono opacity-80 block">{record.workingHours}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Inspection Modal/Card when date clicked */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E4EAF1] shadow-soft-xl relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-[#E4EAF1]">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF2FB] text-[#3D78C5] flex items-center justify-center font-bold text-lg">
                {selectedRecord.date.split('-')[2]}
              </div>
              <div>
                <h4 className="font-bold text-lg text-[#172033]">
                  {selectedRecord.dayName}, {selectedRecord.date}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      selectedRecord.status === 'Late' ||
                      selectedRecord.status === 'Half Day' ||
                      selectedRecord.status === 'Half Day Leave'
                        ? 'bg-orange-100 text-orange-700 border border-orange-200 font-bold'
                        : selectedRecord.status === 'Leave'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 font-bold'
                        : selectedRecord.status === 'Absent'
                        ? 'bg-red-100 text-red-700 border border-red-200 font-bold'
                        : selectedRecord.status === 'Holiday'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-[#EAF2FB] text-[#3D78C5] border border-blue-200 font-semibold'
                    }`}
                  >
                    Status: {selectedRecord.status}
                  </span>
                  {selectedRecord.location && (
                    <span className="text-xs text-[#667085] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      In: {selectedRecord.location}
                    </span>
                  )}
                  {selectedRecord.checkOutLocation && (
                    <span className="text-xs text-[#667085] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600" />
                      Out: {selectedRecord.checkOutLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                <span className="text-[11px] font-medium text-[#667085] block">Check In Time</span>
                <span className="text-base font-bold font-mono text-[#172033] mt-0.5 block">
                  {selectedRecord.checkIn || '--:--'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                <span className="text-[11px] font-medium text-[#667085] block">Check Out Time</span>
                <span className="text-base font-bold font-mono text-[#172033] mt-0.5 block">
                  {selectedRecord.checkOut || '--:--'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                <span className="text-[11px] font-medium text-[#667085] block">Working Hours</span>
                <span className="text-base font-bold font-mono text-[#3D78C5] mt-0.5 block">
                  {selectedRecord.workingHours}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                <span className="text-[11px] font-medium text-[#667085] block">Break Duration</span>
                <span className="text-base font-bold font-mono text-amber-600 mt-0.5 block">
                  {selectedRecord.breakDuration}
                </span>
              </div>
            </div>

            {selectedRecord.note && (
              <div className="p-3 rounded-2xl bg-[#FEF9C3]/50 border border-yellow-200 text-xs text-yellow-900 mb-4">
                <span className="font-bold">Log Notes:</span> {selectedRecord.note}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-[#E4EAF1]">
              <button
                onClick={() => {
                  setRegTargetDate(selectedRecord.date);
                  setIsRegModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#123B66] hover:bg-[#1b4b7d] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-soft-xs"
              >
                <FileCheck className="w-4 h-4 text-[#F5C542]" />
                <span>Apply Regularization for {selectedRecord.date}</span>
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-2 rounded-xl border border-[#E4EAF1] bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] hover:text-[#172033] font-semibold text-xs transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regularization Modal for Calendar Dates */}
      <RegularizationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        defaultDate={regTargetDate}
      />
    </div>
  );
};
