import React, { useState } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Briefcase,
  Plus,
  CheckCircle2,
  Calendar,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export const WorkingTimeline: React.FC = () => {
  const { timelineItems, addTimelineNote, isCheckedIn } = useAttendance();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');

  const getIcon = (type: string) => {
    switch (type) {
      case 'check-in':
        return <LogIn className="w-4 h-4 text-emerald-600" />;
      case 'break-start':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'break-end':
        return <Briefcase className="w-4 h-4 text-[#3D78C5]" />;
      case 'check-out':
        return <LogOut className="w-4 h-4 text-[#123B66]" />;
      default:
        return <Clock className="w-4 h-4 text-[#3D78C5]" />;
    }
  };

  const getIconBackground = (type: string, completed: boolean) => {
    if (!completed) return 'bg-[#F1F5F9] text-[#667085] border-dashed border-2 border-[#CBD5E1]';
    switch (type) {
      case 'check-in':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'break-start':
        return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'break-end':
        return 'bg-blue-50 text-[#3D78C5] border border-blue-200';
      case 'check-out':
        return 'bg-slate-100 text-[#123B66] border border-slate-300';
      default:
        return 'bg-[#EAF2FB] text-[#3D78C5] border border-[#CBE0F7]';
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) return;
    addTimelineNote(activityTitle, activityDesc || 'Custom logged event');
    setActivityTitle('');
    setActivityDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-5 border-b border-[#E4EAF1]/70">
        <div>
          <h3 className="font-bold text-[#172033] text-base sm:text-lg">Today's Working Status</h3>
          <p className="text-xs text-[#667085] mt-0.5">Punch timeline & verified schedule</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs font-semibold text-[#3D78C5] bg-[#EAF2FB] hover:bg-brand-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
          title="Add activity timestamp"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Activity</span>
        </button>
      </div>

      {/* Timeline items list */}
      <div className="relative mt-6 pl-3 flex-1">
        {/* Continuous vertical connecting line */}
        <div className="absolute left-[27px] top-4 bottom-6 w-0.5 bg-[#E4EAF1]" />

        <div className="space-y-6">
          {timelineItems.map((item, index) => {
            const isLast = index === timelineItems.length - 1;
            return (
              <div key={item.id} className="relative flex items-start gap-4 group">
                {/* Node icon */}
                <div
                  className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-soft-xs ${getIconBackground(
                    item.type,
                    item.completed
                  )}`}
                >
                  {getIcon(item.type)}
                </div>

                {/* Details */}
                <div className="flex-1 bg-[#F8FAFC] group-hover:bg-[#F1F5F9]/80 transition-colors p-3.5 rounded-2xl border border-[#E4EAF1]/70">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-bold font-mono text-[#3D78C5] bg-white px-2 py-0.5 rounded-lg border border-[#E4EAF1]">
                      {item.time}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.completed
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.completed ? 'Completed' : 'Expected'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#172033] mt-1.5">{item.title}</h4>
                  <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">{item.description}</p>

                  {item.location && (
                    <div className="mt-2.5 pt-2 border-t border-[#E4EAF1] flex items-center justify-between gap-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-[#123B66] font-medium truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#3D78C5] flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </span>
                      {item.mapsUrl && (
                        <a
                          href={item.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#3D78C5] hover:text-[#123B66] flex items-center gap-1 flex-shrink-0 bg-white px-2 py-0.5 rounded-md border border-[#E4EAF1] hover:border-[#3D78C5] transition-colors"
                        >
                          <span>Map</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick summary note at bottom */}
      <div className="mt-6 pt-4 border-t border-[#E4EAF1] flex items-center justify-between text-xs text-[#667085]">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#3D78C5]" />
          <span>Shift: 09:00 AM - 05:30 PM (8h 30m total • Cutoff: 09:10 AM)</span>
        </div>
        <span className="font-semibold text-emerald-600">On Track</span>
      </div>

      {/* Add activity modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-[#E4EAF1] shadow-soft-xl animate-fade-in">
            <h4 className="font-bold text-base text-[#172033]">Add Timeline Activity</h4>
            <p className="text-xs text-[#667085] mt-1">Log a break or client meeting timestamp.</p>

            <form onSubmit={handleAddActivity} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-[#172033] block mb-1">Activity Title</label>
                <input
                  type="text"
                  placeholder="e.g. Client Design Sync / Coffee Break"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-xl focus:outline-none focus:border-[#3D78C5]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#172033] block mb-1">Details / Note</label>
                <textarea
                  placeholder="Short description or location..."
                  rows={2}
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-xl focus:outline-none focus:border-[#3D78C5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#667085] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#123B66] hover:bg-[#194d82]"
                >
                  Save Timestamp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
