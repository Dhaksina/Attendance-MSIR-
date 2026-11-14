import React, { useState } from 'react';
import {
  User,
  Clock,
  Bell,
  Shield,
  Palette,
  CheckCircle2,
  Lock,
  Smartphone,
  MapPin,
  Save,
  Globe,
  Database,
  Server,
  Cloud,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { dbService } from '../services/dbService';
import { DatabaseConfigModal } from '../components/common/DatabaseConfigModal';

export const SettingsPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { addNotification, employees, leaveRequests, attendanceHistory, regularizationRequests } = useAttendance();

  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'notifications' | 'security' | 'appearance' | 'database'>('attendance');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ running: boolean; success?: boolean; message?: string } | null>(null);

  const dbStatus = dbService.getStatus();

  const handleTestDb = async () => {
    setTestResult({ running: true });
    try {
      const res = await dbService.testConnection();
      setTestResult({ running: false, success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ running: false, success: false, message: err?.message || 'Connection test failed.' });
    }
  };

  // Form states
  const [gracePeriod, setGracePeriod] = useState('10');
  const [geofenceRadius, setGeofenceRadius] = useState('2000');
  const [autoCheckout, setAutoCheckout] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:30');
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [timeFormat, setTimeFormat] = useState('12h');

  const handleSave = () => {
    addNotification('Settings Saved', 'Your system preferences were updated successfully.', 'system');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
            Preferences & Configuration
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            System Settings
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Configure biometric rules, shift schedules, alerts, and security preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-[#123B66] hover:bg-[#1b4e82] shadow-soft-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Save className="w-4 h-4 text-[#F5C542]" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Grid: Settings Tabs Navigation & Settings Card Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Tabs (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-3 border border-[#E4EAF1] shadow-soft-xs space-y-1">
          {[
            { id: 'profile' as const, label: 'Profile Settings', icon: User },
            { id: 'attendance' as const, label: 'Attendance Settings', icon: Clock },
            { id: 'notifications' as const, label: 'Notification Settings', icon: Bell },
            { id: 'security' as const, label: 'Security & Auth', icon: Shield },
            { id: 'appearance' as const, label: 'Appearance', icon: Palette },
            { id: 'database' as const, label: 'Database & Sync', icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-[#123B66] text-white shadow-soft-xs'
                    : 'text-[#667085] hover:bg-[#F8FAFC] hover:text-[#172033]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5C542]' : 'text-[#667085]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel (9 cols) */}
        <div className="lg:col-span-9 bg-white rounded-3xl p-6 sm:p-8 border border-[#E4EAF1] shadow-soft-xs">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-[#172033] text-lg pb-3 border-b border-[#E4EAF1]">
                Profile Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Display Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Work Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    disabled
                    className="w-full px-3 py-2 bg-[#F1F5F9] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm text-[#667085] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Department</label>
                  <input
                    type="text"
                    defaultValue={user?.department}
                    disabled
                    className="w-full px-3 py-2 bg-[#F1F5F9] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm text-[#667085] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Timezone</label>
                  <select className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium">
                    <option>(GMT+05:30) India Standard Time (IST)</option>
                    <option>(GMT+00:00) UTC</option>
                    <option>(GMT-05:00) Eastern Time (EST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Settings */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-[#172033] text-lg pb-3 border-b border-[#E4EAF1]">
                Attendance & Shift Policies
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Shift Start Window
                  </label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Shift End Window
                  </label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Grace Period for Late Mark (Minutes)
                  </label>
                  <input
                    type="number"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  />
                  <p className="text-[11px] text-[#667085] mt-1">
                    Check-in after 10 mins (past 09:10 AM) automatically marks Half Day Leave.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Campus Geofence Radius (Meters)
                  </label>
                  <input
                    type="number"
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  />
                  <p className="text-[11px] text-[#667085] mt-1">
                    Mobile app permits check-in within this GPS radius.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4EAF1] space-y-3">
                <label className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E4EAF1] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      Automatic Shift Completion
                    </span>
                    <span className="text-xs text-[#667085]">
                      Automatically mark checkout after 10 hours if forgotten
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCheckout}
                    onChange={(e) => setAutoCheckout(e.target.checked)}
                    className="w-5 h-5 rounded text-[#3D78C5] focus:ring-[#3D78C5]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-[#172033] text-lg pb-3 border-b border-[#E4EAF1]">
                Notification & Alert Preferences
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E4EAF1] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      Daily Check-out Push Reminder
                    </span>
                    <span className="text-xs text-[#667085]">
                      Notify me 15 minutes before shift end (05:30 PM)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded text-[#3D78C5]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E4EAF1] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      Leave Approval Alerts
                    </span>
                    <span className="text-xs text-[#667085]">
                      Instant in-app notice when manager reviews request
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded text-[#3D78C5]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E4EAF1] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      Weekly Attendance Summary Email
                    </span>
                    <span className="text-xs text-[#667085]">
                      Receive consolidated hours breakdown on Friday evenings
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailDigest}
                    onChange={(e) => setEmailDigest(e.target.checked)}
                    className="w-5 h-5 rounded text-[#3D78C5]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-[#172033] text-lg pb-3 border-b border-[#E4EAF1]">
                Security & Authentication
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Two-Factor Authentication (2FA)</span>
                    <span className="text-xs text-[#667085]">Secured via Authenticator App & SMS OTP</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    Enabled
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Biometric Hardware Passkey</span>
                    <span className="text-xs text-[#667085]">TouchID / Windows Hello device registration</span>
                  </div>
                  <button className="text-xs font-bold text-[#3D78C5] hover:underline">
                    Manage Passkeys
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                  <span className="text-xs font-bold text-[#172033] block mb-2">Change Password</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="px-3 py-2 bg-white border border-[#E4EAF1] rounded-xl text-xs"
                    />
                    <input
                      type="password"
                      placeholder="New strong password"
                      className="px-3 py-2 bg-white border border-[#E4EAF1] rounded-xl text-xs"
                    />
                  </div>
                  <button
                    onClick={() => alert('Password updated')}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-[#123B66] text-white text-xs font-bold"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-[#172033] text-lg pb-3 border-b border-[#E4EAF1]">
                Interface & Appearance
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-2">
                    System Theme Style
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <div className="p-3.5 rounded-2xl border-2 border-[#123B66] bg-[#F8FAFC] text-center">
                      <span className="text-xs font-bold text-[#123B66] block">Clean Light HR</span>
                      <span className="text-[10px] text-[#667085]">(Enterprise Default)</span>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-[#E4EAF1] bg-slate-100 text-center opacity-60 cursor-not-allowed">
                      <span className="text-xs font-bold text-[#667085] block">Dark Mode</span>
                      <span className="text-[10px] text-[#667085]">(Restricted by Policy)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-2">
                    Time Format Display
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTimeFormat('12h')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${
                        timeFormat === '12h'
                          ? 'bg-[#123B66] text-white'
                          : 'bg-[#F8FAFC] text-[#667085] border border-[#E4EAF1]'
                      }`}
                    >
                      12-Hour (09:00 AM)
                    </button>
                    <button
                      onClick={() => setTimeFormat('24h')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${
                        timeFormat === '24h'
                          ? 'bg-[#123B66] text-white'
                          : 'bg-[#F8FAFC] text-[#667085] border border-[#E4EAF1]'
                      }`}
                    >
                      24-Hour (09:00)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database & Sync Settings */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4EAF1]">
                <div>
                  <h3 className="font-extrabold text-[#172033] text-lg">
                    Cloud Database & Multi-Device Sync
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Real-time synchronization across laptops using Firebase Firestore and cloud storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDbModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#123B66] hover:bg-[#1a4a7f] transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-soft-xs"
                >
                  <Database className="w-4 h-4 text-[#F5C542]" />
                  <span>Configure Database</span>
                </button>
              </div>

              {/* Status Card */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                        dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-bold text-[#172033]">{dbStatus.name}</p>
                      <p className="text-xs text-[#667085] mt-0.5">{dbStatus.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestDb}
                      disabled={testResult?.running}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#123B66] bg-white border border-[#E4EAF1] hover:bg-[#EAF2FB] transition-colors flex items-center gap-1.5 shadow-soft-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#3D78C5] ${testResult?.running ? 'animate-spin' : ''}`} />
                      <span>{testResult?.running ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                        dbStatus.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dbStatus.connected ? 'Active & Synced' : 'Offline Mode'}
                    </span>
                  </div>
                </div>

                {testResult && !testResult.running && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Real-time Collections Stats */}
              <div>
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-3">
                  Live Cloud Collections
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                    <span className="text-[11px] font-medium text-[#667085] block">Employees</span>
                    <span className="text-xl font-extrabold text-[#123B66] mt-1 block">{employees.length}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Live Firestore</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                    <span className="text-[11px] font-medium text-[#667085] block">Leave Requests</span>
                    <span className="text-xl font-extrabold text-[#123B66] mt-1 block">{leaveRequests.length}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Live Firestore</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                    <span className="text-[11px] font-medium text-[#667085] block">Attendance Punches</span>
                    <span className="text-xl font-extrabold text-[#123B66] mt-1 block">{attendanceHistory.length}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Live Firestore</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
                    <span className="text-[11px] font-medium text-[#667085] block">Regularizations</span>
                    <span className="text-xl font-extrabold text-[#123B66] mt-1 block">{regularizationRequests.length}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Live Firestore</span>
                  </div>
                </div>
              </div>

              {/* Multi-Device Sync Explanation */}
              <div className="p-4 rounded-2xl bg-[#EAF2FB] border border-[#CBE0F7] text-xs text-[#123B66] space-y-1.5">
                <p className="font-bold">Multi-Device Real-Time Sync is Active</p>
                <p className="text-[11px] text-[#334155] leading-relaxed">
                  When an employee punches attendance or submits a leave application on one laptop, Firebase Firestore pushes the update immediately to all other connected laptops within 1-2 seconds via real-time listeners.
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-[#E4EAF1] flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#1a4a7f] transition-colors"
            >
              Save Section Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Database Connection Settings Modal */}
      <DatabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};
