import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { RegularizationRequest } from '../../types';

interface RegularizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export const RegularizationModal: React.FC<RegularizationModalProps> = ({
  isOpen,
  onClose,
  defaultDate = '2026-09-18',
}) => {
  const { user } = useAuth();
  const { applyRegularization } = useAttendance();

  const [date, setDate] = useState(defaultDate);
  const [punchType, setPunchType] = useState<RegularizationRequest['punchType']>('Both (Full Day)');
  const [requestedCheckIn, setRequestedCheckIn] = useState('09:15 AM');
  const [requestedCheckOut, setRequestedCheckOut] = useState('05:45 PM');
  const [category, setCategory] = useState<RegularizationRequest['category']>('Biometric Device Glitch');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      applyRegularization({
        employeeId: user?.employeeId || '',
        employeeName: user?.name || 'Staff Member',
        department: user?.department || 'Mechanical & Mass Calibration',
        avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        date,
        punchType,
        requestedCheckIn,
        requestedCheckOut,
        category,
        reason,
      });

      setIsSubmitting(false);
      setReason('');
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E4EAF1] shadow-soft-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
            Missed Attendance Regularization
          </span>
          <h3 className="text-xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Apply for Attendance Correction
          </h3>
          <p className="text-xs text-[#667085] mt-1 leading-relaxed">
            Missed your biometric punch or worked on-duty? Submit this request. Your attendance will be marked as <span className="font-semibold text-emerald-600">Present</span> once approved by the HR Administrator.
          </p>
        </div>

        {/* Warning Policy Alert */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Admin Approval Required:</strong> Attendance will remain marked as Absent/Incomplete until reviewed and approved by the HR Administrator.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-[#172033] block mb-1">
                Missed Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] block mb-1">
                Missed Punch Type
              </label>
              <select
                value={punchType}
                onChange={(e) => setPunchType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
              >
                <option value="Both (Full Day)">Both (Full Day Missed)</option>
                <option value="Missed Check In">Missed Check In Only</option>
                <option value="Missed Check Out">Missed Check Out Only</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] block mb-1">
                Requested Check In Time
              </label>
              <input
                type="text"
                placeholder="e.g. 09:15 AM"
                value={requestedCheckIn}
                onChange={(e) => setRequestedCheckIn(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3D78C5]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] block mb-1">
                Requested Check Out Time
              </label>
              <input
                type="text"
                placeholder="e.g. 05:45 PM"
                value={requestedCheckOut}
                onChange={(e) => setRequestedCheckOut(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3D78C5]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1">
              Regularization Reason Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
            >
              <option value="Biometric Device Glitch">Biometric Device Glitch / Reader Down</option>
              <option value="On-Duty Client Visit">On-Duty Client Visit / Field Work</option>
              <option value="Forgot Punch">Forgot to Check In / Check Out</option>
              <option value="Network Outage">Network / Campus Wi-Fi Outage</option>
              <option value="Official Travel">Official Travel / Transit</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1">
              Detailed Explanation for Admin
            </label>
            <textarea
              rows={3}
              placeholder="Provide exact context (e.g., Device at Tower B gave timeout error, arrived at 9:15 AM with team lead Vikram)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm text-[#172033] focus:outline-none focus:border-[#3D78C5]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4EAF1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#1a4a7f] shadow-soft-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#F5C542]" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit to Admin for Approval'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
