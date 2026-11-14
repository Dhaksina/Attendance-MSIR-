import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  X,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { LeaveRequest } from '../types';

export const LeaveManagementPage: React.FC = () => {
  const { leaveBalances, leaveRequests, applyLeave, cancelLeaveRequest } = useAttendance();
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState<'Leave' | 'Permission'>('Leave');
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Casual Leave');
  const [fromDate, setFromDate] = useState('2026-10-20');
  const [toDate, setToDate] = useState('2026-10-21');
  const [permFrom, setPermFrom] = useState('02:30 PM');
  const [permTo, setPermTo] = useState('04:30 PM');
  const [reason, setReason] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate day difference
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return Math.max(1, diff || 1);
  };

  const calculatedDays = calculateDays(fromDate, toDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      applyLeave({
        category: requestCategory,
        leaveType: requestCategory === 'Permission' ? 'Official Permission (1-2 Hours)' : leaveType,
        fromDate,
        toDate: requestCategory === 'Permission' ? fromDate : toDate,
        permissionTime: requestCategory === 'Permission' ? `${permFrom} - ${permTo}` : undefined,
        days: requestCategory === 'Permission' ? 0.25 : calculatedDays,
        reason,
        attachmentName: fileName || undefined,
        employeeId: user?.employeeId || '',
        employeeName: user?.name || 'Staff Member',
        department: user?.department || 'General',
        avatarUrl: user?.avatarUrl,
      });
      setIsSubmitting(false);
      setIsModalOpen(false);
      setReason('');
      setFileName('');
    }, 350);
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
            Time-Off Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Leave Management
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 leading-relaxed">
            Monitor accrued paid leave balances, apply for time off, and track managerial approvals.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-[#3D78C5] hover:bg-[#2c65af] shadow-soft-md hover:shadow-soft-lg transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Leave</span>
        </button>
      </div>

      {/* Leave Balance Cards (Casual 8, Sick 5, Earned 12) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {leaveBalances.map((bal) => (
          <div
            key={bal.type}
            className="bg-white rounded-3xl p-6 border border-[#E4EAF1] shadow-soft-xs relative overflow-hidden flex flex-col justify-between"
          >
            {/* Ambient accent stripe */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: bal.color }}
            />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                  {bal.type}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#667085] border border-[#E4EAF1]">
                  Total: {bal.total}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight font-mono">
                  {bal.available}
                </span>
                <span className="text-sm font-semibold text-[#667085]">Available</span>
              </div>

              <p className="text-xs text-[#667085] mt-2">
                {bal.used} days utilized this financial year
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 pt-3 border-t border-[#E4EAF1]/70">
              <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: bal.color,
                    width: `${(bal.available / bal.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leave Policy Notice Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#EAF2FB]/60 border border-[#CBE0F7] flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-[#3D78C5] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#123B66] leading-relaxed">
          <span className="font-bold">Leave Guidelines:</span> Casual leave requests for 2 or more days require submission at least 48 hours in advance. Sick leaves exceeding 2 consecutive days require a certified medical practitioner note.
        </div>
      </div>

      {/* My Leave Requests Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF1]/70">
          <div>
            <h3 className="font-bold text-[#172033] text-base sm:text-lg">My Leave Requests</h3>
            <p className="text-xs text-[#667085] mt-0.5">History of submitted time-off requests</p>
          </div>
          <span className="text-xs font-semibold text-[#667085]">
            {leaveRequests.length} Total Applications
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E4EAF1] text-xs font-bold text-[#667085] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Reason & Notes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAF1]/70">
              {leaveRequests.map((req) => {
                const isPermission = req.category === 'Permission' || req.leaveType.toLowerCase().includes('permission');
                return (
                  <tr key={req.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-4 font-bold text-[#172033] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isPermission ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <Timer className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span>{req.leaveType}</span>
                          <span className="block text-[10px] text-[#667085] font-mono font-normal">
                            Ref: {req.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs text-[#172033] font-medium">
                      {isPermission ? (
                        <div>
                          <span className="font-bold">{req.fromDate}</span>
                          <span className="block text-[11px] text-amber-700 font-mono font-semibold">
                            {req.permissionTime || '02:30 PM - 04:30 PM'}
                          </span>
                        </div>
                      ) : (
                        <span>{req.fromDate} to {req.toDate}</span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                          isPermission ? 'bg-amber-50 text-amber-800' : 'bg-[#EAF2FB] text-[#3D78C5]'
                        }`}
                      >
                        {isPermission ? '2 Hours' : `${req.days} ${req.days === 1 ? 'day' : 'days'}`}
                      </span>
                    </td>

                  <td className="py-4 px-4 text-xs text-[#667085] max-w-xs">
                    <p className="line-clamp-1">{req.reason}</p>
                    {req.attachmentName && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#3D78C5] font-medium mt-1">
                        <FileText className="w-3 h-3" />
                        {req.attachmentName}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    {getStatusBadge(req.status)}
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    {req.status === 'Pending' ? (
                      <button
                        onClick={() => cancelLeaveRequest(req.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-xs text-[#667085]">
                        {req.reviewedBy ? `Reviewed by ${req.reviewedBy}` : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E4EAF1] shadow-soft-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5]">
                New Request
              </span>
              <h3 className="text-xl font-extrabold text-[#172033] tracking-tight mt-1">
                {requestCategory === 'Permission' ? 'Apply for Short Permission' : 'Apply for Leave'}
              </h3>
              <p className="text-xs text-[#667085] mt-1">
                {requestCategory === 'Permission'
                  ? 'Request an authorized 1-2 hour permission window during work hours.'
                  : 'Fill in your leave details for managerial review.'}
              </p>
            </div>

            {/* Category Switcher Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-2xl mt-4">
              <button
                type="button"
                onClick={() => setRequestCategory('Leave')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  requestCategory === 'Leave'
                    ? 'bg-[#123B66] text-white shadow-soft-xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Full-Day Leave</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestCategory('Permission')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  requestCategory === 'Permission'
                    ? 'bg-[#123B66] text-white shadow-soft-xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <Timer className="w-3.5 h-3.5 text-[#F5C542]" />
                <span>Short Permission (1-2 Hours)</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {requestCategory === 'Leave' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#172033] block mb-1.5">Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                    >
                      <option value="Casual Leave">Casual Leave (8 Available)</option>
                      <option value="Sick Leave">Sick Leave (5 Available)</option>
                      <option value="Earned Leave">Earned Leave (12 Available)</option>
                      <option value="Compensatory Off">Compensatory Off</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#172033] block mb-1.5">From Date</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#172033] block mb-1.5">To Date</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#EAF2FB] text-xs text-[#123B66] font-medium flex items-center justify-between">
                    <span>Calculated Working Days:</span>
                    <span className="font-bold font-mono text-sm">{calculatedDays} Day(s)</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#172033] block mb-1.5">Permission Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setToDate(e.target.value);
                      }}
                      required
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#172033] block mb-1.5">From Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 02:30 PM"
                        value={permFrom}
                        onChange={(e) => setPermFrom(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#172033] block mb-1.5">To Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 04:30 PM"
                        value={permTo}
                        onChange={(e) => setPermTo(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span className="font-medium">Requested Permission Duration:</span>
                    <span className="font-bold font-mono">{permFrom} to {permTo} (Up to 2 Hours)</span>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1.5">
                  {requestCategory === 'Permission' ? 'Reason for Permission' : 'Reason for Absence'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    requestCategory === 'Permission'
                      ? 'e.g. Hospital visit / Personal emergency / Bank appointment...'
                      : 'Provide brief context for your supervisor...'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1.5">Attachment (Optional)</label>
                <div className="border-2 border-dashed border-[#E4EAF1] rounded-xl p-3 text-center bg-[#F8FAFC] hover:bg-brand-50 transition-colors cursor-pointer">
                  <Upload className="w-5 h-5 text-[#667085] mx-auto mb-1" />
                  <p className="text-xs text-[#667085]">
                    {fileName ? (
                      <span className="font-bold text-[#3D78C5]">{fileName}</span>
                    ) : (
                      'Click to attach medical slip or leave note (PDF/PNG)'
                    )}
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    id="leaveFile"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setFileName(e.target.files[0].name);
                    }}
                  />
                  <label htmlFor="leaveFile" className="text-xs text-[#3D78C5] font-bold cursor-pointer hover:underline">
                    Browse files
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#1a4b7f] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
