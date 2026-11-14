import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Server,
  Cloud,
  Check,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { saveSupabaseConfig, DEFAULT_SUPABASE_CONFIG } from '../../lib/supabase';
import { saveFirebaseConfig, DEFAULT_FIREBASE_CONFIG } from '../../lib/firebase';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

const SUPABASE_SQL_SCHEMA = `-- Aten Attendance Hub Tables Schema
-- Execute this script in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  designation TEXT,
  department TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  manager TEXT,
  is_manager BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Active',
  shift TEXT,
  password TEXT,
  geofence_enabled BOOLEAN DEFAULT true,
  assigned_geofence TEXT,
  joining_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  date TEXT NOT NULL,
  day_name TEXT,
  check_in TEXT,
  check_out TEXT,
  working_hours TEXT,
  status TEXT,
  location TEXT,
  maps_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  category TEXT DEFAULT 'Leave',
  leave_type TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  days NUMERIC,
  permission_time TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  applied_date TEXT,
  reviewed_by TEXT,
  admin_remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS regularization_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  date TEXT NOT NULL,
  requested_check_in TEXT,
  requested_check_out TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  applied_date TEXT,
  reviewed_by TEXT,
  admin_remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
`;

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentStatus = dbService.getStatus();
  const [provider, setProvider] = useState<'supabase' | 'firebase'>(
    currentStatus.provider === 'supabase' ? 'supabase' : 'firebase'
  );

  // Supabase fields (pre-filled with provided publishable key)
  const [supabaseUrl, setSupabaseUrl] = useState(DEFAULT_SUPABASE_CONFIG.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(DEFAULT_SUPABASE_CONFIG.key);

  // Firebase fields (pre-filled with configured project attendancemsir)
  const [firebaseApiKey, setFirebaseApiKey] = useState(DEFAULT_FIREBASE_CONFIG.apiKey);
  const [firebaseProjectId, setFirebaseProjectId] = useState(DEFAULT_FIREBASE_CONFIG.projectId);
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState(DEFAULT_FIREBASE_CONFIG.authDomain || '');

  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [testResult, setTestResult] = useState<{
    running: boolean;
    success?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestResult({ running: true });
    try {
      const res = await dbService.testConnection();
      setTestResult({ running: false, success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ running: false, success: false, message: err?.message || 'Connection test failed.' });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (provider === 'supabase') {
      if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
        setErrorMsg('Please enter both Supabase Project URL and Anon Public Key.');
        return;
      }
      saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
      localStorage.setItem('msir_active_db_provider', 'supabase');
    } else {
      if (!firebaseApiKey.trim() || !firebaseProjectId.trim()) {
        setErrorMsg('Please enter Firebase API Key and Project ID.');
        return;
      }
      saveFirebaseConfig({
        apiKey: firebaseApiKey.trim(),
        projectId: firebaseProjectId.trim(),
        authDomain: firebaseAuthDomain.trim() || `${firebaseProjectId.trim()}.firebaseapp.com`,
        storageBucket: DEFAULT_FIREBASE_CONFIG.storageBucket,
        messagingSenderId: DEFAULT_FIREBASE_CONFIG.messagingSenderId,
        appId: DEFAULT_FIREBASE_CONFIG.appId,
        measurementId: DEFAULT_FIREBASE_CONFIG.measurementId,
      });
      localStorage.setItem('msir_active_db_provider', 'firebase');
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onConfigSaved) onConfigSaved();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#E4EAF1] shadow-soft-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#123B66] text-[#F5C542] flex items-center justify-center shadow-soft-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#172033]">
              Cloud Database Connection
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Connect Supabase or Firebase to persist employees, attendance, and leave requests.
            </p>
          </div>
        </div>

        {/* Current Connection Status Pill */}
        <div className="mt-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${
                  currentStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <p className="text-xs font-bold text-[#172033]">{currentStatus.name}</p>
                <p className="text-[11px] text-[#667085]">{currentStatus.details}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testResult?.running}
                className="px-3 py-1 rounded-xl text-xs font-bold text-[#123B66] bg-white border border-[#E4EAF1] hover:bg-[#EAF2FB] transition-colors flex items-center gap-1.5 shadow-soft-xs disabled:opacity-50"
              >
                <Server className="w-3.5 h-3.5 text-[#3D78C5]" />
                <span>{testResult?.running ? 'Testing...' : 'Test Connection'}</span>
              </button>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  currentStatus.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentStatus.connected ? 'Connected' : 'Offline / Local'}
              </span>
            </div>
          </div>

          {testResult && !testResult.running && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
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

        {/* Provider Switcher */}
        <div className="mt-6 flex p-1 bg-[#F1F5F9] rounded-2xl">
          <button
            type="button"
            onClick={() => setProvider('supabase')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              provider === 'supabase'
                ? 'bg-white text-[#123B66] shadow-soft-xs'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Cloud className="w-4 h-4 text-[#3ECF8E]" />
            <span>Supabase (PostgreSQL)</span>
          </button>
          <button
            type="button"
            onClick={() => setProvider('firebase')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              provider === 'firebase'
                ? 'bg-white text-[#123B66] shadow-soft-xs'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Server className="w-4 h-4 text-[#FFA611]" />
            <span>Firebase (Firestore)</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {provider === 'supabase' ? (
            <>
              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-mono text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">
                  Supabase Anon Public Key (API Key)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-mono text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white"
                />
              </div>

              {/* Quick SQL schema box */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] text-[#F5C542] font-semibold">
                    Supabase SQL Schema
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied SQL!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL to Run</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Run this schema in your Supabase SQL Editor to create the <code>employees</code>, <code>attendance</code>, and <code>leave_requests</code> tables.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">
                  Firebase Project ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. aten-attendance-system"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-mono text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">
                  Firebase Web API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSyA..."
                  value={firebaseApiKey}
                  onChange={(e) => setFirebaseApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-mono text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">
                  Auth Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. attendancemsir.firebaseapp.com"
                  value={firebaseAuthDomain}
                  onChange={(e) => setFirebaseAuthDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs font-mono text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white"
                />
              </div>

              {/* Firestore Security Rules Tip */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] text-[#FFA611] font-semibold">
                    Firestore Security Rules
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Active on attendancemsir
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In Firebase Console &rarr; Firestore Database &rarr; Rules, make sure read and write are allowed so your team can sync attendance & leaves.
                </p>
              </div>
            </>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Database configuration saved successfully! Reconnecting...</span>
            </div>
          )}

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
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#123B66] hover:bg-[#1a4a7f] shadow-soft-xs flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-[#F5C542]" />
              <span>Save & Connect Database</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

