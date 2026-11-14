import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  Briefcase,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth, detectRoleFromId, ROLE_PASSWORDS } from '../context/AuthContext';
import { UserRole } from '../types';

interface LoginPageProps {
  onSuccess: (targetRole?: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [employeeIdOrEmail, setEmployeeIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic role detection based on ID prefix
  const detected = detectRoleFromId(employeeIdOrEmail);
  const expectedPassword = ROLE_PASSWORDS[detected.roleType];

  // Dynamically resolve employee avatar, name and status for live preview on login
  const matchedEmployee = React.useMemo(() => {
    const trimmed = employeeIdOrEmail.trim().toLowerCase();
    if (!trimmed) return null;

    let customAvatar: string | undefined = undefined;
    try {
      const caRaw = localStorage.getItem('msir_custom_avatars');
      if (caRaw) {
        const ca = JSON.parse(caRaw);
        customAvatar = ca[trimmed.toUpperCase()] || ca[trimmed.toLowerCase()];
      }
    } catch {}

    try {
      const savedDirectory = localStorage.getItem('msir_employees_directory');
      if (savedDirectory) {
        const directoryList = JSON.parse(savedDirectory);
        const match = directoryList.find(
          (emp: any) =>
            emp.employeeId?.toLowerCase() === trimmed ||
            emp.email?.toLowerCase() === trimmed
        );
        if (match) {
          return {
            name: match.fullName,
            designation: match.designation,
            department: match.department,
            avatarUrl: customAvatar || match.avatarUrl,
            employeeId: match.employeeId,
            isManager: Boolean(match.isManager),
          };
        }
      }
    } catch {}

    if (trimmed === 'admin') {
      return {
        name: 'HR Administrator',
        designation: 'Chief HR Administrator',
        department: 'People Operations & HR',
        avatarUrl:
          customAvatar ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        employeeId: 'ADMIN',
        isManager: false,
      };
    }

    return null;
  }, [employeeIdOrEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate custom employee password if created in employee directory
    let hasCustomPassword = false;
    let customPasswordMatches = false;
    try {
      const savedDirectory = localStorage.getItem('msir_employees_directory');
      if (savedDirectory) {
        const directoryList = JSON.parse(savedDirectory);
        const match = directoryList.find(
          (emp: any) =>
            emp.employeeId?.toLowerCase() === employeeIdOrEmail.trim().toLowerCase() ||
            emp.email?.toLowerCase() === employeeIdOrEmail.trim().toLowerCase()
        );
        if (match?.password) {
          hasCustomPassword = true;
          customPasswordMatches =
            password.trim() === match.password || password.trim() === expectedPassword;
        }
      }
    } catch {}

    if (hasCustomPassword) {
      if (!customPasswordMatches) {
        setErrorMessage('Incorrect password for this employee account. Please verify credentials.');
        return;
      }
    } else if (password.trim() !== expectedPassword) {
      setErrorMessage(
        `Incorrect password for ${detected.roleLabel}. Please verify credentials.`
      );
      return;
    }

    setIsLoading(true);
    try {
      const resolvedRole = await login(employeeIdOrEmail, password.trim());
      onSuccess(resolvedRole);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-soft-xl border border-[#E4EAF1] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Premium Blue Gradient with Graphic & HR Value Proposition */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#123B66] via-[#164577] to-[#2561A0] p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle geometric background glow rings */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#3D78C5]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-[#F5C542]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img
                src="/msir-logo.png"
                alt="MSIR INDIA Calibration"
                className="h-12 w-auto object-contain rounded-xl shadow-soft-sm bg-white/10 backdrop-blur-md p-1 border border-white/20"
              />
            </div>

            <div className="mt-12 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/15 text-[#F5C542]">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Workforce Hub
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Empowering teams with precision attendance & unified workflows.
              </h2>
              <p className="text-sm text-white/80 leading-relaxed pt-1">
                Seamless geofenced check-ins, automated leave approvals, and executive analytics designed for high-performance workplaces.
              </p>
            </div>
          </div>

          {/* HR Highlights Card Mock */}
          <div className="relative z-10 my-8 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F5C542]" />
                <span className="font-semibold text-white">Biometric Geofence</span>
              </div>
              <span className="text-emerald-300 font-bold text-[11px]">99.8% Accuracy</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-300" />
                <span className="font-semibold text-white">Realtime Workforce</span>
              </div>
              <span className="text-white/80 font-mono text-[11px]">248 Active Staff</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">SOC-2 Type II Certified</span>
              </div>
              <span className="text-white/80 text-[11px]">Compliant</span>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="relative z-10 text-xs text-white/60 flex items-center justify-between">
            <span>© 2026 Aten Systems Inc.</span>
            <span>Version 4.2 LTS</span>
          </div>
        </div>

        {/* Right Column: Clean, Elegant Single Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
                Welcome Back
              </h3>
              <p className="text-sm text-[#667085] mt-1.5 leading-relaxed">
                Enter your Employee ID or Admin username to sign in to your workplace account.
              </p>
            </div>

            {/* Dynamic Role Detection & Employee Profile Status Banner */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                detected.roleType === 'admin'
                  ? 'bg-purple-50/70 border-purple-200'
                  : detected.roleType === 'manager' || matchedEmployee?.isManager
                  ? 'bg-indigo-50/70 border-indigo-200'
                  : 'bg-blue-50/70 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {detected.roleType === 'admin' ? (
                    <Shield className="w-4 h-4 text-purple-600" />
                  ) : detected.roleType === 'manager' || matchedEmployee?.isManager ? (
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <User className="w-4 h-4 text-[#123B66]" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      detected.roleType === 'admin'
                        ? 'text-purple-800'
                        : detected.roleType === 'manager' || matchedEmployee?.isManager
                        ? 'text-indigo-800'
                        : 'text-[#123B66]'
                    }`}
                  >
                    {matchedEmployee?.isManager ? 'Manager & Approver' : detected.roleLabel}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-soft-2xs text-[#172033]">
                  {detected.roleType === 'admin'
                    ? 'HR Administrator'
                    : detected.roleType === 'manager' || matchedEmployee?.isManager
                    ? 'Manager & Approver'
                    : 'Employee Portal'}
                </span>
              </div>

              {/* Matched Employee Avatar & Verified Identity Box */}
              {matchedEmployee ? (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={matchedEmployee.avatarUrl}
                      alt={matchedEmployee.name}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-soft-sm ring-1 ring-black/5"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-extrabold text-[#172033] truncate">
                        {matchedEmployee.name}
                      </p>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[#123B66]">
                        {matchedEmployee.employeeId}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] truncate">
                      {matchedEmployee.designation} • {matchedEmployee.department}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span>Verified account • Photo synced from Employee Portal</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[#667085] mt-1 leading-snug">
                  {detected.roleType === 'admin'
                    ? 'Full administrative access: workforce management, leave approvals, and organization settings.'
                    : 'Employee access: GPS check-in/out, leave requests, and personal attendance.'}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1.5">
                  Employee ID / Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
                  <input
                    type="text"
                    value={employeeIdOrEmail}
                    onChange={(e) => setEmployeeIdOrEmail(e.target.value)}
                    placeholder="Enter Employee ID or Username"
                    required
                    className="w-full pl-10 pr-28 py-3 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-sm font-semibold text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-all uppercase"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${detected.badgeColor}`}
                    >
                      {detected.roleType === 'admin'
                        ? 'ADMIN'
                        : detected.roleType === 'manager' || matchedEmployee?.isManager
                        ? 'MANAGER'
                        : 'EMPLOYEE'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#172033]">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Please contact your System Administrator to reset your password.');
                    }}
                    className="text-xs font-semibold text-[#3D78C5] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your password"
                    required
                    className={`w-full pl-10 pr-10 py-3 bg-[#F8FAFC] border rounded-xl text-sm font-mono text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:bg-white transition-all ${
                      errorMessage
                        ? 'border-red-400 focus:border-red-500 ring-1 ring-red-300'
                        : 'border-[#E4EAF1] focus:border-[#3D78C5]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033] transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#667085] font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3D78C5] focus:ring-[#3D78C5] border-[#E4EAF1]"
                  />
                  <span>Remember this browser</span>
                </label>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Password Protection Active
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#3D78C5] hover:bg-[#2e68b3] active:bg-[#20559b] shadow-soft-md hover:shadow-soft-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      Sign In as{' '}
                      {detected.roleType === 'admin'
                        ? 'HR Administrator'
                        : detected.roleType === 'manager'
                        ? 'Manager'
                        : 'Employee'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#E4EAF1] text-center">
              <p className="text-xs text-[#667085]">
                Need corporate SSO access?{' '}
                <span className="text-[#3D78C5] font-semibold cursor-pointer hover:underline">
                  Sign in with Okta / Google Workspace
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
