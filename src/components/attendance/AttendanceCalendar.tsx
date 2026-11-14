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
import { useAuth } from '../../context/AuthContext';
import { COMPANY_HOLIDAYS_2026 } from '../../utils/monthlyAttendanceReport';
import { RegularizationModal } from './RegularizationModal';

export const AttendanceCalendar: React.FC = () => {
  const { attendanceHistory, leaveRequests, isCheckedIn, isCheckedOut, checkInTime, checkOutTime } = useAttendance();
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<DailyAttendanceRecord | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  // Dynamic Current Month & Year (Defaults to current active month: November 2026)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth()); // 0-indexed: 10 = November
  const [regTargetDate, setRegTargetDate] = useState<string>(() => today.toISOString().split('T')[0]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Dynamic calculation of days in the selected month & starting weekday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Map known statuses from live database records, leave applications, holidays & shift schedule
  const getDayStatus = (day: number): { status: AttendanceStatus; record?: DailyAttendanceRecord } => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(currentYear, currentMonth, day);
    const dayOfWeek = dateObj.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // 1. Check verified live attendance history records
    const found = attendanceHistory.find((item) => item.date === formattedDate);
    if (found) {
      return { status: found.status, record: found };
    }

    // 2. Check approved or pending leave requests
    const matchingLeave = leaveRequests.find(
      (l) =>
        (!user || !l.employeeId || l.employeeId === user.employeeId) &&
        l.status !== 'Rejected' &&
        l.fromDate <= formattedDate &&
        formattedDate <= l.toDate
    );
    if (matchingLeave) {
      const isPermission = matchingLeave.category === 'Permission' || matchingLeave.leaveType.toLowerCase().includes('permission');
      return {
        status: isPermission ? 'Half Day' : 'Leave',
        record: {
          id: matchingLeave.id,
          date: formattedDate,
          dayName: dayNames[dayOfWeek],
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          workingMinutes: 0,
          breakDuration: '-',
          status: isPermission ? 'Half Day' : 'Leave',
          note: `${matchingLeave.status} ${matchingLeave.leaveType}: ${matchingLeave.reason}`,
        },
      };
    }

    // 3. Official Company Holidays for 2026
    const holiday = COMPANY_HOLIDAYS_2026.find((h) => h.date === formattedDate);
    if (holiday) {
      return {
        status: 'Holiday',
        record: {
          id: `ATT-HOL-${formattedDate}`,
          date: formattedDate,
          dayName: dayNames[dayOfWeek],
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          workingMinutes: 0,
          breakDuration: '-',
          status: 'Holiday',
          note: `Official Holiday: ${holiday.name}`,
        },
      };
    }

    // 4. Today (Active working session)
    const isToday =
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();

    if (isToday) {
      if (isCheckedIn) {
        // Evaluate if check-in time was after 09:10 AM grace cutoff
        let isLateCheckIn = false;
        if (checkInTime) {
          const match = checkInTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (match) {
            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const meridiem = (match[3] || '').toUpperCase();
            if (meridiem === 'PM' && h < 12) h += 12;
            if (meridiem === 'AM' && h === 12) h = 0;
            if (h * 60 + m > 9 * 60 + 10) {
              isLateCheckIn = true;
            }
          }
        }
        const activeStatus: AttendanceStatus = isLateCheckIn ? 'Half Day Leave' : 'Present';
        return {
          status: activeStatus,
          record: {
            id: `ATT-TODAY-${formattedDate}`,
            date: formattedDate,
            dayName: dayNames[dayOfWeek],
            checkIn: checkInTime || 'Active Session',
            checkOut: isCheckedOut ? checkOutTime : null,
            workingHours: isCheckedOut ? 'Completed' : 'In Progress',
            workingMinutes: 0,
            breakDuration: '-',
            status: activeStatus,
            note: isLateCheckIn
              ? `Today - Checked in at ${checkInTime} (after 09:10 AM cutoff) • Marked as Half Day Leave`
              : 'Today - Active working session (Shift 09:00 AM - 05:30 PM)',
          },
        };
      }
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return {
          status: 'Weekend',
          record: {
            id: `ATT-WKD-${formattedDate}`,
            date: formattedDate,
            dayName: dayNames[dayOfWeek],
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
      return {
        status: 'Absent',
        record: {
          id: `ATT-TODAY-${formattedDate}`,
          date: formattedDate,
          dayName: dayNames[dayOfWeek],
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          workingMinutes: 0,
          breakDuration: '-',
          status: 'Absent',
          note: 'Shift scheduled today - not checked in yet. Punch check-in to record attendance.',
        },
      };
    }

    // 5. Past days (Before today)
    const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) {
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return {
          status: 'Weekend',
          record: {
            id: `ATT-WKD-${formattedDate}`,
            date: formattedDate,
            dayName: dayNames[dayOfWeek],
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
      return {
        status: 'Absent',
        record: {
          id: `ATT-ABS-${formattedDate}`,
          date: formattedDate,
          dayName: dayNames[dayOfWeek],
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          workingMinutes: 0,
          breakDuration: '-',
          status: 'Absent',
          note: 'Unrecorded punch / Missed attendance. Click to apply regularization.',
        },
      };
    }

    // 6. Future upcoming days (After today)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        status: 'Weekend',
        record: {
          id: `ATT-WKD-${formattedDate}`,
          date: formattedDate,
          dayName: dayNames[dayOfWeek],
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

    return {
      status: 'Holiday',
      record: {
        id: `ATT-FUT-${formattedDate}`,
        date: formattedDate,
        dayName: dayNames[dayOfWeek],
        checkIn: null,
        checkOut: null,
        workingHours: '-',
        workingMinutes: 0,
        breakDuration: '-',
        status: 'Holiday',
        note: 'Upcoming scheduled working day',
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
        return 'bg-[#E2E8F0] text-[#334155] hover:bg-[#CBD5E1] border border-slate-300/70';
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
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-[#3D78C5]" />
              <h3 className="font-extrabold text-[#172033] text-base sm:text-lg">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-white text-[#667085] hover:text-[#172033] transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-white text-[#667085] hover:text-[#172033] transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-[#667085] mt-1">
              Click on any date to inspect verified punch times or apply regularization
            </p>
          </div>

          <button
            onClick={() => {
              setRegTargetDate(selectedRecord ? selectedRecord.date : today.toISOString().split('T')[0]);
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
              setRegTargetDate(selectedRecord ? selectedRecord.date : today.toISOString().split('T')[0]);
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
          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

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
                  {record?.note?.includes('Upcoming') ? 'Upcoming' : status}
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
                    Status: {selectedRecord.note?.includes('Upcoming') ? 'Upcoming' : selectedRecord.status}
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
