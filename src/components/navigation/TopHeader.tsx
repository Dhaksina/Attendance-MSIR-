import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  MapPin,
  LayoutDashboard,
} from 'lucide-react';
import { PageId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

interface TopHeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenMobileMenu,
}) => {
  const { user, logout } = useAuth();
  const {
    isCheckedIn,
    isCheckedOut,
    checkInTime,
    checkInLocation,
    checkOutLocation,
  } = useAttendance();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'dashboard':
        return 'Employee Dashboard';
      case 'attendance':
        return 'Attendance Management';
      case 'attendance-history':
        return 'Attendance History';
      case 'leave':
        return 'Leave Management';
      case 'profile':
        return 'Employee Profile';
      case 'notifications':
        return 'Notifications';
      case 'manager-dashboard':
        return 'Reporting Manager Dashboard';
      case 'admin-dashboard':
        return 'HR Executive Dashboard';
      case 'admin-approvals':
        return 'Attendance & Leave Approvals';
      case 'employee-management':
        return 'Employee Directory';
      case 'monthly-reports':
        return 'Monthly Attendance & Salary Reports';
      case 'reports':
        return 'Workforce Reports';
      case 'settings':
        return 'System Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E4EAF1] px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left side: Hamburger for mobile + Page title & Live Date */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#123B66] hover:bg-[#EAF2FB] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <img
            src="/msir-logo.png"
            alt="MSIR INDIA Calibration"
            className="h-7 w-auto object-contain rounded-md"
          />
        </div>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight leading-none">
            {getPageTitle(currentPage)}
          </h1>
          <div className="hidden sm:flex items-center gap-2 mt-1 text-xs text-[#667085] font-medium">
            <span>{currentDateFormatted}</span>
            <span>•</span>
            <span className="font-mono text-[#3D78C5] bg-[#EAF2FB] px-1.5 py-0.2 rounded font-semibold text-[11px]">
              {currentTime}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Quick search bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            placeholder="Search records, leave requests, approvals or employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm text-[#172033] placeholder-[#667085] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-all shadow-soft-xs"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#667085] bg-white border border-[#E4EAF1] px-1.5 py-0.5 rounded shadow-soft-xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side: Attendance Status pill, Notifications, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Attendance Status Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E4EAF1]">
          {isCheckedIn && !isCheckedOut ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                <span>Checked In:</span> <span className="text-[#3D78C5] font-mono">{checkInTime}</span>
                {checkInLocation && (
                  <span className="text-[11px] text-[#667085] flex items-center gap-0.5 border-l border-[#E4EAF1] pl-2 font-normal">
                    <MapPin className="w-3 h-3 text-[#3D78C5]" />
                    <span>{checkInLocation.city || 'Chennai'}</span>
                  </span>
                )}
              </span>
            </>
          ) : isCheckedOut ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3D78C5]" />
              <span className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                <span>Shift Completed</span>
                {checkOutLocation && (
                  <span className="text-[11px] text-[#667085] flex items-center gap-0.5 border-l border-[#E4EAF1] pl-2 font-normal">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    <span>Out: {checkOutLocation.city || 'Chromepet'}</span>
                  </span>
                )}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-[#667085]">Not Checked In</span>
            </>
          )}
        </div>

        {/* User Profile avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
            }}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E4EAF1] transition-all"
          >
            <img
              src={user?.avatarUrl}
              alt={user?.name}
              className="w-8 h-8 rounded-xl object-cover border border-[#E4EAF1]"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-[#172033] leading-none">{user?.name}</p>
              <p className="text-[10px] text-[#667085] font-medium leading-tight mt-0.5">
                {user?.designation}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-soft-xl border border-[#E4EAF1] p-2 z-50 animate-fade-in">
              <div className="p-3 border-b border-[#E4EAF1] bg-[#F8FAFC] rounded-xl mb-1">
                <p className="text-xs font-bold text-[#172033]">{user?.name}</p>
                <p className="text-[11px] text-[#667085] font-mono mt-0.5">EMP ID: {user?.employeeId}</p>
                <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF2FB] text-[#3D78C5]">
                  {user?.department}
                </span>
              </div>

              <div className="space-y-0.5">
                {user?.role === 'admin' ? (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('admin-dashboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#667085]" />
                    <span>Admin Overview</span>
                  </button>
                ) : user?.role === 'manager' ? (
                  <>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#667085]" />
                      <span>Manager Profile & Team</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('manager-dashboard');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#667085]" />
                      <span>Manager Dashboard</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#667085]" />
                    <span>My Profile</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#667085]" />
                  <span>Settings & Preferences</span>
                </button>
                <div className="border-t border-[#E4EAF1] my-1" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
