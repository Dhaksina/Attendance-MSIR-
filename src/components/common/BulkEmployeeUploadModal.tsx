import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Briefcase,
  UserCheck,
  Shield,
  FileText,
} from 'lucide-react';
import { EmployeeDirectoryItem } from '../../types';
import { dbService } from '../../services/dbService';

interface BulkEmployeeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedEmployees: EmployeeDirectoryItem[]) => void;
}

const SAMPLE_CSV = `FullName,EmployeeId,Designation,Department,Email,Phone,Role,Manager,Shift,Password
Karthik Raman,EMP41001,Senior Mass Calibration Engineer,Mechanical & Mass Calibration,karthik.r@msircalibration.com,+91 98765 00001,Employee,Dr. S. Narayanan,General Shift,msirindia1
Dr. S. Narayanan,M1001,Technical Director (Calibration),Mechanical & Mass Calibration,narayanan.s@msircalibration.com,+91 98765 00002,Manager,Executive Management,General Shift,msirindia1
Priya Sundaram,EMP41002,Quality Manager (ISO/IEC 17025),Quality Assurance & NABL Accreditation,priya.s@msircalibration.com,+91 98765 00003,Manager,Executive Management,General Shift,msirindia1
Vignesh Kumar,EMP41003,Thermal & Temperature Calibration Engineer,Thermal & Temperature Calibration,vignesh.k@msircalibration.com,+91 98765 00004,Employee,Dr. S. Narayanan,General Shift,msirindia1
Ananya Iyer,EMP41004,Electro-Technical Metrology Specialist,Electro-Technical Calibration,ananya.i@msircalibration.com,+91 98765 00005,Employee,Dr. S. Narayanan,General Shift,msirindia1
Manoj Balaji,EMP41005,Dimensional Metrology Specialist,Dimensional Metrology & Calibration,manoj.b@msircalibration.com,+91 98765 00006,Employee,Dr. S. Narayanan,General Shift,msirindia1
Suresh Kumar,EMP41006,Pressure & Vacuum Calibration Technician,Pressure & Vacuum Calibration,suresh.k@msircalibration.com,+91 98765 00007,Employee,Dr. S. Narayanan,General Shift,msirindia1
`;

