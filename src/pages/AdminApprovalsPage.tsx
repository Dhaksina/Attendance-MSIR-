import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Filter,
  Check,
  X,
  FileCheck2,
  CalendarDays,
  User,
  ArrowRight,
  Sparkles,
  Timer,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { RegularizationRequest, LeaveRequest } from '../types';

export const AdminApprovalsPage: React.FC = () => {
  const {
    regularizationRequests,
    approveRegularization,
    rejectRegularization,
    leaveRequests,
    approveLeave,
    rejectLeave,
    getEmployeeLeaveBalances,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'leaves_permissions' | 'regularization'>('leaves_permissions');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Leave' | 'Permission'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

  // Leave approval confirmation modal with live remaining balance review
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [approvalRemark, setApprovalRemark] = useState('');

  // Rejection remark modal state
  const [rejectingItem, setRejectingItem] = useState<{
    id: string;
    type: 'regularization' | 'leave' | 'permission';
    name?: string;
  } | null>(null);
  const [rejectRemark, setRejectRemark] = useState('');

  const filteredRegularizations = regularizationRequests.filter((r) => {
    if (statusFilter === 'All') return true;
    return r.status === statusFilter;
  });

  const filteredLeavesAndPermissions = leaveRequests.filter((l) => {
    const matchStatus = statusFilter === 'All' ? true : l.status === statusFilter;
    const isPermission = l.category === 'Permission' || l.leaveType.toLowerCase().includes('permission');
    const matchCat =
      categoryFilter === 'All'
        ? true
        : categoryFilter === 'Permission'
          ? isPermission
          : !isPermission;

    return matchStatus && matchCat;
  });

  const pendingRegCount = regularizationRequests.filter((r) => r.status === 'Pending').length;
  const pendingLeaveCount = leaveRequests.filter(
    (l) => l.status === 'Pending' && l.category !== 'Permission' && !l.leaveType.toLowerCase().includes('permission')
  ).length;
  const pendingPermCount = leaveRequests.filter(
    (l) => l.status === 'Pending' && (l.category === 'Permission' || l.leaveType.toLowerCase().includes('permission'))
  ).length;

  const handleApproveRegularization = (id: string) => {
    approveRegularization(id, 'Approved by HR Administrator. Attendance regularized to Present.');
  };

  const handleOpenApproveModal = (req: LeaveRequest) => {
    const isPermission = req.category === 'Permission' || req.leaveType.toLowerCase().includes('permission');
    const defaultRemark = isPermission
      ? `Official Permission Approved by HR Administrator (${req.permissionTime || '2 Hours'}).`
      : `Leave Application Approved by HR Administrator. Deducted ${req.days} Day(s) from ${req.leaveType} balance.`;
    setApprovingLeave(req);
    setApprovalRemark(defaultRemark);
  };

  const handleConfirmApproval = () => {
    if (!approvingLeave) return;
    const finalRemark = approvalRemark.trim() || 'Approved by HR Administrator.';
    approveLeave(approvingLeave.id, finalRemark);
    setApprovingLeave(null);
    setApprovalRemark('');
  };

  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    const fallbackRemark =
      rejectingItem.type === 'regularization'
        ? 'Discrepancy with access logs. Rejected by HR Administrator.'
        : rejectingItem.type === 'permission'
          ? 'Permission request denied due to scheduling constraints. Rejected by Admin.'
          : 'Leave request not approved. Rejected by HR Administrator.';

    const finalRemarks = rejectRemark.trim() || fallbackRemark;

    if (rejectingItem.type === 'regularization') {
      rejectRegularization(rejectingItem.id, finalRemarks);
    } else {
      rejectLeave(rejectingItem.id, finalRemarks);
    }

    setRejectingItem(null);
    setRejectRemark('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#123B66] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5C542]" />
              HR Decision Hub
            </span>
            <span className="text-xs text-[#667085]">
              Administrative Approvals Workflow
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Leave, Permission & Regularization Management
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Review and track employee leave applications and official short-duration permissions. Provide official approvals or rejections with audit remarks.
          </p>
        </div>

        {/* Counter Badges (Requirement 6) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center min-w-[110px]">
            <span className="text-[10px] font-bold uppercase text-[#123B66] block">Pending Leaves</span>
            <span className="text-xl font-extrabold text-[#3D78C5] font-mono">{pendingLeaveCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center min-w-[110px]">
            <span className="text-[10px] font-bold uppercase text-amber-800 block">Pending Permissions</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono">{pendingPermCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center min-w-[110px]">
            <span className="text-[10px] font-bold uppercase text-purple-800 block">Regularizations</span>
            <span className="text-xl font-extrabold text-purple-700 font-mono">{pendingRegCount}</span>
          </div>
        </div>
      </div>

      {/* Main Switcher Tabs & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('leaves_permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'leaves_permissions'
              ? 'bg-[#123B66] text-white shadow-soft-xs'
              : 'text-[#667085] hover:text-[#172033]'
              }`}
          >
            <CalendarDays className="w-4 h-4 text-[#F5C542]" />
            <span>Leave & Permission Requests</span>
            {pendingLeaveCount + pendingPermCount > 0 && (
              <span className="text-[10px] font-bold bg-[#3D78C5] text-white px-1.5 py-0.2 rounded-full">
                {pendingLeaveCount + pendingPermCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('regularization')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'regularization'
              ? 'bg-[#123B66] text-white shadow-soft-xs'
              : 'text-[#667085] hover:text-[#172033]'
              }`}
          >
            <Clock className="w-4 h-4 text-[#3D78C5]" />
            <span>Attendance Regularizations</span>
            {pendingRegCount > 0 && (
              <span className="text-[10px] font-bold bg-[#EF4444] text-white px-1.5 py-0.2 rounded-full">
                {pendingRegCount}
              </span>
            )}
          </button>
        </div>

        {/* Secondary Category and Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'leaves_permissions' && (
            <div className="flex items-center p-1 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs">
              {(['All', 'Leave', 'Permission'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${categoryFilter === cat
                    ? 'bg-white text-[#123B66] font-bold shadow-soft-xs'
                    : 'text-[#667085] hover:text-[#172033]'
                    }`}
                >
                  {cat === 'All' ? 'All Types' : cat === 'Leave' ? 'Leaves' : 'Permissions'}
                </button>
              ))}
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${statusFilter === filter
                  ? 'bg-white border border-[#123B66] text-[#123B66] font-bold shadow-soft-xs'
                  : 'bg-white border border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC]'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: Leave & Permission Requests Queue (Requirement 6) */}
      {activeTab === 'leaves_permissions' && (
        <div className="space-y-4">
          {filteredLeavesAndPermissions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E4EAF1]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-[#172033] text-base">
                No {statusFilter !== 'All' ? statusFilter : ''} {categoryFilter !== 'All' ? categoryFilter : 'Leave / Permission'} Requests
              </h4>
              <p className="text-xs text-[#667085] mt-1">All requests have been reviewed and tracked.</p>
            </div>
          ) : (
            filteredLeavesAndPermissions.map((req) => {
              const isPermission =
                req.category === 'Permission' || req.leaveType.toLowerCase().includes('permission');

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 border border-[#E4EAF1] shadow-soft-xs space-y-4 hover:border-[#CBD5E1] transition-all"
                >
                  {/* Top Bar: Employee & Category Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4EAF1]">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={
                          req.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={req.employeeName || 'Employee'}
                        className="w-11 h-11 rounded-2xl object-cover border border-[#E4EAF1]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-[#172033]">
                            {req.employeeName || 'Staff Member'}
                          </h4>
                          <span className="text-[11px] font-mono font-bold text-[#3D78C5] bg-[#EAF2FB] px-2 py-0.5 rounded-full">
                            ID: {req.employeeId || 'N/A'}
                          </span>
                          <span className="text-xs text-[#667085] hidden md:inline">
                            • {req.department || 'Calibration Division'}
                          </span>
                        </div>

                        {/* Request Type and Category Tag */}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${isPermission
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                          >
                            {isPermission ? (
                              <Timer className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {isPermission ? 'Official Permission Request' : req.leaveType}
                          </span>

                          <span className="text-xs font-mono font-bold text-[#123B66]">
                            {isPermission
                              ? req.permissionTime || '02:30 PM - 04:30 PM (2 Hours)'
                              : `${req.days} Day(s)`}
                          </span>

                          <span className="text-[11px] font-mono text-[#667085]">
                            • Ref: {req.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Approve / Reject Action Buttons */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${req.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                      >
                        {req.status}
                      </span>

                      {req.status === 'Pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setRejectingItem({
                                id: req.id,
                                type: isPermission ? 'permission' : 'leave',
                                name: req.employeeName,
                              })
                            }
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleOpenApproveModal(req)}
                            className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-soft-xs transition-colors flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isPermission ? 'Approve Permission' : 'Approve Leave'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detail Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E4EAF1]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                        Requested Date / Period
                      </span>
                      <span className="font-semibold text-[#172033] mt-0.5 block">
                        {req.fromDate} {req.fromDate !== req.toDate ? `to ${req.toDate}` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                        Applied On
                      </span>
                      <span className="font-semibold text-[#172033] mt-0.5 block">
                        {req.appliedDate}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                        Approval Authority
                      </span>
                      <span className="font-semibold text-[#123B66] mt-0.5 block">
                        HR Administrator & Reporting Manager
                      </span>
                    </div>
                  </div>

                  {/* Employee Remaining Leave Balance Summary Strip (Requirement: Show employee remaining leave during approval) */}
                  {(() => {
                    const empBalances = getEmployeeLeaveBalances(req.employeeId);
                    const catKey: 'casualLeave' | 'sickLeave' | 'earnedLeave' =
                      req.leaveType === 'Sick Leave'
                        ? 'sickLeave'
                        : req.leaveType === 'Earned Leave'
                          ? 'earnedLeave'
                          : 'casualLeave';
                    const activeCat = empBalances[catKey];
                    const currentRemaining = isPermission
                      ? empBalances.permissionsRemaining
                      : activeCat.available;
                    const deduction = isPermission ? 1 : req.days;
                    const projectedRemaining = isPermission
                      ? Math.max(0, empBalances.permissionsRemaining - 1)
                      : Math.max(0, activeCat.available - req.days);
                    const isSufficient = isPermission
                      ? empBalances.permissionsRemaining >= 1
                      : activeCat.available >= req.days;

                    return (
                      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#EAF2FB] text-[#3D78C5] flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-[11px] uppercase font-bold text-[#172033] tracking-wider block">
                                Employee Remaining Leave Balance
                              </span>
                              <span className="text-[10px] text-[#667085]">
                                Verified quota tracking for {req.employeeName} (ID: {req.employeeId})
                              </span>
                            </div>
                          </div>

                          {/* Live Balance Impact Preview */}
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E4EAF1] text-xs font-mono font-bold text-[#172033] shadow-soft-xs flex items-center gap-2">
                              <span className="text-[#667085] font-sans font-medium">Available Now:</span>
                              <span className="text-[#123B66] font-extrabold text-sm">
                                {isPermission ? `${currentRemaining} / ${empBalances.permissionsTotal} Slots` : `${currentRemaining} Days`}
                              </span>

                              {req.status === 'Pending' && (
                                <>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#667085]" />
                                  <span className="text-[#667085] font-sans font-medium">After Approval:</span>
                                  <span
                                    className={`text-sm font-extrabold ${!isSufficient
                                      ? 'text-red-600'
                                      : projectedRemaining < 2
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                                      }`}
                                  >
                                    {isPermission ? `${projectedRemaining} Slots` : `${projectedRemaining} Days`}
                                  </span>
                                </>
                              )}

                              {req.status === 'Approved' && (
                                <span className="text-[11px] font-sans font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Deducted from Quota
                                </span>
                              )}
                            </div>

                            {/* Low Balance Warning Badge if applicable */}
                            {req.status === 'Pending' && !isSufficient && (
                              <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-lg flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                Quota Exceeded
                              </span>
                            )}
                          </div>
                        </div>

                        {/* All Leave Types Breakdown Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E4EAF1]">
                          {/* Casual Leave */}
                          <div
                            className={`p-2.5 rounded-xl border text-xs transition-all ${req.leaveType === 'Casual Leave' && !isPermission
                              ? 'bg-[#EAF2FB] border-[#3D78C5] ring-2 ring-[#3D78C5]/20 shadow-soft-xs'
                              : 'bg-white border-[#E4EAF1]'
                              }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#667085]">
                              <span className="font-semibold">Casual Leave</span>
                              {req.leaveType === 'Casual Leave' && !isPermission && (
                                <span className="font-bold text-[#3D78C5] bg-white px-1.5 py-0.2 rounded">Requested</span>
                              )}
                            </div>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-sm font-extrabold text-[#172033] font-mono">
                                {empBalances.casualLeave.available}
                              </span>
                              <span className="text-[10px] text-[#667085]">
                                / {empBalances.casualLeave.total} Days left
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="bg-[#3D78C5] h-full rounded-full"
                                style={{
                                  width: `${(empBalances.casualLeave.available / empBalances.casualLeave.total) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Sick Leave */}
                          <div
                            className={`p-2.5 rounded-xl border text-xs transition-all ${req.leaveType === 'Sick Leave' && !isPermission
                              ? 'bg-[#EAF2FB] border-[#3D78C5] ring-2 ring-[#3D78C5]/20 shadow-soft-xs'
                              : 'bg-white border-[#E4EAF1]'
                              }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#667085]">
                              <span className="font-semibold">Sick Leave</span>
                              {req.leaveType === 'Sick Leave' && !isPermission && (
                                <span className="font-bold text-[#3D78C5] bg-white px-1.5 py-0.2 rounded">Requested</span>
                              )}
                            </div>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-sm font-extrabold text-[#172033] font-mono">
                                {empBalances.sickLeave.available}
                              </span>
                              <span className="text-[10px] text-[#667085]">
                                / {empBalances.sickLeave.total} Days left
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="bg-[#123B66] h-full rounded-full"
                                style={{
                                  width: `${(empBalances.sickLeave.available / empBalances.sickLeave.total) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Earned Leave */}
                          <div
                            className={`p-2.5 rounded-xl border text-xs transition-all ${req.leaveType === 'Earned Leave' && !isPermission
                              ? 'bg-[#EAF2FB] border-[#3D78C5] ring-2 ring-[#3D78C5]/20 shadow-soft-xs'
                              : 'bg-white border-[#E4EAF1]'
                              }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#667085]">
                              <span className="font-semibold">Earned Leave</span>
                              {req.leaveType === 'Earned Leave' && !isPermission && (
                                <span className="font-bold text-[#3D78C5] bg-white px-1.5 py-0.2 rounded">Requested</span>
                              )}
                            </div>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-sm font-extrabold text-[#172033] font-mono">
                                {empBalances.earnedLeave.available}
                              </span>
                              <span className="text-[10px] text-[#667085]">
                                / {empBalances.earnedLeave.total} Days left
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="bg-[#F5C542] h-full rounded-full"
                                style={{
                                  width: `${(empBalances.earnedLeave.available / empBalances.earnedLeave.total) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Permission Slots */}
                          <div
                            className={`p-2.5 rounded-xl border text-xs transition-all ${isPermission
                              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-300/30 shadow-soft-xs'
                              : 'bg-white border-[#E4EAF1]'
                              }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#667085]">
                              <span className="font-semibold">Permissions (Monthly)</span>
                              {isPermission && (
                                <span className="font-bold text-amber-800 bg-white px-1.5 py-0.2 rounded">Requested</span>
                              )}
                            </div>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-sm font-extrabold text-[#172033] font-mono">
                                {empBalances.permissionsRemaining}
                              </span>
                              <span className="text-[10px] text-[#667085]">
                                / {empBalances.permissionsTotal} Slots left
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{
                                  width: `${(empBalances.permissionsRemaining / empBalances.permissionsTotal) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reason */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E4EAF1] text-xs">
                    <span className="font-bold text-[#172033] block mb-0.5">
                      {isPermission ? 'Reason for Permission:' : 'Reason for Leave:'}
                    </span>
                    <p className="text-[#667085] leading-relaxed">{req.reason}</p>
                  </div>

                  {/* Audit Trail (Requirement 6 - Tracking Status & Remarks) */}
                  {(req.adminRemarks || req.reviewedBy) && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#172033] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#123B66]">Audit Record:</span>
                        <span className="text-[#667085]">
                          Reviewed by {req.reviewedBy || 'HR Administrator'}
                        </span>
                        {req.adminRemarks && (
                          <span className="text-slate-800 font-medium">
                            • Remarks: "{req.adminRemarks}"
                          </span>
                        )}
                      </div>
                      {req.reviewedAt && (
                        <span className="text-[#667085] text-[11px] font-mono">{req.reviewedAt}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SECTION 2: Attendance Regularization Requests Queue */}
      {activeTab === 'regularization' && (
        <div className="space-y-4">
          {filteredRegularizations.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E4EAF1]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-[#172033] text-base">
                No {statusFilter} Regularization Claims
              </h4>
              <p className="text-xs text-[#667085] mt-1">All missed attendance claims are resolved.</p>
            </div>
          ) : (
            filteredRegularizations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-[#E4EAF1] shadow-soft-xs space-y-4 hover:border-[#CBD5E1] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4EAF1]">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.avatarUrl}
                      alt={item.employeeName}
                      className="w-11 h-11 rounded-2xl object-cover border border-[#E4EAF1]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#172033]">{item.employeeName}</h4>
                        <span className="text-[11px] font-mono font-bold text-[#3D78C5] bg-[#EAF2FB] px-2 py-0.5 rounded-full">
                          ID: {item.employeeId}
                        </span>
                        <span className="text-xs text-[#667085] hidden md:inline">• {item.department}</span>
                      </div>
                      <p className="text-xs text-[#667085] mt-0.5">
                        Claimed Date:{' '}
                        <span className="font-bold text-[#172033] font-mono">{item.date}</span> •
                        Applied: {item.appliedDate} • Ref: {item.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${item.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                    >
                      {item.status}
                    </span>

                    {item.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setRejectingItem({
                              id: item.id,
                              type: 'regularization',
                              name: item.employeeName,
                            })
                          }
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveRegularization(item.id)}
                          className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-soft-xs transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Grant Present</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E4EAF1]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                      Discrepancy Category
                    </span>
                    <span className="font-semibold text-[#172033] mt-0.5 block">{item.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                      Punch Type Claimed
                    </span>
                    <span className="font-semibold text-[#172033] mt-0.5 block">{item.punchType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                      Claimed Timings
                    </span>
                    <span className="font-bold text-[#123B66] font-mono mt-0.5 block">
                      In: {item.requestedCheckIn} • Out: {item.requestedCheckOut}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#E4EAF1] text-xs">
                  <span className="font-bold text-[#172033] block mb-0.5">Employee Explanation:</span>
                  <p className="text-[#667085] leading-relaxed">{item.reason}</p>
                </div>

                {item.adminRemarks && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#172033] flex items-center justify-between">
                    <div>
                      <span className="font-bold">Admin Remarks:</span> {item.adminRemarks}
                    </div>
                    {item.reviewedAt && (
                      <span className="text-[#667085] text-[11px] font-mono">{item.reviewedAt}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Leave & Permission Approval Modal with Live Remaining Leave Calculation */}
      {approvingLeave && (() => {
        const isPermission =
          approvingLeave.category === 'Permission' ||
          approvingLeave.leaveType.toLowerCase().includes('permission');
        const empBalances = getEmployeeLeaveBalances(approvingLeave.employeeId);
        const catKey: 'casualLeave' | 'sickLeave' | 'earnedLeave' =
          approvingLeave.leaveType === 'Sick Leave'
            ? 'sickLeave'
            : approvingLeave.leaveType === 'Earned Leave'
              ? 'earnedLeave'
              : 'casualLeave';
        const activeCat = empBalances[catKey];
        const currentRemaining = isPermission
          ? empBalances.permissionsRemaining
          : activeCat.available;
        const deduction = isPermission ? 1 : approvingLeave.days;
        const projectedRemaining = isPermission
          ? Math.max(0, empBalances.permissionsRemaining - 1)
          : Math.max(0, activeCat.available - approvingLeave.days);
        const isSufficient = isPermission
          ? empBalances.permissionsRemaining >= 1
          : activeCat.available >= approvingLeave.days;

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E4EAF1] shadow-soft-2xl relative my-6">
              <button
                onClick={() => setApprovingLeave(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Leave Approval & Quota Review
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-[#172033] tracking-tight mt-1.5">
                Approve {isPermission ? 'Official Permission' : 'Leave Request'}
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Review this employee's remaining leave balance and confirm approval deduction.
              </p>

              {/* Employee Header Strip */}
              <div className="mt-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex items-center gap-3">
                <img
                  src={
                    approvingLeave.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={approvingLeave.employeeName}
                  className="w-11 h-11 rounded-2xl object-cover border border-[#E4EAF1]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-[#172033] truncate">
                      {approvingLeave.employeeName}
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-[#3D78C5] bg-[#EAF2FB] px-2 py-0.5 rounded-full">
                      ID: {approvingLeave.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] truncate">
                    {approvingLeave.department} • Ref: {approvingLeave.id}
                  </p>
                </div>
              </div>

              {/* Leave Request Particulars */}
              <div className="mt-3.5 p-3.5 rounded-2xl bg-white border border-[#E4EAF1] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Requested Period</span>
                  <span className="font-extrabold text-[#172033]">
                    {approvingLeave.fromDate} {approvingLeave.fromDate !== approvingLeave.toDate ? `to ${approvingLeave.toDate}` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Type & Duration</span>
                  <span className="font-extrabold text-[#123B66]">
                    {isPermission ? approvingLeave.permissionTime || '2 Hours' : `${approvingLeave.leaveType} (${approvingLeave.days} Day(s))`}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E4EAF1]/70">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-0.5">Reason</span>
                  <p className="text-[#667085] leading-relaxed italic">"{approvingLeave.reason}"</p>
                </div>
              </div>

              {/* REMAINING LEAVE AUDIT CARD (User Request: Show the employee remaining leave when giving approval) */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] border border-[#BFDBFE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#123B66] flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#3D78C5]" />
                    Employee Remaining Leave Calculation
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${isSufficient
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                  >
                    {isSufficient ? 'Sufficient Quota' : 'Insufficient Quota'}
                  </span>
                </div>

                {/* 3-Column Calculation: Before -> Deduction -> After */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E4EAF1] shadow-soft-xs">
                    <span className="text-[10px] font-bold text-[#667085] uppercase block">Current Balance</span>
                    <span className="text-base sm:text-lg font-black text-[#172033] font-mono block mt-0.5">
                      {isPermission ? currentRemaining : `${currentRemaining}d`}
                    </span>
                    <span className="text-[10px] text-[#667085]">
                      {isPermission ? 'Slots left' : 'Remaining'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-red-200 shadow-soft-xs">
                    <span className="text-[10px] font-bold text-red-600 uppercase block">This Request</span>
                    <span className="text-base sm:text-lg font-black text-red-600 font-mono block mt-0.5">
                      -{deduction}{isPermission ? ' slot' : 'd'}
                    </span>
                    <span className="text-[10px] text-red-500">Deduction</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-300 shadow-soft-xs ring-2 ring-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Remaining After</span>
                    <span className="text-base sm:text-lg font-black text-emerald-700 font-mono block mt-0.5">
                      {isPermission ? projectedRemaining : `${projectedRemaining}d`}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">New Balance</span>
                  </div>
                </div>

                {/* Other category balances snapshot */}
                <div className="pt-2 border-t border-[#BFDBFE]/60 text-[11px] text-[#475569] flex flex-wrap items-center justify-between gap-1">
                  <span>Other Balances:</span>
                  <span className="font-semibold text-[#123B66]">
                    Casual: {empBalances.casualLeave.available}d • Sick: {empBalances.sickLeave.available}d • Earned: {empBalances.earnedLeave.available}d
                  </span>
                </div>
              </div>

              {/* Admin Approval Remarks */}
              <div className="mt-4">
                <label className="text-xs font-bold text-[#172033] block mb-1">
                  Official Approval Remarks / Audit Note
                </label>
                <input
                  type="text"
                  value={approvalRemark}
                  onChange={(e) => setApprovalRemark(e.target.value)}
                  placeholder="e.g. Leave approved. Deducted from leave balance."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-[#E4EAF1]">
                <button
                  type="button"
                  onClick={() => setApprovingLeave(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-soft-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Confirm & Approve ({isPermission ? '1 Slot' : `${approvingLeave.days} Day(s)`} Deducted)
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reject Remarks Modal with Custom Reason */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E4EAF1] shadow-soft-xl relative">
            <button
              onClick={() => setRejectingItem(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB]"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-base font-extrabold text-[#172033]">
              Reject {rejectingItem.type === 'permission' ? 'Permission' : rejectingItem.type === 'leave' ? 'Leave Application' : 'Attendance Regularization'}
            </h4>
            <p className="text-xs text-[#667085] mt-1">
              Provide an official administrator remark or justification for this rejection to {rejectingItem.name || 'the employee'}.
            </p>

            <div className="mt-4">
              <label className="text-xs font-bold text-[#172033] block mb-1">
                Admin Rejection Remarks
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Incompatible with project shift schedule / insufficient notice provided..."
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-[#E4EAF1]">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-soft-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
