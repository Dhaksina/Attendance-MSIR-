import React, { useState, useMemo, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  ShieldCheck,
  Edit3,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  Award,
  FileText,
  FileCheck2,
  ArrowRight,
  Users,
  Search,
  Filter,
  Eye,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Timer,
  Navigation,
  CheckCircle as CheckCircleIcon,
  XCircle,
  Check,
  Camera,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { PageId, EmployeeDirectoryItem, RegularizationRequest } from '../types';
import { getAssignedEmployeesForManager, isEmployeeAssignedToManager } from '../utils/managerScope';
import { EmployeeLocationModal } from '../components/attendance/EmployeeLocationModal';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
];

interface ProfilePageProps {
  onNavigate?: (page: PageId) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateUserProfile } = useAuth();
  const {
    employees,
    updateEmployee,
    leaveRequests,
    regularizationRequests,
    getEmployeeLeaveBalances,
    approveRegularization,
    rejectRegularization,
    addNotification,
  } = useAttendance();

  // Active Tab: 'details' (Profile Info) | 'team_status' (View Employees & Live Status) | 'regularizations' (Missed Attendance Approvals)
  const [profileTab, setProfileTab] = useState<'details' | 'team_status' | 'regularizations'>('details');

  // Avatar Management Modal
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatarUrl || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState<string>('');
  const [avatarUploadTab, setAvatarUploadTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    designation: user?.designation || '',
    workLocation: user?.workLocation || 'HQ - Tower B, Floor 4 (Hybrid)',
    shift: user?.shift || 'General Shift (09:00 AM - 05:30 PM)',
    avatarUrl: user?.avatarUrl || '',
  });

  // Team Employee Search & Filter
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState<'All' | 'Present' | 'Absent' | 'Late'>('All');

  // Regularization Search & Filter
  const [regularizationStatusFilter, setRegularizationStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [regularizationSearchQuery, setRegularizationSearchQuery] = useState('');

  // Selected Employee for Detailed Current Status Modal
  const [selectedEmployeeStatus, setSelectedEmployeeStatus] = useState<EmployeeDirectoryItem | null>(null);

  // Selected Employee for Geofence Location Map Modal
  const [locationInspectEmp, setLocationInspectEmp] = useState<EmployeeDirectoryItem | null>(null);

  // Regularization Approve / Reject Action Modal
  const [actionRegularizationModal, setActionRegularizationModal] = useState<{
    req: RegularizationRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Check if current user has Manager role or management responsibilities
  const matchingEmp = employees.find(
    (e) => e.employeeId?.toLowerCase() === user?.employeeId?.toLowerCase() || e.fullName === user?.name
  );

  const isManager = Boolean(
    user?.role === 'manager' ||
    user?.isManager ||
    matchingEmp?.isManager ||
    user?.role === 'admin' ||
    user?.designation?.toLowerCase().includes('director') ||
    user?.designation?.toLowerCase().includes('manager') ||
    user?.designation?.toLowerCase().includes('lead') ||
    user?.designation?.toLowerCase().includes('vp') ||
    user?.designation?.toLowerCase().includes('head')
  );

  // Assigned direct report employees for this manager
  const assignedEmployees = useMemo(() => {
    if (!isManager) return [];
    const directReports = getAssignedEmployeesForManager(employees, user?.name || '');
    if (directReports.length > 0) return directReports;
    // Fallback: If no direct reports assigned by exact name match, show departmental colleagues
    return employees.filter((e) => e.fullName !== user?.name);
  }, [employees, user?.name, isManager]);

  // Filtered direct report employees by search query & attendance status
  const filteredTeamEmployees = useMemo(() => {
    return assignedEmployees.filter((emp) => {
      if (teamStatusFilter !== 'All' && emp.todayStatus !== teamStatusFilter) {
        return false;
      }
      if (teamSearchQuery.trim()) {
        const q = teamSearchQuery.toLowerCase();
        const matchName = emp.fullName.toLowerCase().includes(q);
        const matchId = emp.employeeId.toLowerCase().includes(q);
        const matchDesig = emp.designation.toLowerCase().includes(q);
        const matchDept = emp.department.toLowerCase().includes(q);
        return matchName || matchId || matchDesig || matchDept;
      }
      return true;
    });
  }, [assignedEmployees, teamStatusFilter, teamSearchQuery]);

  const presentCount = assignedEmployees.filter((e) => e.todayStatus === 'Present').length;
  const absentCount = assignedEmployees.filter((e) => e.todayStatus === 'Absent').length;
  const lateCount = assignedEmployees.filter((e) => e.todayStatus === 'Late').length;

  // Regularization requests for employees reporting to this manager
  const assignedRegularizations = useMemo(() => {
    if (!isManager) return [];
    const assignedIds = new Set(assignedEmployees.map((e) => e.employeeId.toLowerCase()));
    const assignedNames = new Set(assignedEmployees.map((e) => e.fullName.toLowerCase()));

    const matched = regularizationRequests.filter((r) => {
      if (!r.employeeId && !r.employeeName) return false;
      const matchId = r.employeeId ? assignedIds.has(r.employeeId.toLowerCase()) : false;
      const matchName = r.employeeName ? assignedNames.has(r.employeeName.toLowerCase()) : false;
      return matchId || matchName;
    });

    if (matched.length > 0) return matched;
    // Fallback for demonstration: show all regularization requests if none matched
    return regularizationRequests;
  }, [regularizationRequests, assignedEmployees, isManager]);

  const filteredRegularizations = useMemo(() => {
    return assignedRegularizations.filter((r) => {
      if (regularizationStatusFilter !== 'All' && r.status !== regularizationStatusFilter) {
        return false;
      }
      if (regularizationSearchQuery.trim()) {
        const q = regularizationSearchQuery.toLowerCase();
        const matchName = r.employeeName.toLowerCase().includes(q);
        const matchId = r.employeeId?.toLowerCase().includes(q);
        const matchType = r.punchType.toLowerCase().includes(q);
        const matchCat = r.category?.toLowerCase().includes(q);
        const matchReason = r.reason.toLowerCase().includes(q);
        return matchName || matchId || matchType || matchCat || matchReason;
      }
      return true;
    });
  }, [assignedRegularizations, regularizationStatusFilter, regularizationSearchQuery]);

  const pendingRegularizationCount = useMemo(() => {
    return assignedRegularizations.filter((r) => r.status === 'Pending').length;
  }, [assignedRegularizations]);

  const approvedRegularizationCount = useMemo(() => {
    return assignedRegularizations.filter((r) => r.status === 'Approved').length;
  }, [assignedRegularizations]);

  const rejectedRegularizationCount = useMemo(() => {
    return assignedRegularizations.filter((r) => r.status === 'Rejected').length;
  }, [assignedRegularizations]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = (newAvatarUrl: string) => {
    if (!newAvatarUrl) return;

    // 1. Update user profile in Auth context
    updateUserProfile({ avatarUrl: newAvatarUrl });

    // 2. Update employee directory in Attendance context
    const targetEmp = employees.find(
      (e) =>
        e.id === user?.id ||
        e.employeeId?.toLowerCase() === user?.employeeId?.toLowerCase() ||
        e.fullName.toLowerCase() === user?.name?.toLowerCase()
    );
    if (targetEmp) {
      updateEmployee(targetEmp.id, { avatarUrl: newAvatarUrl });
    }

    // 3. Store in msir_custom_avatars for instant lookup in Login Page
    try {
      const ca = JSON.parse(localStorage.getItem('msir_custom_avatars') || '{}');
      if (user?.employeeId) {
        ca[user.employeeId.toUpperCase()] = newAvatarUrl;
      }
      if (user?.email) {
        ca[user.email.toLowerCase()] = newAvatarUrl;
      }
      localStorage.setItem('msir_custom_avatars', JSON.stringify(ca));
    } catch {}

    // 4. Update local directory item in localStorage directly
    try {
      const raw = localStorage.getItem('msir_employees_directory');
      if (raw) {
        const dir = JSON.parse(raw);
        const updated = dir.map((item: any) => {
          if (
            item.id === user?.id ||
            item.employeeId?.toLowerCase() === user?.employeeId?.toLowerCase() ||
            item.fullName.toLowerCase() === user?.name?.toLowerCase()
          ) {
            return { ...item, avatarUrl: newAvatarUrl };
          }
          return item;
        });
        localStorage.setItem('msir_employees_directory', JSON.stringify(updated));
      }
    } catch {}

    setFormData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
    setSuccessBanner('Profile photo updated successfully! Your updated image will now appear across your profile and login screen.');
    setIsAvatarModalOpen(false);
    addNotification('Photo Updated', 'Your profile image has been updated successfully.', 'system');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(formData);
    addNotification('Profile Updated', 'Your profile details were updated successfully.', 'system');
    setIsEditModalOpen(false);
  };

  // Regularization Approval Action Handlers
  const handleOpenActionModal = (req: RegularizationRequest, action: 'approve' | 'reject') => {
    setActionRegularizationModal({ req, action });
    setActionRemarks(
      action === 'approve'
        ? `Approved by Reporting Manager (${user?.name || 'Manager'}). Biometric attendance regularized.`
        : `Discrepancy with access logs. Rejected by Reporting Manager (${user?.name || 'Manager'}).`
    );
  };

  const handleConfirmAction = () => {
    if (!actionRegularizationModal) return;
    const { req, action } = actionRegularizationModal;
    const finalRemarks = actionRemarks.trim() || (action === 'approve' ? 'Approved by Reporting Manager' : 'Rejected by Manager');

    if (action === 'approve') {
      approveRegularization(req.id, finalRemarks, user?.name || 'Reporting Manager');
      setSuccessBanner(
        `Missed attendance for ${req.employeeName} on ${req.date} was approved and regularized to Present!`
      );
    } else {
      rejectRegularization(req.id, finalRemarks, user?.name || 'Reporting Manager');
      setSuccessBanner(
        `Attendance regularization for ${req.employeeName} on ${req.date} was rejected.`
      );
    }

    setActionRegularizationModal(null);
    setActionRemarks('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Success Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-soft-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#123B66] via-[#1b4b7d] to-[#3D78C5] rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative group flex-shrink-0">
              <img
                src={user?.avatarUrl}
                alt={user?.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white/20 shadow-soft-lg group-hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => {
                  setAvatarPreview(user?.avatarUrl || '');
                  setIsAvatarModalOpen(true);
                }}
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white ring-2 ring-emerald-500/30" />
              <button
                type="button"
                onClick={() => {
                  setAvatarPreview(user?.avatarUrl || '');
                  setIsAvatarModalOpen(true);
                }}
                className="absolute inset-0 rounded-3xl bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 shadow-inner border-2 border-white/30"
                title="Change Profile Photo"
              >
                <Camera className="w-6 h-6 text-white drop-shadow" />
                <span className="text-[10px] font-bold tracking-wider uppercase drop-shadow">Edit Photo</span>
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 font-mono">
                  EMP ID: {user?.employeeId}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F5C542] text-[#123B66]">
                  {user?.status}
                </span>
                {isManager && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-amber-300" />
                    <span>Reporting Manager ({assignedEmployees.length} Direct Reports)</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
                {user?.name}
              </h2>
              <p className="text-sm text-white/80 font-medium">{user?.designation}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-white/70 mt-3">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#F5C542]" />
                  {user?.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-300" />
                  {user?.workLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons in Banner */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 self-center sm:self-auto">
            {isManager && (
              <>
                <button
                  type="button"
                  onClick={() => setProfileTab('team_status')}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-soft-md transition-all flex items-center gap-2 ${
                    profileTab === 'team_status'
                      ? 'bg-[#F5C542] text-[#123B66] hover:bg-[#fad875] ring-2 ring-white/50'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/30'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>View Employees Status</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/25 text-inherit font-bold">
                    {assignedEmployees.length}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>

                <button
                  type="button"
                  onClick={() => setProfileTab('regularizations')}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-soft-md transition-all flex items-center gap-2 ${
                    profileTab === 'regularizations'
                      ? 'bg-[#F5C542] text-[#123B66] hover:bg-[#fad875] ring-2 ring-white/50'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/30'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Approve Regularization</span>
                  {pendingRegularizationCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                      {pendingRegularizationCount}
                    </span>
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setAvatarPreview(user?.avatarUrl || '');
                setIsAvatarModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-white/15 hover:bg-white/25 border border-white/25 shadow-soft-xs transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#F5C542]" />
              <span>Change Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-[#123B66] bg-white hover:bg-white/90 shadow-soft-md transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-[#3D78C5]" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manager Profile Tab Navigation (Profile Info vs Employee Status vs Regularizations) */}
      {isManager && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setProfileTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              profileTab === 'details'
                ? 'bg-[#123B66] text-white shadow-soft-xs'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <User className="w-4 h-4 text-[#F5C542]" />
            <span>Profile Information</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileTab('team_status')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              profileTab === 'team_status'
                ? 'bg-[#123B66] text-white shadow-soft-xs'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Users className="w-4 h-4 text-[#3D78C5]" />
            <span>View Employees & Current Status</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-inherit font-bold">
              {assignedEmployees.length}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setProfileTab('regularizations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              profileTab === 'regularizations'
                ? 'bg-[#123B66] text-white shadow-soft-xs'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Missed Attendance Regularization</span>
            {pendingRegularizationCount > 0 ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold animate-pulse">
                {pendingRegularizationCount} Pending
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-[#667085] font-bold">
                {assignedRegularizations.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW A: PROFILE INFORMATION TAB                                 */}
      {/* ============================================================== */}
      {profileTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left Column: Employment & Personal Details */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs">
              <h3 className="font-bold text-[#172033] text-base sm:text-lg pb-4 border-b border-[#E4EAF1]/70">
                Employment Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs text-[#667085] font-medium block">Full Name</span>
                  <span className="text-sm font-bold text-[#172033] mt-0.5 block">{user?.name}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs text-[#667085] font-medium block">Employee ID</span>
                  <span className="text-sm font-bold font-mono text-[#3D78C5] mt-0.5 block">
                    {user?.employeeId}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs text-[#667085] font-medium block">Designation</span>
                  <span className="text-sm font-bold text-[#172033] mt-0.5 block">{user?.designation}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs text-[#667085] font-medium block">Department</span>
                  <span className="text-sm font-bold text-[#172033] mt-0.5 block">{user?.department}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs text-[#667085] font-medium block">Joining Date</span>
                  <span className="text-sm font-bold text-[#172033] mt-0.5 block">{user?.joiningDate}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs text-[#667085] font-medium block">Reporting Manager</span>
                  <span className="text-sm font-bold text-[#172033] mt-0.5 block">{user?.manager}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs text-[#667085] font-medium block">Official Work Email</span>
                  <span className="text-sm font-bold text-[#172033] mt-0.5 block">{user?.email}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs text-[#667085] font-medium block">Contact Number</span>
                  <span className="text-sm font-bold text-[#172033] mt-0.5 block">{user?.phone}</span>
                </div>
              </div>
            </div>

            {/* Shift & Attendance Policy Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs">
              <h3 className="font-bold text-[#172033] text-base sm:text-lg pb-4 border-b border-[#E4EAF1]/70">
                Shift & Geofence Policy
              </h3>

              <div className="space-y-4 pt-5">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EAF2FB] text-[#3D78C5] flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172033]">Allocated Shift</p>
                      <p className="text-xs text-[#667085]">{user?.shift}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    Fixed General
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172033]">Office Geofence Radius</p>
                      <p className="text-xs text-[#667085]">Campus HQ: 150m GPS boundary verified</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-[#3D78C5]">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Manager Direct Reports Widget / Trainee Badges */}
          <div className="lg:col-span-4 space-y-6">
            {/* If Manager: Show Direct Reports Current Status Summary Card */}
            {isManager ? (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF1]/70">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#123B66]" />
                    <h3 className="font-bold text-[#172033] text-base">Direct Reports Status</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAF2FB] text-[#123B66]">
                    {assignedEmployees.length} Total
                  </span>
                </div>

                {/* Pending Regularization Alert Callout */}
                {pendingRegularizationCount > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-amber-800">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Missed Attendance Requests</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                        {pendingRegularizationCount} Pending
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Employees missed punching and have submitted attendance regularization for your approval.
                    </p>
                    <button
                      type="button"
                      onClick={() => setProfileTab('regularizations')}
                      className="w-full py-1.5 bg-[#123B66] text-white text-xs font-bold rounded-xl hover:bg-[#1a4b7f] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Approve Missed Attendance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Quick Status KPI Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <span className="text-xs font-bold text-emerald-700 block">Present</span>
                    <span className="text-base font-extrabold text-emerald-800 font-mono mt-0.5 block">
                      {presentCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-center">
                    <span className="text-xs font-bold text-red-700 block">Absent</span>
                    <span className="text-base font-extrabold text-red-800 font-mono mt-0.5 block">
                      {absentCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
                    <span className="text-xs font-bold text-amber-700 block">Late</span>
                    <span className="text-base font-extrabold text-amber-800 font-mono mt-0.5 block">
                      {lateCount}
                    </span>
                  </div>
                </div>

                {/* Direct Reports Mini Roster */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
                    Assigned Team Members Today
                  </span>
                  <div className="divide-y divide-[#E4EAF1]/70 max-h-48 overflow-y-auto pr-1">
                    {assignedEmployees.slice(0, 5).map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployeeStatus(emp)}
                        className="py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#F8FAFC] rounded-lg px-1 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className="w-7 h-7 rounded-full object-cover border border-[#E4EAF1] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#172033] truncate">{emp.fullName}</p>
                            <p className="text-[10px] text-[#667085] truncate">{emp.designation}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            emp.todayStatus === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emp.todayStatus === 'Late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {emp.todayStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Button to switch to Full Team Status Tab */}
                <button
                  type="button"
                  onClick={() => setProfileTab('team_status')}
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#123B66] hover:bg-[#194c80] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-soft-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View All Employee Current Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs">
                <h3 className="font-bold text-[#172033] text-base pb-3 border-b border-[#E4EAF1]/70">
                  Onboarding & Probation
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <span className="text-xs font-bold text-amber-800 block">
                      Status: On Probation (6 Months)
                    </span>
                    <p className="text-xs text-amber-700 mt-1">
                      Confirmation review scheduled on 15 Jul 2026 with mentor Vikram Anand.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#172033]">
                      <span>Probation Progress</span>
                      <span>75%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E2E8F0] mt-2 overflow-hidden">
                      <div className="bg-[#123B66] h-full rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills & Badges */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs">
              <h3 className="font-bold text-[#172033] text-base pb-3 border-b border-[#E4EAF1]/70">
                {isManager ? 'Leadership & Core Competencies' : 'Skills & Badges'}
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                {isManager ? (
                  <>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#EAF2FB] text-[#3D78C5]">
                      Technical Leadership
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#EAF2FB] text-[#3D78C5]">
                      Engineering Architecture
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#EAF2FB] text-[#3D78C5]">
                      Team Management
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#EAF2FB] text-[#3D78C5]">
                      ISO/IEC 17025 Compliance
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#FEF9C3] text-yellow-800 font-bold">
                      ⭐ Senior Calibrations Director
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#EAF2FB] text-[#3D78C5]">
                      React & TypeScript
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#EAF2FB] text-[#3D78C5]">
                      Tailwind CSS
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#EAF2FB] text-[#3D78C5]">
                      REST & GraphQL
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#EAF2FB] text-[#3D78C5]">
                      Biometric API Sync
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#FEF9C3] text-yellow-800 font-bold">
                      ⭐ Star Trainee Q2
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW B: VIEW EMPLOYEES & CURRENT STATUS TAB                    */}
      {/* ============================================================== */}
      {profileTab === 'team_status' && isManager && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Title & Description */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-3xl border border-[#E4EAF1] shadow-soft-xs">
            <div>
              <h3 className="text-lg font-black text-[#172033] tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-[#123B66]" />
                <span>Assigned Employees Current Status</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Live attendance punches, geofence GPS compliance, and today's work status for staff reporting to{' '}
                <strong className="text-[#123B66]">{user?.name}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {pendingRegularizationCount > 0 && (
                <button
                  type="button"
                  onClick={() => setProfileTab('regularizations')}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-soft-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{pendingRegularizationCount} Missed Attendance Pending</span>
                </button>
              )}
              <span className="text-xs font-bold text-[#123B66] bg-[#EAF2FB] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Status Synchronized</span>
              </span>
            </div>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085]">Total Assigned</span>
                <div className="w-8 h-8 rounded-xl bg-[#EAF2FB] text-[#3D78C5] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#172033] mt-2 font-mono">
                {assignedEmployees.length}
              </p>
              <span className="text-[11px] text-[#667085]">Direct team members</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700">Present Today</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">{presentCount}</p>
              <span className="text-[11px] text-emerald-700">
                {assignedEmployees.length > 0
                  ? `${Math.round((presentCount / assignedEmployees.length) * 100)}% attendance rate`
                  : 'No employees assigned'}
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-600">Absent Today</span>
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-red-600 mt-2 font-mono">{absentCount}</p>
              <span className="text-[11px] text-red-600">Pending punch or on leave</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600">Late Arrivals</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2 font-mono">{lateCount}</p>
              <span className="text-[11px] text-amber-700">Punched after 09:30 AM</span>
            </div>
          </div>

          {/* Search Bar & Status Filter Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]" />
              <input
                type="text"
                placeholder="Search employees by name, ID, or designation..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-colors"
              />
              {teamSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTeamSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl">
              {(['All', 'Present', 'Absent', 'Late'] as const).map((filter) => {
                const count =
                  filter === 'All'
                    ? assignedEmployees.length
                    : filter === 'Present'
                    ? presentCount
                    : filter === 'Absent'
                    ? absentCount
                    : lateCount;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTeamStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      teamStatusFilter === filter
                        ? 'bg-[#123B66] text-white shadow-soft-xs'
                        : 'text-[#667085] hover:text-[#172033]'
                    }`}
                  >
                    <span>{filter}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-inherit">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Employee Status Grid */}
          {filteredTeamEmployees.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E4EAF1] shadow-soft-xs space-y-3">
              <Users className="w-10 h-10 text-[#667085]/50 mx-auto" />
              <h4 className="text-sm font-bold text-[#172033]">No Employees Found</h4>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                No assigned employees match your current search query or status filter.
              </p>
              {teamSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setTeamSearchQuery('');
                    setTeamStatusFilter('All');
                  }}
                  className="px-4 py-2 bg-[#EAF2FB] text-[#123B66] rounded-xl text-xs font-bold hover:bg-[#d5e5f7] transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTeamEmployees.map((emp) => {
                const isPresent = emp.todayStatus === 'Present';
                const isLate = emp.todayStatus === 'Late';
                const isAbsent = emp.todayStatus === 'Absent';

                // Check if this employee has a pending regularization request
                const pendingReg = regularizationRequests.find(
                  (r) =>
                    (r.employeeId?.toLowerCase() === emp.employeeId.toLowerCase() ||
                      r.employeeName.toLowerCase() === emp.fullName.toLowerCase()) &&
                    r.status === 'Pending'
                );

                return (
                  <div
                    key={emp.id}
                    className="bg-white rounded-3xl p-5 border border-[#E4EAF1] hover:border-[#3D78C5]/50 transition-all shadow-soft-xs hover:shadow-soft-md space-y-4 flex flex-col justify-between"
                  >
                    {/* Top Row: Avatar, Name, Employee ID & Role */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className="w-12 h-12 rounded-2xl object-cover border border-[#E4EAF1]"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              isPresent
                                ? 'bg-emerald-500'
                                : isLate
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#172033] leading-tight">
                              {emp.fullName}
                            </h4>
                            {emp.isManager && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Manager
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono font-bold text-[#3D78C5] block mt-0.5">
                            ID: {emp.employeeId}
                          </span>
                          <p className="text-xs text-[#667085] truncate max-w-[180px]">
                            {emp.designation}
                          </p>
                        </div>
                      </div>

                      {/* Current Status Badge */}
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0 ${
                          isPresent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isLate
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPresent ? 'bg-emerald-500' : isLate ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        />
                        <span>{emp.todayStatus}</span>
                      </span>
                    </div>

                    {/* Pending Regularization Tag if Employee Missed Punch */}
                    {pendingReg && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 animate-pulse" />
                          <span className="text-[11px] font-bold text-amber-900 truncate">
                            Missed Punch ({pendingReg.date})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(pendingReg, 'approve')}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-colors flex-shrink-0"
                        >
                          Approve
                        </button>
                      </div>
                    )}

                    {/* Today's Punch & Timings Box */}
                    <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#667085] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#3D78C5]" />
                          <span>Today's Punch:</span>
                        </span>
                        <span className="font-bold font-mono text-[#172033]">
                          {isPresent || isLate
                            ? `Checked In: ${emp.todayCheckIn || '09:00 AM'}`
                            : 'Not Punched Today'}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-[#E4EAF1]/70">
                        <span className="text-[#667085] flex items-center gap-1 flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>Location:</span>
                        </span>
                        <span className="font-medium text-[#172033] text-right truncate">
                          {emp.todayLocation || 'Science & Industrial Resources, Chromepet'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#E4EAF1]/70">
                        <span className="text-[#667085] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Geofence:</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            emp.geofenceEnabled !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-[#667085]'
                          }`}
                        >
                          {emp.geofenceEnabled !== false ? '2km Active' : 'Exempted Remote'}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions: View Full Current Status Modal & Map Inspection */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeStatus(emp)}
                        className="flex-1 py-2 px-3 bg-[#123B66] hover:bg-[#1a4b7f] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-soft-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#F5C542]" />
                        <span>View Employee Status</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLocationInspectEmp(emp)}
                        title="View Geofence & Location on Map"
                        className="p-2 bg-[#EAF2FB] hover:bg-[#d5e5f7] text-[#123B66] rounded-xl transition-colors"
                      >
                        <Navigation className="w-4 h-4 text-[#3D78C5]" />
                      </button>

                      <a
                        href={`mailto:${emp.email}`}
                        title={`Email ${emp.fullName}`}
                        className="p-2 bg-[#F8FAFC] hover:bg-[#EAF2FB] text-[#667085] hover:text-[#123B66] rounded-xl border border-[#E4EAF1] transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW C: MISSED ATTENDANCE REGULARIZATION APPROVALS TAB          */}
      {/* (User Request: Employee missed attendance, manager approves     */}
      {/*  regularization in Manager Profile)                             */}
      {/* ============================================================== */}
      {profileTab === 'regularizations' && isManager && (
        <div className="space-y-6 animate-fade-in">
          {/* Section Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-3xl border border-[#E4EAF1] shadow-soft-xs">
            <div>
              <h3 className="text-lg font-black text-[#172033] tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Missed Attendance Regularization Approvals</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Review and approve missed check-in/out regularizations for employees reporting to{' '}
                <strong className="text-[#123B66]">{user?.name}</strong>. Approving marks the attendance as Present.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{pendingRegularizationCount} Awaiting Review</span>
              </span>
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085]">Total Requests</span>
                <div className="w-8 h-8 rounded-xl bg-[#EAF2FB] text-[#3D78C5] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#172033] mt-2 font-mono">
                {assignedRegularizations.length}
              </p>
              <span className="text-[11px] text-[#667085]">All regularization records</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700">Pending Approvals</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2 font-mono">
                {pendingRegularizationCount}
              </p>
              <span className="text-[11px] text-amber-700">Awaiting your approval</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700">Approved &amp; Present</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
                {approvedRegularizationCount}
              </p>
              <span className="text-[11px] text-emerald-700">Regularized to Present</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-600">Rejected Requests</span>
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-red-600 mt-2 font-mono">
                {rejectedRegularizationCount}
              </p>
              <span className="text-[11px] text-red-600">Discrepancy / denied</span>
            </div>
          </div>

          {/* Search Bar & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E4EAF1] shadow-soft-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]" />
              <input
                type="text"
                placeholder="Search by employee name, ID, or incident reason..."
                value={regularizationSearchQuery}
                onChange={(e) => setRegularizationSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-colors"
              />
              {regularizationSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRegularizationSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((filter) => {
                const count =
                  filter === 'All'
                    ? assignedRegularizations.length
                    : filter === 'Pending'
                    ? pendingRegularizationCount
                    : filter === 'Approved'
                    ? approvedRegularizationCount
                    : rejectedRegularizationCount;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setRegularizationStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      regularizationStatusFilter === filter
                        ? 'bg-[#123B66] text-white shadow-soft-xs'
                        : 'text-[#667085] hover:text-[#172033]'
                    }`}
                  >
                    <span>{filter}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-inherit">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regularization Requests List */}
          {filteredRegularizations.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E4EAF1] shadow-soft-xs space-y-3">
              <Clock className="w-10 h-10 text-[#667085]/50 mx-auto" />
              <h4 className="text-sm font-bold text-[#172033]">No Regularization Requests Found</h4>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                No missed attendance regularization requests match your selected status filter.
              </p>
              {regularizationSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setRegularizationSearchQuery('');
                    setRegularizationStatusFilter('All');
                  }}
                  className="px-4 py-2 bg-[#EAF2FB] text-[#123B66] rounded-xl text-xs font-bold hover:bg-[#d5e5f7] transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRegularizations.map((req) => {
                const isPending = req.status === 'Pending';
                const isApproved = req.status === 'Approved';
                const isRejected = req.status === 'Rejected';

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E4EAF1] hover:border-[#3D78C5]/50 transition-all shadow-soft-xs hover:shadow-soft-md space-y-4"
                  >
                    {/* Top Row: Employee Avatar, Name, Date, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4EAF1]/70">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={req.employeeName}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#E4EAF1]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-[#172033]">
                              {req.employeeName}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-[#3D78C5]">
                              {req.employeeId}
                            </span>
                          </div>
                          <p className="text-xs text-[#667085]">{req.department}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <span className="text-[11px] text-[#667085] block">Submitted</span>
                          <span className="text-xs font-mono font-bold text-[#172033]">
                            {req.appliedDate}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                          />
                          <span>{req.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Middle Grid: Missed Punch Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] text-xs">
                      <div>
                        <span className="text-[#667085] text-[11px] block">Missed Attendance Date</span>
                        <span className="font-bold font-mono text-[#172033] block mt-0.5">
                          {req.date}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#667085] text-[11px] block">Punch Type</span>
                        <span className="font-bold text-[#123B66] block mt-0.5">{req.punchType}</span>
                      </div>

                      <div>
                        <span className="text-[#667085] text-[11px] block">Requested Working Hours</span>
                        <span className="font-bold font-mono text-[#172033] block mt-0.5">
                          {req.requestedCheckIn} - {req.requestedCheckOut}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#667085] text-[11px] block">Incident Category</span>
                        <span className="font-medium text-[#172033] block mt-0.5">
                          {req.category || 'Forgot Punch'}
                        </span>
                      </div>
                    </div>

                    {/* Employee Explanation Reason */}
                    <div className="p-3.5 rounded-2xl bg-[#EAF2FB]/50 border border-[#3D78C5]/20 text-xs">
                      <span className="text-[11px] font-bold text-[#123B66] block mb-1">
                        Employee's Reason for Missed Punch:
                      </span>
                      <p className="text-[#172033] italic leading-relaxed">"{req.reason}"</p>
                    </div>

                    {/* Reviewer remarks if already processed */}
                    {!isPending && req.adminRemarks && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#667085]">
                          <span>Reviewed by: <strong>{req.reviewedBy || 'Manager'}</strong></span>
                          {req.reviewedAt && <span>{req.reviewedAt}</span>}
                        </div>
                        <p className="text-[#172033] font-medium">Remarks: {req.adminRemarks}</p>
                      </div>
                    )}

                    {/* Action Buttons for Pending Requests */}
                    {isPending && (
                      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(req, 'reject')}
                          className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject Request</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(req, 'approve')}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-soft-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve &amp; Mark Present</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ACTION CONFIRMATION MODAL (APPROVE / REJECT REGULARIZATION)     */}
      {/* ============================================================== */}
      {actionRegularizationModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E4EAF1] shadow-soft-xl relative space-y-4">
            <button
              type="button"
              onClick={() => setActionRegularizationModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  actionRegularizationModal.action === 'approve' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                Manager Regularization Action
              </span>
              <h3 className="text-lg font-extrabold text-[#172033] tracking-tight mt-0.5">
                {actionRegularizationModal.action === 'approve'
                  ? 'Approve Missed Attendance'
                  : 'Reject Regularization Request'}
              </h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Employee:</span>
                <span className="font-bold text-[#172033]">
                  {actionRegularizationModal.req.employeeName} ({actionRegularizationModal.req.employeeId})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Missed Punch Date:</span>
                <span className="font-mono font-bold text-[#172033]">
                  {actionRegularizationModal.req.date}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Timings to Regularize:</span>
                <span className="font-mono font-bold text-[#3D78C5]">
                  {actionRegularizationModal.req.requestedCheckIn} - {actionRegularizationModal.req.requestedCheckOut}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] block mb-1.5">
                Manager Remarks / Verification Note
              </label>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Enter remarks for the employee attendance record..."
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E4EAF1]">
              <button
                type="button"
                onClick={() => setActionRegularizationModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#667085] hover:text-[#172033] rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-colors shadow-soft-xs flex items-center gap-1.5 ${
                  actionRegularizationModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionRegularizationModal.action === 'approve' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Mark Present</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DETAILED EMPLOYEE CURRENT STATUS MODAL                          */}
      {/* ============================================================== */}
      {selectedEmployeeStatus && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E4EAF1] shadow-soft-xl relative max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E4EAF1]">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedEmployeeStatus.avatarUrl}
                  alt={selectedEmployeeStatus.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#E4EAF1]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-[#172033]">
                      {selectedEmployeeStatus.fullName}
                    </h3>
                    {selectedEmployeeStatus.isManager && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Manager
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-[#3D78C5]">
                    ID: {selectedEmployeeStatus.employeeId}
                  </span>
                  <p className="text-xs text-[#667085] font-medium mt-0.5">
                    {selectedEmployeeStatus.designation} • {selectedEmployeeStatus.department}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployeeStatus(null)}
                className="p-1.5 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Check for Pending Regularization for this specific Employee */}
            {(() => {
              const pendingReg = regularizationRequests.find(
                (r) =>
                  (r.employeeId?.toLowerCase() === selectedEmployeeStatus.employeeId.toLowerCase() ||
                    r.employeeName.toLowerCase() === selectedEmployeeStatus.fullName.toLowerCase()) &&
                  r.status === 'Pending'
              );

              if (pendingReg) {
                return (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Pending Missed Attendance Regularization</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                        Action Required
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/70 p-2.5 rounded-xl border border-amber-200">
                      <div>
                        <span className="text-[#667085] block">Missed Date</span>
                        <span className="font-bold font-mono text-[#172033]">{pendingReg.date}</span>
                      </div>
                      <div>
                        <span className="text-[#667085] block">Requested Hours</span>
                        <span className="font-bold font-mono text-[#172033]">
                          {pendingReg.requestedCheckIn} - {pendingReg.requestedCheckOut}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-amber-200/50">
                        <span className="text-[#667085] block">Reason:</span>
                        <p className="text-[#172033] italic mt-0.5">"{pendingReg.reason}"</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeStatus(null);
                          handleOpenActionModal(pendingReg, 'reject');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeStatus(null);
                          handleOpenActionModal(pendingReg, 'approve');
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1 shadow-soft-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve &amp; Mark Present</span>
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Live Today Attendance Status Banner */}
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                selectedEmployeeStatus.todayStatus === 'Present'
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : selectedEmployeeStatus.todayStatus === 'Late'
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'bg-red-50/80 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedEmployeeStatus.todayStatus === 'Present'
                        ? 'bg-emerald-500 animate-pulse'
                        : selectedEmployeeStatus.todayStatus === 'Late'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span>Today's Attendance Status</span>
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    selectedEmployeeStatus.todayStatus === 'Present'
                      ? 'bg-emerald-600 text-white'
                      : selectedEmployeeStatus.todayStatus === 'Late'
                      ? 'bg-amber-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {selectedEmployeeStatus.todayStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[11px] text-[#667085] block">Punch In Time</span>
                  <span className="font-mono font-bold text-[#172033]">
                    {selectedEmployeeStatus.todayCheckIn || 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#667085] block">Location Verification</span>
                  <span className="font-semibold text-[#172033] truncate block">
                    {selectedEmployeeStatus.todayLocationType || 'Office Campus'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="text-[#667085] text-[11px] truncate max-w-[260px]">
                  {selectedEmployeeStatus.todayLocation || 'Science & Industrial Resources, Chromepet, Tambaram'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLocationInspectEmp(selectedEmployeeStatus);
                  }}
                  className="text-xs font-bold text-[#123B66] hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#3D78C5]" />
                  <span>View Map</span>
                </button>
              </div>
            </div>

            {/* Employment & Policy Information */}
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
                Employment & Allocation
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-[#667085] text-[11px] block">Reporting Manager</span>
                  <span className="font-bold text-[#172033] block mt-0.5">
                    {selectedEmployeeStatus.manager || user?.name}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-[#667085] text-[11px] block">Joining Date</span>
                  <span className="font-bold text-[#172033] block mt-0.5">
                    {selectedEmployeeStatus.joiningDate}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-[#667085] text-[11px] block">Official Email</span>
                  <a
                    href={`mailto:${selectedEmployeeStatus.email}`}
                    className="font-medium text-[#3D78C5] hover:underline block mt-0.5 truncate"
                  >
                    {selectedEmployeeStatus.email}
                  </a>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-[#667085] text-[11px] block">Contact Phone</span>
                  <a
                    href={`tel:${selectedEmployeeStatus.phone}`}
                    className="font-medium text-[#172033] hover:underline block mt-0.5"
                  >
                    {selectedEmployeeStatus.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Employee Leave Quota Balances */}
            {(() => {
              const balances = getEmployeeLeaveBalances(selectedEmployeeStatus.employeeId);
              return (
                <div className="space-y-2 text-xs pt-1">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
                    Remaining Leave & Permission Quota
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E4EAF1] text-center">
                      <span className="text-[10px] font-semibold text-[#667085] block">Casual</span>
                      <span className="text-sm font-extrabold text-[#172033] font-mono mt-0.5 block">
                        {balances.casualLeave.available}
                      </span>
                      <span className="text-[9px] text-[#667085]">/{balances.casualLeave.total} left</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E4EAF1] text-center">
                      <span className="text-[10px] font-semibold text-[#667085] block">Sick</span>
                      <span className="text-sm font-extrabold text-[#172033] font-mono mt-0.5 block">
                        {balances.sickLeave.available}
                      </span>
                      <span className="text-[9px] text-[#667085]">/{balances.sickLeave.total} left</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E4EAF1] text-center">
                      <span className="text-[10px] font-semibold text-[#667085] block">Earned</span>
                      <span className="text-sm font-extrabold text-[#172033] font-mono mt-0.5 block">
                        {balances.earnedLeave.available}
                      </span>
                      <span className="text-[9px] text-[#667085]">/{balances.earnedLeave.total} left</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E4EAF1] text-center">
                      <span className="text-[10px] font-semibold text-[#667085] block">Permissions</span>
                      <span className="text-sm font-extrabold text-[#3D78C5] font-mono mt-0.5 block">
                        {balances.permissionsRemaining}
                      </span>
                      <span className="text-[9px] text-[#667085]">/{balances.permissionsTotal} slots</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4EAF1]">
              <button
                type="button"
                onClick={() => setSelectedEmployeeStatus(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#172033] rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geofence Location Map Modal */}
      <EmployeeLocationModal
        isOpen={Boolean(locationInspectEmp)}
        onClose={() => setLocationInspectEmp(null)}
        employee={locationInspectEmp}
      />

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E4EAF1] shadow-soft-xl relative">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5]">
                Update Information
              </span>
              <h3 className="text-xl font-extrabold text-[#172033] tracking-tight mt-1">
                Edit Profile
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-6">
              {/* Profile Photo Thumbnail & Quick Change */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                <div className="relative flex-shrink-0">
                  <img
                    src={formData.avatarUrl || user?.avatarUrl}
                    alt={user?.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-soft-xs"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#172033]">Profile Image</p>
                  <p className="text-[11px] text-[#667085]">Used for portal and login authentication</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview(formData.avatarUrl || user?.avatarUrl || '');
                    setIsAvatarModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#3D78C5] hover:bg-blue-50/50 text-[#123B66] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-[#3D78C5]" />
                  <span>Change</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">Work Location</label>
                <input
                  type="text"
                  value={formData.workLocation}
                  onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#1a4b7f] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Profile Photo Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E4EAF1] shadow-soft-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3D78C5]">
                <Camera className="w-4 h-4 text-[#3D78C5]" />
                <span>Employee Identity</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#172033] tracking-tight mt-1">
                Change Profile Photo
              </h3>
              <p className="text-xs text-[#667085] mt-1">
                Customize your personal avatar. Changes immediately sync to your employee portal, header, and login screen.
              </p>
            </div>

            {/* Current Active Preview */}
            <div className="my-6 p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] border border-[#E4EAF1] flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <img
                  src={avatarPreview || user?.avatarUrl}
                  alt={user?.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-soft-md"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20" />
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-xs font-bold text-[#172033] truncate">{user?.name}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[#123B66]">
                    {user?.employeeId}
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] truncate mt-0.5">{user?.designation}</p>
                <p className="text-[10px] text-[#3D78C5] font-semibold mt-1">
                  Preview of your updated photo
                </p>
              </div>
            </div>

            {/* Tabs for Upload Method */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAvatarUploadTab('upload')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  avatarUploadTab === 'upload'
                    ? 'bg-white text-[#123B66] shadow-soft-2xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarUploadTab('presets')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  avatarUploadTab === 'presets'
                    ? 'bg-white text-[#123B66] shadow-soft-2xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F5C542]" />
                <span>Choose Avatar</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarUploadTab('url')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  avatarUploadTab === 'url'
                    ? 'bg-white text-[#123B66] shadow-soft-2xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
            </div>

            {/* Tab 1: Upload from Device */}
            {avatarUploadTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#CBD5E1] hover:border-[#3D78C5] bg-[#F8FAFC] hover:bg-blue-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-[#EAF2FB] border border-[#E4EAF1] shadow-soft-xs flex items-center justify-center transition-colors">
                    <Upload className="w-6 h-6 text-[#3D78C5]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#172033]">
                      Click to upload an image from your computer
                    </p>
                    <p className="text-[11px] text-[#667085] mt-0.5">
                      Supports JPG, PNG, WEBP • Max file size: 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Curated Presets */}
            {avatarUploadTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-[11px] text-[#667085] font-medium">
                  Select a professional executive portrait:
                </p>
                <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1">
                  {AVATAR_PRESETS.map((url, index) => {
                    const isSelected = avatarPreview === url;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAvatarPreview(url)}
                        className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all group ${
                          isSelected
                            ? 'border-[#3D78C5] ring-2 ring-[#3D78C5]/30 scale-95 shadow-soft-md'
                            : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Preset avatar ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#123B66]/40 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Image URL */}
            {avatarUploadTab === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Image Direct URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (avatarUrlInput.trim()) {
                          setAvatarPreview(avatarUrlInput.trim());
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#123B66] text-white text-xs font-bold hover:bg-[#1a4b7f] transition-colors"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-[#E4EAF1]">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveAvatar(avatarPreview || user?.avatarUrl || '')}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#1a4b7f] shadow-soft-sm transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
