import React from 'react';
import {
  CalendarCheck2,
  CalendarX2,
  ClockAlert,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface AttendanceStatCardsProps {
  presentDays?: number;
  absentDays?: number;
  lateDays?: number;
  workingHours?: string;
}

type TrendType = 'positive' | 'negative' | 'neutral';

interface StatCardItem {
  id: string;
  label: string;
  value: string;
  subLabel: string;
  trend: string;
  trendType: TrendType;
  icon: any;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

export const AttendanceStatCards: React.FC<AttendanceStatCardsProps> = ({
  presentDays = 22,
  absentDays = 2,
  lateDays = 3,
  workingHours = '176h',
}) => {
  const cards: StatCardItem[] = [
    {
      id: 'present',
      label: 'Present Days',
      value: presentDays.toString(),
      subLabel: 'Out of 24 working days',
      trend: '+2 from last month',
      trendType: 'positive' as const,
      icon: CalendarCheck2,
      iconBg: 'bg-[#EAF2FB]',
      iconColor: 'text-[#3D78C5]',
      borderColor: 'border-[#E4EAF1]',
    },
    {
      id: 'absent',
      label: 'Absent Days',
      value: absentDays.toString(),
      subLabel: 'Sick & unplanned leave',
      trend: '-1 vs last month',
      trendType: 'positive' as const, // Less absence is positive
      icon: CalendarX2,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      borderColor: 'border-[#E4EAF1]',
    },
    {
      id: 'late',
      label: 'Late Days',
      value: lateDays.toString(),
      subLabel: 'Within grace period (15m)',
      trend: '0 vs last month',
      trendType: 'neutral' as const,
      icon: ClockAlert,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      borderColor: 'border-[#E4EAF1]',
    },
    {
      id: 'hours',
      label: 'Working Hours',
      value: workingHours,
      subLabel: 'Target 168h • Overtime +8h',
      trend: '+12h total logged',
      trendType: 'positive' as const,
      icon: Briefcase,
      iconBg: 'bg-[#123B66]/10',
      iconColor: 'text-[#123B66]',
      borderColor: 'border-[#E4EAF1]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`bg-white rounded-2xl p-5 border ${card.borderColor} shadow-soft-xs hover:shadow-soft transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  {card.label}
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1">
                  {card.value}
                </h3>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#E4EAF1]/70 flex items-center justify-between text-xs">
              <span className="text-[#667085] truncate font-medium">{card.subLabel}</span>
              <div
                className={`flex items-center gap-1 font-semibold flex-shrink-0 ${
                  card.trendType === 'positive'
                    ? 'text-emerald-600'
                    : card.trendType === 'negative'
                    ? 'text-red-500'
                    : 'text-[#667085]'
                }`}
              >
                {card.trendType === 'positive' ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : card.trendType === 'negative' ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                <span>{card.trend}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
