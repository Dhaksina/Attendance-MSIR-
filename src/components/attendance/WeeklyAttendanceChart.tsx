import React, { useState } from 'react';
import { weeklyAttendanceMock } from '../../data/mockData';
import { BarChart3, Info } from 'lucide-react';

export const WeeklyAttendanceChart: React.FC = () => {
  const [hoveredDay, setHoveredDay] = useState<typeof weeklyAttendanceMock[0] | null>(null);

  const maxHours = 10; // max scale in hours

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-[#3D78C5] hover:bg-[#285da6]';
      case 'Late':
      case 'Half Day':
      case 'Half Day Leave':
        return 'bg-[#F97316] hover:bg-[#ea580c]';
      case 'Absent':
        return 'bg-red-500 hover:bg-red-600';
      case 'Leave':
        return 'bg-[#F5C542] hover:bg-[#d8a82b]';
      case 'Weekend':
        return 'bg-[#EAF2FB] hover:bg-blue-100';
      default:
        return 'bg-[#E2E8F0]';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-[#EAF2FB] text-[#3D78C5]';
      case 'Late':
      case 'Half Day':
      case 'Half Day Leave':
        return 'bg-orange-50 text-orange-700';
      case 'Absent':
        return 'bg-red-50 text-red-600';
      case 'Leave':
        return 'bg-yellow-50 text-yellow-800';
      case 'Weekend':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E4EAF1]/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#172033] text-base sm:text-lg">Weekly Attendance</h3>
              <span className="text-[11px] font-bold bg-[#EAF2FB] text-[#3D78C5] px-2 py-0.5 rounded-full">
                This Week (05 - 11 Oct)
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">Average logged time: 8.4 hrs/day</p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#3D78C5]" />
              <span className="text-[#667085]">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              <span className="text-[#667085]">Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F5C542]" />
              <span className="text-[#667085]">Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
              <span className="text-[#667085]">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EAF2FB] border border-[#CBD5E1]" />
              <span className="text-[#667085]">Weekend</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip Bar Indicator */}
        <div className="h-6 mt-3">
          {hoveredDay ? (
            <p className="text-xs text-[#123B66] font-medium flex items-center gap-1.5 animate-fade-in">
              <Info className="w-3.5 h-3.5 text-[#3D78C5]" />
              <span className="font-bold">{hoveredDay.day} ({hoveredDay.date}):</span>
              <span>{hoveredDay.hours > 0 ? `${hoveredDay.hours} hours logged` : hoveredDay.status}</span>
              {hoveredDay.checkIn !== '-' && (
                <span className="text-[#667085] font-mono">({hoveredDay.checkIn} - {hoveredDay.checkOut})</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-[#667085]">Hover over any day bar to view punch timestamps</p>
          )}
        </div>

        {/* Visual Bar Chart */}
        <div className="mt-4 pt-4 border-t border-[#E4EAF1]/40">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 sm:h-52">
            {weeklyAttendanceMock.map((item) => {
              const heightPercentage = item.hours > 0 ? Math.min(100, (item.hours / maxHours) * 100) : item.status === 'Weekend' ? 12 : 6;
              return (
                <div
                  key={item.day}
                  onMouseEnter={() => setHoveredDay(item)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Floating Hours Label */}
                  <span className="text-[11px] font-bold text-[#172033] mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.hours > 0 ? `${item.hours}h` : '-'}
                  </span>

                  {/* Chart Bar */}
                  <div className="w-full max-w-[42px] bg-[#F1F5F9] rounded-2xl p-1 flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercentage}%` }}
                      className={`w-full rounded-xl transition-all duration-300 shadow-soft-xs ${getStatusColor(
                        item.status
                      )}`}
                    />
                  </div>

                  {/* Day Label */}
                  <span className="text-xs font-bold text-[#172033] mt-2 group-hover:text-[#3D78C5] transition-colors">
                    {item.day}
                  </span>
                  <span className="text-[10px] text-[#667085] font-medium">{item.date.split(' ')[0]}</span>
                  <span
                    className={`mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status === 'Weekend' ? 'Off' : item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target benchmark banner */}
      <div className="mt-5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-[#172033]">Weekly Hours Target (40h)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 sm:w-36 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
            <div className="bg-[#3D78C5] h-full rounded-full" style={{ width: '83%' }} />
          </div>
          <span className="text-xs font-bold font-mono text-[#123B66]">33.5h / 40h (83%)</span>
        </div>
      </div>
    </div>
  );
};
