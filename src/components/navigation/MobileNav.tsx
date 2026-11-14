import React, { useState } from 'react';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  User,
  Power,
  ShieldAlert,
  Users,
  BarChart3,
  Settings,
  X,
  CalendarCheck,
} from 'lucide-react';
import { PageId } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPage, onNavigate }) => {
  const { isCheckedIn, isCheckedOut, checkIn, checkOut } = useAttendance();
  const { role } = useAuth();
  const [showMoreDrawer, setShowMoreDrawer] = useState<boolean>(false);

  const handleCenterAction = () => {
    if (!isCheckedIn) {
      checkIn();
    } else if (!isCheckedOut) {
      checkOut();
    } else {
      // already completed day
      onNavigate('attendance');
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4EAF1] px-2 py-1.5 shadow-[0_-4px_20px_rgba(18,59,102,0.06)]">
        <div className="flex items-center justify-around relative">
          {/* Home */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              currentPage === 'dashboard' ? 'text-[#3D78C5]' : 'text-[#667085] hover:text-[#123B66]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Home</span>
          </button>

          {/* Attendance */}
          <button
            onClick={() => onNavigate('attendance')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              currentPage === 'attendance' ? 'text-[#3D78C5]' : 'text-[#667085] hover:text-[#123B66]'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Attend</span>
          </button>

          {/* Center Prominent Check In / Check Out Floating Action */}
          <div className="-mt-6 flex flex-col items-center">
            <button
              onClick={handleCenterAction}
              className={`w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-soft-lg transform active:scale-95 transition-all duration-200 border-3 border-white ${
                !isCheckedIn
                  ? 'bg-gradient-to-tr from-[#123B66] to-[#3D78C5] ring-4 ring-brand-100'
                  : !isCheckedOut
                  ? 'bg-gradient-to-tr from-amber-600 to-amber-500 ring-4 ring-amber-100'
                  : 'bg-gradient-to-tr from-emerald-600 to-emerald-500 ring-4 ring-emerald-100'
              }`}
              title={
                !isCheckedIn ? 'Tap to Check In' : !isCheckedOut ? 'Tap to Check Out' : 'Day Completed'
              }
            >
              <Power className="w-6 h-6 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-bold text-[#123B66] mt-0.5">
              {!isCheckedIn ? 'Check In' : !isCheckedOut ? 'Check Out' : 'Done'}
            </span>
          </div>

          {/* Leave */}
          <button
            onClick={() => onNavigate('leave')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              currentPage === 'leave' ? 'text-[#3D78C5]' : 'text-[#667085] hover:text-[#123B66]'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Leave</span>
          </button>

          {/* More Drawer Trigger */}
          <button
            onClick={() => setShowMoreDrawer(true)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              showMoreDrawer ||
              currentPage === 'profile' ||
              currentPage === 'admin-dashboard' ||
              currentPage === 'settings'
                ? 'text-[#3D78C5]'
                : 'text-[#667085] hover:text-[#123B66]'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* More / Additional Features Drawer */}
      {showMoreDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-fade-in lg:hidden">
          <div className="bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto p-5 pb-8 shadow-soft-xl border-t border-[#E4EAF1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF1]">
              <div className="flex items-center gap-2">
                <img
                  src="/msir-logo.png"
                  alt="MSIR INDIA Calibration"
                  className="h-8 w-auto object-contain rounded-md"
                />
              </div>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="p-1 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setShowMoreDrawer(false);
                    onNavigate('profile');
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E4EAF1] bg-white hover:bg-[#EAF2FB] text-left transition-colors"
                >
                  <User className="w-5 h-5 text-[#3D78C5]" />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">My Profile</p>
                    <p className="text-[10px] text-[#667085]">Personal details</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMoreDrawer(false);
                    onNavigate('attendance-history');
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E4EAF1] bg-white hover:bg-[#EAF2FB] text-left transition-colors"
                >
                  <CalendarCheck className="w-5 h-5 text-[#3D78C5]" />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">History</p>
                    <p className="text-[10px] text-[#667085]">Past records</p>
                  </div>
                </button>


                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => {
                        setShowMoreDrawer(false);
                        onNavigate('admin-approvals');
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-left transition-colors"
                    >
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-[#172033]">Approvals Hub</p>
                        <p className="text-[10px] text-amber-700">Missed attendance</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMoreDrawer(false);
                        onNavigate('admin-dashboard');
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#E4EAF1] bg-white hover:bg-[#EAF2FB] text-left transition-colors"
                    >
                      <ShieldAlert className="w-5 h-5 text-[#3D78C5]" />
                      <div>
                        <p className="text-xs font-bold text-[#172033]">HR Admin</p>
                        <p className="text-[10px] text-[#667085]">Management</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMoreDrawer(false);
                        onNavigate('employee-management');
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#E4EAF1] bg-white hover:bg-[#EAF2FB] text-left transition-colors"
                    >
                      <Users className="w-5 h-5 text-[#3D78C5]" />
                      <div>
                        <p className="text-xs font-bold text-[#172033]">Employees</p>
                        <p className="text-[10px] text-[#667085]">Directory</p>
                      </div>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setShowMoreDrawer(false);
                    onNavigate('reports');
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E4EAF1] bg-white hover:bg-[#EAF2FB] text-left transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-[#3D78C5]" />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">Reports</p>
                    <p className="text-[10px] text-[#667085]">Exports & trends</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMoreDrawer(false);
                    onNavigate('settings');
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E4EAF1] bg-white hover:bg-[#EAF2FB] text-left transition-colors col-span-2"
                >
                  <Settings className="w-5 h-5 text-[#3D78C5]" />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">Settings</p>
                    <p className="text-[10px] text-[#667085]">Policy, preferences and security</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
