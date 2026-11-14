import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  FileCheck2,
  CalendarDays,
  ArrowRight,
  Sparkles,
  Timer,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Shield,
  ShieldAlert,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Building2,
  Layers,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { PageId, LeaveRequest, RegularizationRequest, EmployeeDirectoryItem } from '../types';
import {
  isEmployeeAssignedToManager,
  getAssignedEmployeesForManager,
  validateManagerApprovalPermission,
} from '../utils/managerScope';
import { EmployeeLocationModal } from '../components/attendance/EmployeeLocationModal';
import { AttendanceCard } from '../components/attendance/AttendanceCard';

interface ManagerDashboardPageProps {
  onNavigate?: (page: PageId) => void;
  initialTab?: 'overview' | 'approvals' | 'attendance';
}

export const ManagerDashboardPage: React.FC<ManagerDashboardPageProps> = ({ onNavigate, initialTab }) => {
  const { user } = useAuth();
  const {
    employees,
    leaveRequests,
    regularizationRequests,
    approveLeave,
    rejectLeave,
    approveRegularization,
    rejectRegularization,
    getEmployeeLeaveBalances,
  } = useAttendance();

  // Active Manager Name (defaults to current logged-in user name, e.g. "Vikram Anand")
  const currentManagerName = user?.name || 'Vikram Anand';

  // Navigation tab within Manager Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'attendance'>(initialTab || 'overview');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Filter states for requests
  const [requestTypeFilter, setRequestTypeFilter] = useState<'All' | 'Leave' | 'Permission' | 'Regularization'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [inspectingLocationEmp, setInspectingLocationEmp] = useState<EmployeeDirectoryItem | null>(null);
  const [viewingDetailItem, setViewingDetailItem] = useState<{
    type: 'leave' | 'regularization';
    data: any;
  } | null>(null);

  // Approval action confirmation modal state
  const [actionModal, setActionModal] = useState<{
    action: 'approve' | 'reject';
    type: 'leave' | 'regularization';
    item: any;
  } | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');

  // 1. Filter employees strictly assigned to this manager (Requirement 1 & 5)
  const assignedEmployees = useMemo(() => {
    return getAssignedEmployeesForManager(employees, currentManagerName);
  }, [employees, currentManagerName]);

  const assignedEmployeeIds = useMemo(() => {
    return new Set(assignedEmployees.map((e) => e.employeeId.toLowerCase()));
  }, [assignedEmployees]);

  // 2. Filter requests strictly from assigned employees (Requirement 2 & 5)
  const assignedLeaveRequests = useMemo(() => {
    return leaveRequests.filter((l) => {
      if (!l.employeeId) return false;
      return assignedEmployeeIds.has(l.employeeId.toLowerCase());
    });
  }, [leaveRequests, assignedEmployeeIds]);

  const assignedRegularizations = useMemo(() => {
    return regularizationRequests.filter((r) => {
      if (!r.employeeId) return false;
      return assignedEmployeeIds.has(r.employeeId.toLowerCase());
    });
  }, [regularizationRequests, assignedEmployeeIds]);

  // 3. Calculate 7 Summary Card Metrics (Requirement 1)
  const totalAssignedCount = assignedEmployees.length;
  const presentTodayCount = assignedEmployees.filter((e) => e.todayStatus === 'Present').length;
  const absentTodayCount = assignedEmployees.filter((e) => e.todayStatus === 'Absent').length;
  const lateArrivalsCount = assignedEmployees.filter((e) => e.todayStatus === 'Late').length;

  const pendingLeaves = assignedLeaveRequests.filter(
    (l) => l.status === 'Pending' && l.category !== 'Permission' && !l.leaveType.toLowerCase().includes('permission')
  );
  const pendingPermissions = assignedLeaveRequests.filter(
    (l) => l.status === 'Pending' && (l.category === 'Permission' || l.leaveType.toLowerCase().includes('permission'))
  );
  const pendingRegularizations = assignedRegularizations.filter((r) => r.status === 'Pending');

  const pendingLeavesCount = pendingLeaves.length;
  const pendingPermissionsCount = pendingPermissions.length;
  const pendingRegularizationsCount = pendingRegularizations.length;
  const totalPendingActionCount = pendingLeavesCount + pendingPermissionsCount + pendingRegularizationsCount;

  // Unified Request Processing List
  const unifiedRequests = useMemo(() => {
    const list: Array<{
      id: string;
      sourceType: 'leave' | 'regularization';
      employeeId: string;
      employeeName: string;
      department: string;
      avatarUrl?: string;
      requestTypeLabel: string;
      isPermission: boolean;
      isLateArrival: boolean;
      requestDatePeriod: string;
      permissionTime?: string;
      durationDays?: number;
      reason: string;
      submissionDate: string;
      status: 'Pending' | 'Approved' | 'Rejected';
      reviewedBy?: string;
      reviewedAt?: string;
      adminRemarks?: string;
      raw: any;
    }> = [];

    assignedLeaveRequests.forEach((l) => {
      const isPerm = l.category === 'Permission' || l.leaveType.toLowerCase().includes('permission');
      list.push({
        id: l.id,
        sourceType: 'leave',
        employeeId: l.employeeId || '',
        employeeName: l.employeeName || 'Assigned Employee',
        department: l.department || 'Engineering',
        avatarUrl: l.avatarUrl,
        requestTypeLabel: isPerm ? 'Official Permission' : l.leaveType,
        isPermission: isPerm,
        isLateArrival: false,
        requestDatePeriod: l.fromDate === l.toDate ? l.fromDate : `${l.fromDate} to ${l.toDate}`,
        permissionTime: l.permissionTime,
        durationDays: l.days,
        reason: l.reason,
        submissionDate: l.appliedDate,
        status: l.status,
        reviewedBy: l.reviewedBy,
        reviewedAt: l.reviewedAt,
        adminRemarks: l.adminRemarks,
        raw: l,
      });
    });

    assignedRegularizations.forEach((r) => {
      const isLate = r.punchType === 'Late Arrival Regularization' || r.category === 'Late Traffic / Transit Delay';
      list.push({
        id: r.id,
        sourceType: 'regularization',
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: r.department,
        avatarUrl: r.avatarUrl,
        requestTypeLabel: isLate ? 'Late Arrival Regularization' : `Missed Punch (${r.punchType})`,
        isPermission: false,
        isLateArrival: isLate,
        requestDatePeriod: r.date,
        permissionTime: `${r.requestedCheckIn} - ${r.requestedCheckOut}`,
        durationDays: 1,
        reason: r.reason,
        submissionDate: r.appliedDate,
        status: r.status,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt,
        adminRemarks: r.adminRemarks,
        raw: r,
      });
    });

    return list.sort((a, b) => (b.submissionDate > a.submissionDate ? 1 : -1));
  }, [assignedLeaveRequests, assignedRegularizations]);

  const filteredUnifiedRequests = useMemo(() => {
    return unifiedRequests.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;

      if (requestTypeFilter === 'Leave') {
        if (item.sourceType !== 'leave' || item.isPermission) return false;
      } else if (requestTypeFilter === 'Permission') {
        if (!item.isPermission) return false;
      } else if (requestTypeFilter === 'Regularization') {
        if (item.sourceType !== 'regularization') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.employeeName.toLowerCase().includes(q);
        const matchesId = item.employeeId.toLowerCase().includes(q);
        const matchesType = item.requestTypeLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesType) return false;
      }

      return true;
    });
  }, [unifiedRequests, statusFilter, requestTypeFilter, searchQuery]);

  // Open confirmation modal for Approve / Reject (Requirement 3)
  const handleOpenActionModal = (action: 'approve' | 'reject', item: any) => {
    // Access validation: check self approval and department authorization
    const authCheck = validateManagerApprovalPermission(
      { employeeId: item.employeeId, employeeName: item.employeeName },
      employees,
      { employeeId: user?.employeeId, name: currentManagerName, role: user?.role }
    );

    if (!authCheck.allowed) {
      alert(authCheck.reason);
      return;
    }

    const defaultRemark =
      action === 'approve'
        ? item.isPermission
          ? `Approved by Reporting Manager ${currentManagerName} (${item.permissionTime || 'Permission'}).`
          : item.sourceType === 'leave'
          ? `Leave Approved by Reporting Manager ${currentManagerName}. Deducted from employee quota.`
          : `Attendance regularized to Present by Reporting Manager ${currentManagerName}.`
        : `Request denied by Reporting Manager ${currentManagerName}.`;

    setActionModal({
      action,
      type: item.sourceType,
      item,
    });
    setActionRemarks(defaultRemark);
  };

  // Submit approval/rejection with database/context update, audit tracking, employee notification (Requirement 3)
  const handleConfirmAction = () => {
    if (!actionModal) return;
    const { action, type, item } = actionModal;
    const reviewerTitle = `${currentManagerName} (Reporting Manager)`;
    const finalRemarks = actionRemarks.trim() || `${action === 'approve' ? 'Approved' : 'Rejected'} by Reporting Manager`;

    if (type === 'leave') {
      if (action === 'approve') {
        approveLeave(item.id, finalRemarks, reviewerTitle);
      } else {
        rejectLeave(item.id, finalRemarks, reviewerTitle);
      }
    } else {
      if (action === 'approve') {
        approveRegularization(item.id, finalRemarks, reviewerTitle);
      } else {
        rejectRegularization(item.id, finalRemarks, reviewerTitle);
      }
    }

    setActionModal(null);
    setActionRemarks('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Header & Manager Role Identity */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#123B66] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#F5C542]" />
              Reporting Manager Portal
            </span>
            <span className="text-xs font-bold text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full border border-[#3D78C5]/20">
              Department Oversight
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight mt-1.5 flex items-center gap-2">
            <span>Welcome, {currentManagerName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-2xl">
            Monitor real-time attendance, review time-off applications, and process regularization claims for your{' '}
            <strong className="text-[#123B66] font-bold">{totalAssignedCount} assigned team members</strong>.
          </p>
        </div>

        {/* Manager Action Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-soft-xs transition-colors ${
              activeTab === 'approvals'
                ? 'bg-[#123B66] text-white'
                : 'bg-[#F8FAFC] text-[#123B66] hover:bg-[#EAF2FB] border border-[#E4EAF1]'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-[#3D78C5]" />
            <span>Approvals Hub</span>
            {totalPendingActionCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EF4444] text-white font-black animate-pulse">
                {totalPendingActionCount}
              </span>
            )}
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('attendance')}
              className="px-3.5 py-2 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] hover:bg-[#EAF2FB] text-xs font-bold text-[#123B66] flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-4 h-4 text-[#3D78C5]" />
              <span>Full Attendance View</span>
            </button>
          )}

          <div className="px-3 py-2 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] text-xs font-medium text-[#172033] flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#3D78C5]" />
            <span>Assigned Team: <strong>{totalAssignedCount} Staff</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Manager Self Attendance Punch Card (Requirement: Manager will also put attendance) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#3D78C5]" />
            <h3 className="text-xs font-extrabold text-[#172033] uppercase tracking-wider">
              My Manager Attendance & Daily Shift Punch
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Self Service
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-bold text-[#3D78C5] hover:underline flex items-center gap-1"
            >
              Detailed Attendance & History
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <AttendanceCard />
      </div>

      {/* 3. Seven Summary Cards (Requirement 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Card 1: Total Assigned */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs hover:border-[#3D78C5] transition-all">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Assigned Team</span>
            <Users className="w-4 h-4 text-[#3D78C5]" />
          </div>
          <p className="text-2xl font-black text-[#172033] mt-2 font-mono">{totalAssignedCount}</p>
          <span className="text-[10px] text-[#667085] mt-0.5 block">Direct Reports</span>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#667085]">Present Today</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">{presentTodayCount}</p>
          <span className="text-[10px] text-[#667085] mt-0.5 block">Active on Shift</span>
        </div>

        {/* Card 3: Absent Today */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs hover:border-red-400 transition-all">
          <div className="flex items-center justify-between text-red-500">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#667085]">Absent Today</span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-red-600 mt-2 font-mono">{absentTodayCount}</p>
          <span className="text-[10px] text-[#667085] mt-0.5 block">Unchecked / Absent</span>
        </div>

        {/* Card 4: Late Arrivals */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs hover:border-orange-400 transition-all">
          <div className="flex items-center justify-between text-orange-500">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#667085]">Late Arrivals</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-orange-600 mt-2 font-mono">{lateArrivalsCount}</p>
          <span className="text-[10px] text-[#667085] mt-0.5 block">Post-Shift Window</span>
        </div>

        {/* Card 5: Pending Leaves */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs hover:border-[#3D78C5] transition-all">
          <div className="flex items-center justify-between text-[#3D78C5]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#667085]">Pending Leaves</span>
            <CalendarDays className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-[#123B66] mt-2 font-mono">{pendingLeavesCount}</p>
          <span className="text-[10px] text-[#667085] mt-0.5 block">Time-off Claims</span>
        </div>

        {/* Card 6: Pending Permissions */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#667085]">Permissions</span>
            <Timer className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2 font-mono">{pendingPermissionsCount}</p>
          <span className="text-[10px] text-[#667085] mt-0.5 block">1-2 Hr Short Exits</span>
        </div>

        {/* Card 7: Pending Regularizations */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#667085]">Regularizations</span>
            <FileCheck2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2 font-mono">{pendingRegularizationsCount}</p>
          <span className="text-[10px] text-[#667085] mt-0.5 block">Missed / Late Punches</span>
        </div>
      </div>

      {/* 3. Navigation View Switcher */}
      <div className="flex items-center justify-between border-b border-[#E4EAF1] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-[#123B66] text-white shadow-soft-xs'
                : 'text-[#667085] hover:bg-[#EAF2FB] hover:text-[#123B66]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-[#123B66] text-white shadow-soft-xs'
                : 'text-[#667085] hover:bg-[#EAF2FB] hover:text-[#123B66]'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Team Requests & Approvals</span>
            {totalPendingActionCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#EF4444] text-white font-black animate-pulse">
                {totalPendingActionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-[#123B66] text-white shadow-soft-xs'
                : 'text-[#667085] hover:bg-[#EAF2FB] hover:text-[#123B66]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Attendance Monitoring</span>
          </button>
        </div>
      </div>

      {/* VIEW A: OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section: Urgent Action Queue if pending requests exist */}
          {totalPendingActionCount > 0 && (
            <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/70 border border-amber-200 rounded-3xl p-5 sm:p-6 shadow-soft-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-soft-xs flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-amber-950">
                      Action Required: {totalPendingActionCount} Requests Awaiting Your Review
                    </h3>
                    <p className="text-xs text-amber-800">
                      Requests submitted by employees assigned to you require your managerial decision.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('approvals')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-soft-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>Open Full Approvals Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Top 3 Pending Items Quick Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {unifiedRequests
                  .filter((r) => r.status === 'Pending')
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-soft-xs space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {item.requestTypeLabel}
                          </span>
                          <span className="text-[10px] font-mono text-[#667085]">{item.submissionDate}</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-[#172033] mt-2">{item.employeeName}</h4>
                        <p className="text-[11px] text-[#667085] font-mono">ID: {item.employeeId} • {item.requestDatePeriod}</p>
                        <p className="text-xs text-[#667085] italic mt-1 line-clamp-2">"{item.reason}"</p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4EAF1]">
                        <button
                          onClick={() => handleOpenActionModal('reject', item)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleOpenActionModal('approve', item)}
                          className="px-3 py-1 rounded-lg text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Section: Assigned Team Live Status Roster */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4EAF1] shadow-soft-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#172033] tracking-tight">
                  Assigned Team Attendance Roster
                </h3>
                <p className="text-xs text-[#667085]">
                  Real-time punch activity of staff reporting to <strong>{currentManagerName}</strong>.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs font-bold text-[#3D78C5] hover:text-[#123B66] flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Full Attendance Monitoring</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E4EAF1] text-[#667085] font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Designation</th>
                    <th className="py-3 px-3">Today Status</th>
                    <th className="py-3 px-3">Check-In</th>
                    <th className="py-3 px-3">Work Location</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAF1]/70">
                  {assignedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className="w-9 h-9 rounded-xl object-cover border border-[#E4EAF1]"
                          />
                          <div>
                            <span className="font-extrabold text-[#172033] block">{emp.fullName}</span>
                            <span className="text-[10px] text-[#3D78C5] font-mono font-bold">
                              ID: {emp.employeeId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#667085]">{emp.designation}</td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.todayStatus === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emp.todayStatus === 'Late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {emp.todayStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-[#172033]">
                        {emp.todayCheckIn || '--:--'}
                      </td>

                      <td className="py-3 px-3 text-[#667085]">
                        <span className="truncate max-w-[150px] block">{emp.todayLocation || 'MSIR HQ Campus'}</span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setInspectingLocationEmp(emp)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#3D78C5] hover:bg-[#EAF2FB] transition-colors"
                        >
                          View Punch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: TEAM REQUESTS & APPROVALS (Requirement 2 & 3) */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E4EAF1] shadow-soft-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID, or request..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E4EAF1] bg-[#F8FAFC] text-xs text-[#172033] focus:outline-none focus:border-[#3D78C5]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1">
                <Filter className="w-3 h-3" /> Type:
              </span>
              {(['All', 'Leave', 'Permission', 'Regularization'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRequestTypeFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    requestTypeFilter === cat
                      ? 'bg-[#123B66] text-white shadow-soft-xs'
                      : 'bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] hover:text-[#123B66]'
                  }`}
                >
                  {cat === 'All' ? 'All Requests' : cat}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-[#E4EAF1] mx-1 hidden sm:block" />

              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Status:</span>
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-[#3D78C5] text-white shadow-soft-xs'
                      : 'bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Queue */}
          {filteredUnifiedRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E4EAF1]">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-extrabold text-[#172033] text-base">
                No {statusFilter !== 'All' ? statusFilter : ''} Requests in Queue
              </h4>
              <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                All requests from employees reporting to <strong>{currentManagerName}</strong> are up to date.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUnifiedRequests.map((item) => {
                const empBalances = getEmployeeLeaveBalances(item.employeeId);
                const isSelfRequest =
                  item.employeeId.toLowerCase() === user?.employeeId?.toLowerCase() ||
                  item.employeeName.toLowerCase().trim() === currentManagerName.toLowerCase().trim();

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E4EAF1] shadow-soft-xs space-y-4 hover:border-[#CBD5E1] transition-all"
                  >
                    {/* Top Row: Employee Profile + Status Badge + Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4EAF1]">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            item.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={item.employeeName}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#E4EAF1]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm sm:text-base text-[#172033]">
                              {item.employeeName}
                            </h4>
                            <span className="text-[11px] font-mono font-bold text-[#3D78C5] bg-[#EAF2FB] px-2 py-0.5 rounded-full">
                              ID: {item.employeeId}
                            </span>
                            <span className="text-xs text-[#667085] hidden md:inline">
                              • Reports to: <strong>{currentManagerName}</strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                item.isPermission
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : item.sourceType === 'regularization'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {item.isPermission ? (
                                <Timer className="w-3.5 h-3.5 text-amber-600" />
                              ) : item.sourceType === 'regularization' ? (
                                <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                              ) : (
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              {item.requestTypeLabel}
                            </span>

                            <span className="text-xs font-mono font-bold text-[#123B66]">
                              {item.isPermission
                                ? item.permissionTime
                                : item.sourceType === 'leave'
                                ? `${item.durationDays} Day(s)`
                                : item.requestDatePeriod}
                            </span>

                            <span className="text-[11px] font-mono text-[#667085]">
                              • Ref: {item.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            item.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {item.status}
                        </span>

                        <button
                          onClick={() => setViewingDetailItem({ type: item.sourceType, data: item })}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC] border border-[#E4EAF1] transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        {item.status === 'Pending' && !isSelfRequest && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenActionModal('reject', item)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleOpenActionModal('approve', item)}
                              className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-soft-xs transition-colors flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          </div>
                        )}

                        {item.status === 'Pending' && isSelfRequest && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                            Self Request (Pending HR Admin)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Requirement 3: Request Particulars Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E4EAF1]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                          Requested Date / Period
                        </span>
                        <span className="font-semibold text-[#172033] mt-0.5 block">
                          {item.requestDatePeriod}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                          Submitted On
                        </span>
                        <span className="font-semibold text-[#172033] mt-0.5 block">
                          {item.submissionDate}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                          Assigned Reporting Manager
                        </span>
                        <span className="font-semibold text-[#123B66] mt-0.5 block">
                          {currentManagerName} (Authorized Approver)
                        </span>
                      </div>
                    </div>

                    {/* Employee Remaining Leave Quota preview (if leave) */}
                    {item.sourceType === 'leave' && !item.isPermission && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[#667085] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#3D78C5]" />
                          Employee Quota Balance:
                        </span>
                        <span className="font-bold text-[#172033] font-mono">
                          Casual: {empBalances.casualLeave.available}d left • Sick: {empBalances.sickLeave.available}d left • Earned: {empBalances.earnedLeave.available}d left
                        </span>
                      </div>
                    )}

                    {/* Reason */}
                    <div className="p-3.5 rounded-2xl bg-white border border-[#E4EAF1] text-xs">
                      <span className="font-bold text-[#172033] block mb-0.5">Reason Provided by Employee:</span>
                      <p className="text-[#667085] leading-relaxed italic">"{item.reason}"</p>
                    </div>

                    {/* Audit Trail (Manager Identity, Decision, and Timestamp) */}
                    {(item.reviewedBy || item.adminRemarks) && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#172033] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#123B66]">Audit Trail:</span>
                          <span className="text-[#667085]">Reviewed by {item.reviewedBy}</span>
                          {item.adminRemarks && (
                            <span className="text-slate-800 font-medium">• Remarks: "{item.adminRemarks}"</span>
                          )}
                        </div>
                        {item.reviewedAt && (
                          <span className="text-[#667085] text-[11px] font-mono">{item.reviewedAt}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW C: ATTENDANCE MONITORING (Requirement 4) */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E4EAF1] shadow-soft-xs space-y-4">
          <div>
            <h3 className="text-lg font-black text-[#172033] tracking-tight">
              Assigned Team Attendance Monitoring
            </h3>
            <p className="text-xs text-[#667085]">
              Full attendance records, check-in/out times, working hours, and physical GPS verification for staff reporting to <strong>{currentManagerName}</strong>.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4EAF1] text-[#667085] font-bold text-[10px] uppercase tracking-wider bg-[#F8FAFC]">
                  <th className="py-3 px-3">Employee Details</th>
                  <th className="py-3 px-3">Shift & Department</th>
                  <th className="py-3 px-3">Attendance Status</th>
                  <th className="py-3 px-3">Punch In</th>
                  <th className="py-3 px-3">Punch Out</th>
                  <th className="py-3 px-3">Est. Working Hours</th>
                  <th className="py-3 px-3">Geofence Location</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAF1]/70">
                {assignedEmployees.map((emp) => {
                  const isPresent = emp.todayStatus === 'Present';
                  const isLate = emp.todayStatus === 'Late';
                  const isAbsent = emp.todayStatus === 'Absent';

                  return (
                    <tr key={emp.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className="w-10 h-10 rounded-xl object-cover border border-[#E4EAF1]"
                          />
                          <div>
                            <span className="font-extrabold text-[#172033] block">{emp.fullName}</span>
                            <span className="text-[10px] text-[#3D78C5] font-mono font-bold">
                              ID: {emp.employeeId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-[#172033] block">{emp.designation}</span>
                        <span className="text-[10px] text-[#667085]">{emp.department}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isPresent
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isLate
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {isPresent && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isLate && <Clock className="w-3 h-3 text-amber-600" />}
                          {isAbsent && <XCircle className="w-3 h-3 text-red-600" />}
                          {emp.todayStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-[#172033]">
                        {emp.todayCheckIn || '--:--'}
                      </td>

                      <td className="py-3 px-3 font-mono text-[#667085]">
                        {isPresent ? '05:30 PM (Est)' : '--:--'}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-[#123B66]">
                        {isPresent ? '8h 30m' : isLate ? '7h 45m' : '0h 0m'}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px] text-[#172033]">
                          <MapPin className="w-3.5 h-3.5 text-[#3D78C5] flex-shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {emp.todayLocation || 'MSIR HQ Campus'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#667085] block mt-0.5">
                          {emp.geofenceEnabled === false ? 'Policy Exempted' : '2km Campus Perimeter'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setInspectingLocationEmp(emp)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#123B66] hover:bg-[#1c4b7d] transition-colors"
                        >
                          Inspect Punch
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION ACTION MODAL (Requirement 3: Confirm before completing, allow remarks, audit identity) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E4EAF1] shadow-soft-2xl relative my-6">
            <button
              onClick={() => setActionModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  actionModal.action === 'approve'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {actionModal.action === 'approve' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                )}
                Reporting Manager Decision Confirmation
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-[#172033] tracking-tight mt-1.5">
              Confirm {actionModal.action === 'approve' ? 'Approval' : 'Rejection'}: {actionModal.item.requestTypeLabel}
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              You are processing this request as assigned Reporting Manager (<strong>{currentManagerName}</strong>).
            </p>

            {/* Employee Particulars Strip */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex items-center gap-3">
              <img
                src={actionModal.item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={actionModal.item.employeeName}
                className="w-11 h-11 rounded-2xl object-cover border border-[#E4EAF1]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-[#172033] truncate">
                    {actionModal.item.employeeName}
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-[#3D78C5] bg-[#EAF2FB] px-2 py-0.5 rounded-full">
                    ID: {actionModal.item.employeeId}
                  </span>
                </div>
                <p className="text-xs text-[#667085] truncate">
                  Requested Date: <strong>{actionModal.item.requestDatePeriod}</strong> • Submitted: {actionModal.item.submissionDate}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="mt-3 p-3 rounded-xl bg-white border border-[#E4EAF1] text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block mb-0.5">
                Employee Justification:
              </span>
              <p className="text-[#172033] italic">"{actionModal.item.reason}"</p>
            </div>

            {/* Manager Remarks Input (Requirement 3) */}
            <div className="mt-4">
              <label className="text-xs font-bold text-[#172033] block mb-1">
                Reporting Manager Official Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Enter remarks for the audit trail and employee notification..."
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#3D78C5] font-medium"
              />
              <p className="text-[10px] text-[#667085] mt-1">
                Your name ({currentManagerName}), decision, and timestamp will be recorded permanently in the audit log.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-[#E4EAF1]">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-soft-md transition-all flex items-center gap-1.5 ${
                  actionModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionModal.action === 'approve' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>
                  Confirm {actionModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL (Requirement 3) */}
      {viewingDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E4EAF1] shadow-soft-2xl relative my-6">
            <button
              onClick={() => setViewingDetailItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full border border-[#3D78C5]/20">
              Request Detailed Inspection
            </span>

            <h3 className="text-xl font-extrabold text-[#172033] tracking-tight mt-1.5">
              {viewingDetailItem.data.requestTypeLabel}
            </h3>
            <p className="text-xs text-[#667085]">Reference ID: {viewingDetailItem.data.id}</p>

            <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#667085] font-bold uppercase text-[10px]">Employee Name:</span>
                <span className="font-extrabold text-[#172033]">{viewingDetailItem.data.employeeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085] font-bold uppercase text-[10px]">Employee ID:</span>
                <span className="font-mono font-bold text-[#3D78C5]">{viewingDetailItem.data.employeeId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085] font-bold uppercase text-[10px]">Requested Date / Period:</span>
                <span className="font-extrabold text-[#172033]">{viewingDetailItem.data.requestDatePeriod}</span>
              </div>
              {viewingDetailItem.data.permissionTime && (
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] font-bold uppercase text-[10px]">Time Window:</span>
                  <span className="font-mono font-bold text-[#123B66]">{viewingDetailItem.data.permissionTime}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#667085] font-bold uppercase text-[10px]">Submission Date:</span>
                <span className="font-semibold text-[#172033]">{viewingDetailItem.data.submissionDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085] font-bold uppercase text-[10px]">Current Status:</span>
                <span className="font-bold text-[#123B66]">{viewingDetailItem.data.status}</span>
              </div>
            </div>

            <div className="mt-3.5 p-3.5 rounded-2xl bg-white border border-[#E4EAF1] text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
                Full Reason Stated:
              </span>
              <p className="text-[#172033] leading-relaxed">"{viewingDetailItem.data.reason}"</p>
            </div>

            {viewingDetailItem.data.reviewedBy && (
              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#172033] space-y-1">
                <p className="font-bold text-[#123B66]">Audit Trail Record:</p>
                <p className="text-[#667085]">Reviewed by: {viewingDetailItem.data.reviewedBy}</p>
                <p className="text-[#667085]">Decision Time: {viewingDetailItem.data.reviewedAt}</p>
                {viewingDetailItem.data.adminRemarks && (
                  <p className="text-slate-800 font-medium">Remarks: "{viewingDetailItem.data.adminRemarks}"</p>
                )}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingDetailItem(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#123B66] hover:bg-[#1c4b7d] transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Location Inspection Modal */}
      {inspectingLocationEmp && (
        <EmployeeLocationModal
          isOpen={!!inspectingLocationEmp}
          onClose={() => setInspectingLocationEmp(null)}
          employee={inspectingLocationEmp}
        />
      )}
    </div>
  );
};
