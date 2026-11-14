import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  CalendarDays,
  CheckSquare,
  ShieldAlert,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationCount,
  } = useAttendance();

  const [filterType, setFilterType] = useState<string>('all');

  const filteredNotifications = notifications.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !item.read;
    return item.type === filterType;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'attendance':
        return <Clock className="w-5 h-5 text-[#3D78C5]" />;
      case 'leave':
        return <CalendarDays className="w-5 h-5 text-[#F5C542]" />;
      case 'task':
        return <CheckSquare className="w-5 h-5 text-emerald-600" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-amber-500" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-[#123B66]" />;
    }
  };

  const getIconBackground = (type: NotificationItem['type']) => {
    switch (type) {
      case 'attendance':
        return 'bg-[#EAF2FB]';
      case 'leave':
        return 'bg-amber-50';
      case 'task':
        return 'bg-emerald-50';
      case 'reminder':
        return 'bg-amber-50';
      default:
        return 'bg-[#F1F5F9]';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
              Alerts & Communications
            </span>
            {unreadNotificationCount > 0 && (
              <span className="text-xs font-bold bg-[#EF4444] text-white px-2 py-0.2 rounded-full">
                {unreadNotificationCount} unread
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Notification Center
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            System announcements, leave approvals, and shift reminders.
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Check className="w-4 h-4 text-[#3D78C5]" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: 'Unread' },
          { id: 'attendance', label: 'Attendance' },
          { id: 'leave', label: 'Leave' },
          { id: 'system', label: 'System' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === tab.id
                ? 'bg-[#123B66] text-white shadow-soft-xs'
                : 'bg-white text-[#667085] border border-[#E4EAF1] hover:bg-[#F8FAFC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3.5">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E4EAF1]">
            <Bell className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
            <h4 className="font-bold text-[#172033] text-sm">No notifications found</h4>
            <p className="text-xs text-[#667085] mt-1">You're all caught up with your updates.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 ${
                notif.read
                  ? 'bg-white border-[#E4EAF1] hover:bg-[#F8FAFC]'
                  : 'bg-[#F4F8FD] border-[#CBE0F7] shadow-soft-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-soft-xs ${getIconBackground(
                    notif.type
                  )}`}
                >
                  {getIcon(notif.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#172033]">{notif.title}</h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#3D78C5]" />
                    )}
                    {notif.priority === 'important' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Important
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#667085] mt-1 leading-relaxed">{notif.message}</p>
                  <span className="text-[11px] text-[#94A3B8] font-medium mt-2 inline-block">
                    {notif.time}
                  </span>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(notif.id);
                  }}
                  className="text-xs font-semibold text-[#3D78C5] hover:underline whitespace-nowrap self-start mt-1"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