export const BulkEmployeeUploadModal: React.FC<BulkEmployeeUploadModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedEmployees, setParsedEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [csvText, setCsvText] = useState('');
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employees_and_managers_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvContent = (content: string) => {
    setErrorMsg(null);
    const lines = content.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setErrorMsg('CSV file is empty or missing headers.');
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = lines.slice(1);

    const getColIndex = (names: string[]): number => {
      for (const name of names) {
        const idx = header.indexOf(name);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const nameIdx = getColIndex(['fullname', 'name', 'employeename']);
    const idIdx = getColIndex(['employeeid', 'empid', 'id']);
    const desigIdx = getColIndex(['designation', 'roletitle', 'title', 'position']);
    const deptIdx = getColIndex(['department', 'dept', 'unit']);
    const emailIdx = getColIndex(['email', 'mail', 'workemail']);
    const phoneIdx = getColIndex(['phone', 'mobile', 'contact']);
    const roleIdx = getColIndex(['role', 'ismanager', 'type']);
    const mgrIdx = getColIndex(['manager', 'reportingmanager', 'managername']);
    const shiftIdx = getColIndex(['shift', 'shiftname']);
    const passIdx = getColIndex(['password', 'pwd']);

    const employees: EmployeeDirectoryItem[] = [];

    rows.forEach((line, index) => {
      // Split by comma ignoring commas inside quotes
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 2) return;

      const fullName = nameIdx !== -1 ? values[nameIdx] : values[0] || `Employee ${index + 1}`;
      const rawId = idIdx !== -1 ? values[idIdx] : values[1] || `EMP${41001 + index}`;
      const employeeId = rawId.toUpperCase();
      const designation = desigIdx !== -1 ? values[desigIdx] : 'Staff Specialist';
      const department = deptIdx !== -1 ? values[deptIdx] : 'General';
      const email = emailIdx !== -1 ? values[emailIdx] : `${employeeId.toLowerCase()}@atenhr.com`;
      const phone = phoneIdx !== -1 ? values[phoneIdx] : '+91 98765 00000';
      const roleStr = roleIdx !== -1 ? values[roleIdx].toLowerCase() : '';
      const isManager =
        roleStr.includes('manager') ||
        roleStr === 'true' ||
        roleStr === 'yes' ||
        designation.toLowerCase().includes('director') ||
        designation.toLowerCase().includes('manager');
      const manager = mgrIdx !== -1 ? values[mgrIdx] : isManager ? 'Executive Board' : 'Reporting Manager';
      const shift = shiftIdx !== -1 ? values[shiftIdx] : 'General Shift (09:00 AM - 05:30 PM)';
      const password = passIdx !== -1 && values[passIdx] ? values[passIdx] : 'msirindia1';

      employees.push({
        id: `emp-${employeeId.toLowerCase()}`,
        employeeId,
        fullName,
        designation,
        department,
        email,
        phone,
        manager,
        isManager,
        status: 'Active',
        shift,
        todayStatus: 'Absent',
        joiningDate: new Date().toISOString().split('T')[0],
        geofenceEnabled: true,
        assignedGeofence: 'Science & Industrial Resources (Chromepet, Tambaram • 2km)',
        password,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=${isManager ? '123B66' : '3D78C5'}&color=fff`,
      });
    });

    if (employees.length === 0) {
      setErrorMsg('No valid employee records found in the provided CSV.');
      return;
    }

    setParsedEmployees(employees);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedEmployees.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Bulk save to database if connected
      await dbService.bulkSaveEmployees(parsedEmployees);

      // 2. Pass to parent callback
      onImportComplete(parsedEmployees);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import employees.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-[#E4EAF1] shadow-soft-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#3D78C5]/10 text-[#3D78C5] flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#172033]">
              Upload Employee & Manager Data
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Bulk import your organization's employees and managers via CSV or Excel export.
            </p>
          </div>
        </div>

        {/* Top Actions: Template & Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4EAF1]">
          <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] rounded-xl text-xs font-bold">
            <button
              onClick={() => setMode('upload')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'upload' ? 'bg-white text-[#123B66] shadow-soft-xs' : 'text-[#667085]'
              }`}
            >
              Upload CSV File
            </button>
            <button
              onClick={() => setMode('paste')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'paste' ? 'bg-white text-[#123B66] shadow-soft-xs' : 'text-[#667085]'
              }`}
            >
              Paste CSV Text
            </button>
          </div>

          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-1.5 text-xs font-bold text-[#3D78C5] hover:text-[#123B66] hover:underline"
          >
            <Download className="w-4 h-4" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="mt-5">
          {mode === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CBD5E1] hover:border-[#3D78C5] rounded-3xl p-8 text-center cursor-pointer bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all"
            >
              <FileSpreadsheet className="w-12 h-12 text-[#3D78C5] mx-auto mb-3" />
              <p className="text-sm font-extrabold text-[#172033]">
                Click or drag & drop your CSV or Excel file here
              </p>
              <p className="text-xs text-[#667085] mt-1">
                Supports columns: FullName, EmployeeId, Designation, Department, Email, Phone, Role, Manager, Password
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV rows here (including header)..."
                className="w-full p-3.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-2xl text-xs font-mono text-[#172033] focus:outline-none focus:border-[#3D78C5] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => parseCsvContent(csvText)}
                className="px-4 py-2 bg-[#123B66] text-white text-xs font-bold rounded-xl hover:bg-[#1a4a7f]"
              >
                Parse Rows
              </button>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview Section */}
        {parsedEmployees.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#172033]">
                  Ready to Import: {parsedEmployees.length} Members
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {parsedEmployees.filter((e) => e.isManager).length} Managers
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {parsedEmployees.filter((e) => !e.isManager).length} Employees
                </span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-[#E4EAF1] rounded-2xl divide-y divide-[#E4EAF1]/70 bg-white">
              {parsedEmployees.map((emp) => (
                <div key={emp.employeeId} className="p-3 flex items-center justify-between text-xs hover:bg-[#F8FAFC]">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-[#E4EAF1]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#172033]">{emp.fullName}</span>
                        <span className="font-mono text-[10px] bg-[#EAF2FB] text-[#123B66] px-1.5 py-0.2 rounded font-bold">
                          {emp.employeeId}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#667085]">
                        {emp.designation} • {emp.department}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.isManager
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {emp.isManager ? 'Manager' : 'Employee'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#E4EAF1]">
          <p className="text-[11px] text-[#667085]">
            Imported accounts will be granted login access to the Attendance Hub.
          </p>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              disabled={parsedEmployees.length === 0 || isProcessing}
              onClick={handleImport}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#123B66] hover:bg-[#1a4a7f] shadow-soft-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <span>Importing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#F5C542]" />
                  <span>Confirm & Import ({parsedEmployees.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

