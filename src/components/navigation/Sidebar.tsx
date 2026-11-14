import React from 'react';
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  CalendarDays,
  User,
  ShieldAlert,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  FileCheck2,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { PageId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { getAssignedEmployeesForManager } from '../../utils/managerScope';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { user, role, logout } = useAuth();
  const { employees, isCheckedIn, isCheckedOut, pendingRegularizationCount, leaveRequests, regularizationRequests } = useAttendance();
  const pendingLeaveCount = leaveRequests.filter((l) => l.status === 'Pending').length;
  const totalPendingApprovals = pendingRegularizationCount + pendingLeaveCount;

  // Count pending requests only for employees assigned to this manager
  const assignedEmployeeIds = new Set(
    getAssignedEmployeesForManager(employees, user?.name || '').map((e) => e.employeeId.toLowerCase())
  );
  const managerPendingLeaves = leaveRequests.filter(
    (l) => l.status === 'Pending' && l.employeeId && assignedEmployeeIds.has(l.employeeId.toLowerCase())
  ).length;
  const managerPendingRegs = regularizationRequests.filter(
    (r) => r.status === 'Pending' && r.employeeId && assignedEmployeeIds.has(r.employeeId.toLowerCase())
  ).length;
  const managerTotalPending = managerPendingLeaves + managerPendingRegs;

  const employeeNavItems: Array<{ id: PageId; label: string; icon: any; badge?: number | null }> = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance' as PageId, label: 'Attendance', icon: Clock },
    { id: 'attendance-history' as PageId, label: 'Attendance History', icon: CalendarCheck },
    { id: 'leave' as PageId, label: 'Leave Management', icon: CalendarDays },
    { id: 'profile' as PageId, label: 'Employee Profile', icon: User },
  ];

  const managerNavItems = [
    {
      id: 'manager-dashboard' as PageId,
      label: 'Manager Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'admin-approvals' as PageId,
      label: 'Approvals Hub',
      icon: FileCheck2,
      badge: managerTotalPending > 0 ? managerTotalPending : null,
    },
    { id: 'reports' as PageId, label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const managerSelfNavItems = [
    { id: 'attendance' as PageId, label: 'Mark Attendance', icon: Clock },
    { id: 'attendance-history' as PageId, label: 'Attendance History', icon: CalendarCheck },
    { id: 'leave' as PageId, label: 'Leave Management', icon: CalendarDays },
    { id: 'profile' as PageId, label: 'Manager Profile & Team', icon: User },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard' as PageId, label: 'Admin Overview', icon: ShieldAlert },
    {
      id: 'admin-approvals' as PageId,
      label: 'Approvals Hub',
      icon: FileCheck2,
      badge: totalPendingApprovals > 0 ? totalPendingApprovals : null,
    },
    { id: 'employee-management' as PageId, label: 'Employees', icon: Users },
    { id: 'monthly-reports' as PageId, label: 'Monthly Reports', icon: FileSpreadsheet },
    { id: 'reports' as PageId, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-[#E4EAF1] h-screen sticky top-0 z-30 select-none">
      {/* Brand Header: MSIR INDIA Calibration */}
      <div className="p-5 border-b border-[#E4EAF1]/70">
        <div className="flex items-center gap-2.5">
          <img
            src="/msir-logo.png"
            alt="MSIR INDIA Calibration"
            className="h-10 w-auto max-w-[210px] object-contain rounded-xl shadow-soft-xs border border-amber-300/50"
          />
        </div>
      </div>

      {/* Navigation Links Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Employee Section - ONLY visible for Employee role */}
        {role === 'employee' && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                Employee Portal
              </span>
            </div>
            <nav className="space-y-1">
              {employeeNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                      isActive
                        ? 'bg-[#123B66] text-white shadow-soft'
                        : 'text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-[#667085] group-hover:text-[#3D78C5]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-[#EF4444] text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Manager Section - ONLY visible when role === 'manager' */}
        {role === 'manager' && (
          <div className="space-y-6">
            <div>
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                  Manager Portal
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-semibold">
                  Approver
                </span>
              </div>
              <nav className="space-y-1">
                {managerNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#123B66] text-white shadow-soft'
                          : 'text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-white' : 'text-[#667085] group-hover:text-[#3D78C5]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-[#EF4444] text-white animate-pulse">
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <div className="px-3 mb-2 flex items-center justify-between pt-3 border-t border-[#E4EAF1]/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                  My Attendance & Work
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                  Self Service
                </span>
              </div>
              <nav className="space-y-1">
                {managerSelfNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#123B66] text-white shadow-soft'
                          : 'text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-white' : 'text-[#667085] group-hover:text-[#3D78C5]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Administration Section - ONLY visible when role === 'admin' */}
        {role === 'admin' && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                Administration
              </span>
              <span className="text-[10px] bg-[#EAF2FB] text-[#3D78C5] px-1.5 py-0.2 rounded font-semibold">
                HR Admin
              </span>
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                      isActive
                        ? 'bg-[#123B66] text-white shadow-soft'
                        : 'text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-[#667085] group-hover:text-[#3D78C5]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-[#EF4444] text-white">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer Profile Card */}
      <div className="p-4 border-t border-[#E4EAF1] bg-[#F8FAFC]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E4EAF1] shadow-soft-xs">
          <div
            onClick={() => onNavigate(role === 'admin' ? 'settings' : 'profile')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
          >
            <div className="relative flex-shrink-0">
              <img
                src={user?.avatarUrl}
                alt={user?.name}
                className="w-10 h-10 rounded-xl object-cover border border-[#E4EAF1]"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  isCheckedIn && !isCheckedOut
                    ? 'bg-emerald-500'
                    : isCheckedOut
                    ? 'bg-blue-500'
                    : 'bg-amber-400'
                }`}
                title={
                  isCheckedIn && !isCheckedOut
                    ? 'Checked In (Active)'
                    : isCheckedOut
                    ? 'Day Completed'
                    : 'Not Checked In'
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#172033] truncate">{user?.name}</p>
              <p className="text-[11px] text-[#667085] truncate font-medium">ID: {user?.employeeId}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-[#667085] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
