import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Edit2,
  UserX,
  UserCheck,
  X,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  UserMinus,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Briefcase,
  UserCheck2,
  Compass,
  CheckSquare,
  Square,
  Sparkles,
  Upload,
  Database,
  RotateCcw,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { EmployeeDirectoryItem } from '../types';
import { EmployeeLocationModal } from '../components/attendance/EmployeeLocationModal';
import { BulkEmployeeUploadModal } from '../components/common/BulkEmployeeUploadModal';
import { DatabaseConfigModal } from '../components/common/DatabaseConfigModal';
import { verifyGeofence, OFFICE_GEOFENCE } from '../utils/geofence';
import { isEmployeeAssignedToManager } from '../utils/managerScope';
import {
  ALL_CALIBRATION_DEPARTMENT_NAMES,
  getRolesForDepartment,
} from '../data/calibrationRoles';

export const EmployeeManagementPage: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    importEmployees,
    clearAllData,
    addNotification,
  } = useAttendance();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [geofenceFilter, setGeofenceFilter] = useState<'All' | 'Mandatory' | 'Exempted'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<EmployeeDirectoryItem | null>(null);
  const [selectedLocationEmployee, setSelectedLocationEmployee] = useState<EmployeeDirectoryItem | null>(null);

  // Multi-select for bulk Geofence actions
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Edit Employee Modal State
  const [editTarget, setEditTarget] = useState<EmployeeDirectoryItem | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    employeeId: '',
    designation: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    isManager: false,
    manager: '',
    status: 'Active' as EmployeeDirectoryItem['status'],
    geofenceEnabled: true,
    assignedGeofence: 'Science & Industrial Resources (Chromepet, Tambaram • 250m)',
  });
  const [editSelectedSubordinateIds, setEditSelectedSubordinateIds] = useState<string[]>([]);
  const [editSubordinateSearchQuery, setEditSubordinateSearchQuery] = useState('');

  // Delete / Relieve Employee State
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDirectoryItem | null>(null);
  const [isRelievingMode, setIsRelievingMode] = useState<boolean>(false);
  const [relieveDate, setRelieveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [relieveReason, setRelieveReason] = useState<string>('Resignation (Notice Period Served)');
  const [relieveNotes, setRelieveNotes] = useState<string>('');
  const [clearanceChecks, setClearanceChecks] = useState({
    assets: true,
    kt: true,
    access: true,
    fnf: true,
  });
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Helper to compute next sequential ID starting from EMP41001
  const getNextEmployeeId = (list: EmployeeDirectoryItem[]): string => {
    let maxNum = 41000;
    for (const emp of list) {
      const match = (emp.employeeId || '').match(/EMP(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return `EMP${maxNum + 1}`;
  };

  // New Employee Form State with Password & Geofence Selection (Starts from EMP41001)
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [form, setForm] = useState(() => ({
    employeeId: getNextEmployeeId(employees),
    fullName: '',
    email: '',
    phone: '',
    password: 'msirindia1',
    department: 'Mechanical & Mass Calibration',
    designation: 'Senior Mass Calibration Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    isManager: false,
    manager: 'Technical Director (Calibration)',
    status: 'Active' as EmployeeDirectoryItem['status'],
    geofenceEnabled: true,
    assignedGeofence: 'Science & Industrial Resources (Chromepet, Tambaram • 250m)',
  }));
  const [selectedSubordinateIds, setSelectedSubordinateIds] = useState<string[]>([]);
  const [subordinateSearchQuery, setSubordinateSearchQuery] = useState('');

  // Default calibration laboratory managers for reporting manager assignment
  const defaultCalibrationManagers = [
    'Technical Director (Calibration)',
    'Quality Manager (ISO/IEC 17025)',
    'Mechanical & Mass Metrology Head',
    'Thermal Metrology Manager',
    'Electro-Technical Laboratory Manager',
  ];

  // Dynamically include any designated managers from employees list
  const allManagerOptions = useMemo(() => {
    const list = [...defaultCalibrationManagers];
    employees.forEach((emp) => {
      if (emp.isManager) {
        const label = `${emp.fullName} (${emp.designation})`;
        if (!list.some((m) => m.toLowerCase().includes(emp.fullName.toLowerCase()))) {
          list.push(label);
        }
      }
    });
    return list;
  }, [employees]);

  // Subordinates filtering for Add Modal
  const availableSubordinatesForAdd = useMemo(() => {
    return employees.filter((emp) => {
      if (!subordinateSearchQuery.trim()) return true;
      const q = subordinateSearchQuery.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q)
      );
    });
  }, [employees, subordinateSearchQuery]);

  // Subordinates filtering for Edit Modal
  const availableSubordinatesForEdit = useMemo(() => {
    if (!editTarget) return [];
    return employees
      .filter((emp) => emp.id !== editTarget.id)
      .filter((emp) => {
        if (!editSubordinateSearchQuery.trim()) return true;
        const q = editSubordinateSearchQuery.toLowerCase();
        return (
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q)
        );
      });
  }, [employees, editTarget, editSubordinateSearchQuery]);

  const toggleSubordinate = (id: string) => {
    setSelectedSubordinateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllSubordinates = () => {
    setSelectedSubordinateIds(availableSubordinatesForAdd.map((e) => e.id));
  };

  const toggleEditSubordinate = (id: string) => {
    setEditSelectedSubordinateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEditSubordinates = () => {
    setEditSelectedSubordinateIds(availableSubordinatesForEdit.map((e) => e.id));
  };

  // Permitted Geofence location perimeters
  const geofencePerimeterOptions = [
    'Science & Industrial Resources (Chromepet, Tambaram • 250m)',
    'MSIR Calibration Lab B (Tambaram • 150m)',
    'Hyundai Assembly Corridor (Sriperumbudur • 500m)',
    'Ashok Leyland Facility (Ennore • 500m)',
    'TVS Motor Calibration Bay (Hosur • 500m)',
  ];

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.includes(searchTerm) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = departmentFilter === 'All' ? true : emp.department === departmentFilter;
      const matchStatus = statusFilter === 'All' ? true : emp.status === statusFilter;
      const matchGeofence =
        geofenceFilter === 'All'
          ? true
          : geofenceFilter === 'Mandatory'
          ? emp.geofenceEnabled !== false
          : emp.geofenceEnabled === false;

      return matchSearch && matchDept && matchStatus && matchGeofence;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter, geofenceFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.employeeId.trim()) return;

    const newEmpId = form.employeeId.trim();
    const newFullName = form.fullName.trim();
    const newDesignation = form.designation.trim();

    addEmployee({
      employeeId: newEmpId,
      fullName: newFullName,
      email: form.email.trim(),
      phone: form.phone.trim() || '+91 98000 11223',
      password: form.password.trim() || 'msirindia1',
      department: form.department,
      designation: newDesignation,
      joiningDate: form.joiningDate,
      isManager: form.isManager,
      manager: form.isManager ? (form.manager || 'Executive Management') : form.manager,
      status: form.status,
      geofenceEnabled: form.geofenceEnabled,
      assignedGeofence: form.geofenceEnabled ? form.assignedGeofence : 'Exempted / Flexible',
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=150&auto=format&fit=crop&q=80`,
      todayStatus: 'Absent',
      todayCheckIn: undefined,
      todayLocation: undefined,
      todayLocationType: undefined,
      todayCoordinates: undefined,
      todayMapsUrl: undefined,
    });

    // If designated as a Manager and subordinates were selected, update their reporting manager!
    if (form.isManager && selectedSubordinateIds.length > 0) {
      const managerLabel = `${newFullName} (${newDesignation})`;
      selectedSubordinateIds.forEach((subId) => {
        updateEmployee(subId, { manager: managerLabel });
      });
      addNotification(
        'Reporting Manager Assigned',
        `Assigned ${selectedSubordinateIds.length} employee(s) to report to new Manager ${newFullName}.`,
        'system'
      );
    }

    setSuccessBanner(
      form.isManager
        ? `Manager account for "${newFullName}" (ID: ${newEmpId}) created successfully with ${selectedSubordinateIds.length} direct report(s)!`
        : `Employee account "${newFullName}" (ID: ${newEmpId}) created successfully with login password! Geofence policy set to ${
            form.geofenceEnabled ? 'Mandatory (250m)' : 'Exempted'
          }.`
    );
    setIsAddModalOpen(false);
    setSelectedSubordinateIds([]);
    setSubordinateSearchQuery('');
    setForm({
      employeeId: getNextEmployeeId([...employees, { employeeId: form.employeeId.trim() } as any]),
      fullName: '',
      email: '',
      phone: '',
      password: 'msirindia1',
      department: 'Mechanical & Mass Calibration',
      designation: 'Senior Mass Calibration Engineer',
      joiningDate: new Date().toISOString().split('T')[0],
      isManager: false,
      manager: 'Technical Director (Calibration)',
      status: 'Active',
      geofenceEnabled: true,
      assignedGeofence: 'Science & Industrial Resources (Chromepet, Tambaram • 250m)',
    });
  };

  const openEditModal = (emp: EmployeeDirectoryItem) => {
    setEditTarget(emp);
    setShowEditPassword(false);

    const isMgr = Boolean(
      emp.isManager ||
      emp.designation?.toLowerCase().includes('director') ||
      emp.designation?.toLowerCase().includes('lead') ||
      emp.designation?.toLowerCase().includes('manager') ||
      emp.fullName === 'Vikram Anand'
    );

    // Find all subordinates currently reporting to this employee
    const currentSubIds = employees
      .filter((e) => e.id !== emp.id && isEmployeeAssignedToManager(e.manager, emp.fullName))
      .map((e) => e.id);

    setEditSelectedSubordinateIds(currentSubIds);
    setEditSubordinateSearchQuery('');

    setEditForm({
      fullName: emp.fullName,
      employeeId: emp.employeeId,
      designation: emp.designation,
      email: emp.email,
      phone: emp.phone,
      password: emp.password || 'msirindia1',
      department: emp.department,
      isManager: isMgr,
      manager: emp.manager,
      status: emp.status,
      geofenceEnabled: emp.geofenceEnabled !== false,
      assignedGeofence: emp.assignedGeofence || 'Science & Industrial Resources (Chromepet, Tambaram • 250m)',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    const mgrLabel = `${editForm.fullName.trim()} (${editForm.designation.trim()})`;

    updateEmployee(editTarget.id, {
      fullName: editForm.fullName.trim(),
      employeeId: editForm.employeeId.trim(),
      designation: editForm.designation.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      password: editForm.password.trim() || 'msirindia1',
      department: editForm.department,
      isManager: editForm.isManager,
      manager: editForm.isManager ? (editForm.manager || 'Executive Management') : editForm.manager,
      status: editForm.status,
      geofenceEnabled: editForm.geofenceEnabled,
      assignedGeofence: editForm.geofenceEnabled ? editForm.assignedGeofence : 'Exempted / Flexible',
    });

    // If marked as Manager: update direct reports
    if (editForm.isManager) {
      const prevSubs = employees
        .filter((e) => e.id !== editTarget.id && isEmployeeAssignedToManager(e.manager, editTarget.fullName))
        .map((e) => e.id);

      // Assign all currently selected subordinates
      editSelectedSubordinateIds.forEach((subId) => {
        updateEmployee(subId, { manager: mgrLabel });
      });

      // Deselected subordinates get reassigned to default manager
      prevSubs
        .filter((oldId) => !editSelectedSubordinateIds.includes(oldId))
        .forEach((deselectedId) => {
          updateEmployee(deselectedId, { manager: 'Vikram Anand (Engineering Director)' });
        });
    } else {
      // If toggled from manager to non-manager, reassign previous subordinates
      employees
        .filter((e) => e.id !== editTarget.id && isEmployeeAssignedToManager(e.manager, editTarget.fullName))
        .forEach((oldSub) => {
          updateEmployee(oldSub.id, { manager: 'Vikram Anand (Engineering Director)' });
        });
    }

    addNotification(
      'Employee Profile Updated',
      `${editForm.fullName} (${editForm.employeeId}) details, manager role (${
        editForm.isManager ? `Yes - ${editSelectedSubordinateIds.length} direct reports` : 'No'
      }), and geofence updated.`,
      'system'
    );
    setSuccessBanner(
      `Employee profile for ${editForm.fullName} updated successfully.${
        editForm.isManager ? ` Reporting Manager with ${editSelectedSubordinateIds.length} direct reports.` : ''
      }`
    );
    setEditTarget(null);
  };

  // 1-Click toggle Geofence requirement for any employee
  const toggleEmployeeGeofence = (id: string) => {
    const target = employees.find((e) => e.id === id);
    if (!target) return;
    const nextVal = target.geofenceEnabled === false ? true : false;
    updateEmployee(id, {
      geofenceEnabled: nextVal,
      assignedGeofence: nextVal ? 'Science & Industrial Resources (Chromepet, Tambaram • 250m)' : 'Exempted / Flexible',
    });
    addNotification(
      'Geofence Policy Updated',
      `${target.fullName} (${target.employeeId}) geofence verification is now ${
        nextVal ? 'Mandatory (250m)' : 'Exempted'
      }.`,
      'system'
    );
    setSuccessBanner(
      `Geofence requirement for ${target.fullName} is now ${nextVal ? 'Mandatory (Enabled)' : 'Exempted (Disabled)'}.`
    );
  };

  // Bulk Geofence actions for selected employees
  const handleBulkGeofence = (enable: boolean) => {
    if (selectedEmployeeIds.length === 0) return;
    selectedEmployeeIds.forEach((id) => {
      updateEmployee(id, {
        geofenceEnabled: enable,
        assignedGeofence: enable ? 'Science & Industrial Resources (Chromepet, Tambaram • 250m)' : 'Exempted / Flexible',
      });
    });
    setSuccessBanner(
      `Geofence verification has been ${enable ? 'Enabled (Mandatory)' : 'Disabled (Exempted)'} for ${
        selectedEmployeeIds.length
      } selected employees.`
    );
    setSelectedEmployeeIds([]);
  };

  const handleSelectAll = () => {
    if (selectedEmployeeIds.length === filteredEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map((e) => e.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deleteTarget) return;

    const targetName = deleteTarget.fullName;
    const targetId = deleteTarget.employeeId;

    deleteEmployee(deleteTarget.id);

    addNotification(
      'Employee Profile Deleted',
      `${targetName} (${targetId}) was permanently deleted from the directory.${
        isRelievingMode ? ` Exit reason: ${relieveReason}.` : ''
      }`,
      'system'
    );

    setSuccessBanner(`Employee profile for ${targetName} (ID: ${targetId}) has been successfully deleted.`);
    setDeleteTarget(null);
    setIsRelievingMode(false);
    if (viewEmployee?.id === deleteTarget.id) {
      setViewEmployee(null);
    }
  };

  const activeCount = employees.filter((e) => e.status === 'Active' || e.status === 'On Probation').length;
  const inactiveCount = employees.filter((e) => e.status === 'Inactive').length;
  const geofenceMandatoryCount = employees.filter((e) => e.geofenceEnabled !== false).length;
  const geofenceExemptedCount = employees.filter((e) => e.geofenceEnabled === false).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Toast Banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between shadow-soft-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">Success</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successBanner}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
              Admin Control Center
            </span>
            <span className="text-xs text-[#667085]">
              Full Employee Lifecycle & Geofence Access
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Employee Directory & Geofence Settings
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Create employee accounts, assign reporting managers, configure geofence verification policies, and manage active logins.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              const el = document.getElementById('employee-directory-table');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] shadow-soft-xs transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-[#3D78C5]" />
            <span>Manage Employees</span>
          </button>

          <button
            onClick={() => {
              setForm((prev) => ({
                ...prev,
                employeeId: getNextEmployeeId(employees),
              }));
              setIsAddModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-[#123B66] hover:bg-[#194c80] shadow-soft-md transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-[#F5C542]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div id="employee-directory-table" className="bg-white rounded-3xl p-5 border border-[#E4EAF1] shadow-soft-xs flex flex-col xl:flex-row gap-3 items-center justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            placeholder="Search by employee name, ID, designation, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Geofence Filter Tabs */}
          <div className="flex items-center p-1 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl">
            <span className="text-[10px] font-bold uppercase text-[#667085] px-2 hidden sm:inline">
              Geofence:
            </span>
            <button
              onClick={() => setGeofenceFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                geofenceFilter === 'All'
                  ? 'bg-[#123B66] text-white shadow-soft-xs'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              All ({employees.length})
            </button>
            <button
              onClick={() => setGeofenceFilter('Mandatory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                geofenceFilter === 'Mandatory'
                  ? 'bg-[#3D78C5] text-white shadow-soft-xs'
                  : 'text-[#667085] hover:text-[#3D78C5]'
              }`}
            >
              Required ({geofenceMandatoryCount})
            </button>
            <button
              onClick={() => setGeofenceFilter('Exempted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                geofenceFilter === 'Exempted'
                  ? 'bg-amber-600 text-white shadow-soft-xs'
                  : 'text-[#667085] hover:text-amber-700'
              }`}
            >
              Exempted ({geofenceExemptedCount})
            </button>
          </div>

          {/* Account Status Filter */}
          <div className="flex items-center p-1 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'All' ? 'bg-[#123B66] text-white shadow-soft-xs' : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'Active' ? 'bg-emerald-600 text-white shadow-soft-xs' : 'text-[#667085] hover:text-emerald-700'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('Inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'Inactive' ? 'bg-red-600 text-white shadow-soft-xs' : 'text-[#667085] hover:text-red-600'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
          >
            <option value="All">All Calibration Departments</option>
            {ALL_CALIBRATION_DEPARTMENT_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar for Selected Employees */}
      {selectedEmployeeIds.length > 0 && (
        <div className="bg-[#123B66] text-white p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-soft-md animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
              {selectedEmployeeIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              {selectedEmployeeIds.length} Employee{selectedEmployeeIds.length > 1 ? 's' : ''} Selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkGeofence(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#3D78C5] hover:bg-[#2b64ad] text-white transition-colors flex items-center gap-1.5 shadow-soft-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5C542]" />
              <span>Enable Geofence for Selected</span>
            </button>

            <button
              onClick={() => handleBulkGeofence(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 border border-white/20"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>Exempt Selected from Geofence</span>
            </button>

            <button
              onClick={() => setSelectedEmployeeIds([])}
              className="px-2.5 py-1.5 rounded-xl text-xs text-white/70 hover:text-white"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="bg-white rounded-3xl border border-[#E4EAF1] shadow-soft-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E4EAF1] text-xs font-bold text-[#667085] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredEmployees.length > 0 &&
                      selectedEmployeeIds.length === filteredEmployees.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-[#123B66] focus:ring-[#123B66] cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4">Employee ID</th>
                <th className="py-4 px-6">Employee Details</th>
                <th className="py-4 px-6">Designation & Dept</th>
                <th className="py-4 px-6">Reporting Manager</th>
                <th className="py-4 px-6">Account Status</th>
                <th className="py-4 px-6">Geofence Policy & Punch</th>
                <th className="py-4 px-6 text-right whitespace-nowrap min-w-[190px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAF1]/70">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#667085] text-sm">
                    No employees matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const lat = emp.todayCoordinates?.lat || OFFICE_GEOFENCE.latitude;
                  const lng = emp.todayCoordinates?.lng || OFFICE_GEOFENCE.longitude;
                  const geo = verifyGeofence(lat, lng);
                  const isInactive = emp.status === 'Inactive';
                  const isGeofenceMandatory = emp.geofenceEnabled !== false;
                  const isSelected = selectedEmployeeIds.includes(emp.id);

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        isSelected
                          ? 'bg-[#EAF2FB]/50'
                          : isInactive
                          ? 'bg-red-50/20 opacity-80'
                          : ''
                      }`}
                    >
                      {/* Checkbox for Bulk Geofence selection */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(emp.id)}
                          className="w-4 h-4 rounded text-[#123B66] focus:ring-[#123B66] cursor-pointer"
                        />
                      </td>

                      {/* Employee ID */}
                      <td className="py-4 px-4 font-mono font-bold text-xs text-[#3D78C5] whitespace-nowrap">
                        {emp.employeeId}
                      </td>

                      {/* Employee Name, Email, Phone */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className={`w-9 h-9 rounded-xl object-cover border ${
                              isInactive ? 'border-red-300 grayscale' : 'border-[#E4EAF1]'
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-[#172033]">{emp.fullName}</p>
                              {emp.isManager && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-soft-2xs">
                                  <span>👔</span> Manager
                                </span>
                              )}
                              {isInactive && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.2 rounded">
                                  Login Blocked
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#667085]">{emp.email}</p>
                            <p className="text-[11px] text-[#667085]/80 font-mono">{emp.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Designation & Department */}
                      <td className="py-4 px-6">
                        <p className="text-xs font-bold text-[#172033]">{emp.designation}</p>
                        <p className="text-xs text-[#667085] mt-0.5">{emp.department}</p>
                      </td>

                      {/* Reporting Manager (Requirement 3) */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {emp.isManager ? (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl w-fit">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>
                              Manager ({employees.filter((e) => isEmployeeAssignedToManager(e.manager, emp.fullName)).length} reports)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-[#172033] font-medium bg-[#F8FAFC] border border-[#E4EAF1] px-2.5 py-1 rounded-xl w-fit">
                            <Briefcase className="w-3.5 h-3.5 text-[#3D78C5]" />
                            <span>{emp.manager || 'Not Assigned'}</span>
                          </div>
                        )}
                      </td>

                      {/* Account Status with 1-click Activate / Deactivate (Requirement 5) */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                              emp.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : emp.status === 'On Probation'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                emp.status === 'Active'
                                  ? 'bg-emerald-500'
                                  : emp.status === 'On Probation'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                            />
                            {emp.status}
                          </span>

                          <button
                            onClick={() => toggleEmployeeStatus(emp.id)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-xl transition-colors border ${
                              isInactive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                            }`}
                            title={isInactive ? 'Activate account to allow login' : 'Deactivate account to block login'}
                          >
                            {isInactive ? 'Activate' : 'Deactivate'}
                          </button>
                        </div>
                      </td>

                      {/* Geofence Policy & Punch Status (Requirement 4 & User Request) */}
                      <td className="py-4 px-6 text-xs whitespace-nowrap">
                        <div className="space-y-1.5">
                          {/* Geofence Policy Badge & 1-Click Toggle for this Selected Employee */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                isGeofenceMandatory
                                  ? 'bg-blue-50 text-[#123B66] border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isGeofenceMandatory ? (
                                <ShieldCheck className="w-3 h-3 text-[#3D78C5]" />
                              ) : (
                                <Compass className="w-3 h-3 text-amber-600" />
                              )}
                              <span>{isGeofenceMandatory ? 'Geofence: Required' : 'Geofence: Exempted'}</span>
                            </span>

                            <button
                              onClick={() => toggleEmployeeGeofence(emp.id)}
                              className="text-[10px] text-[#667085] hover:text-[#123B66] underline font-medium"
                              title={
                                isGeofenceMandatory
                                  ? 'Click to exempt this employee from Geofence'
                                  : 'Click to require Geofence for this employee'
                              }
                            >
                              {isGeofenceMandatory ? 'Exempt' : 'Enforce'}
                            </button>
                          </div>

                          {/* Live Punch Verification */}
                          {emp.todayLocation ? (
                            <button
                              onClick={() => setSelectedLocationEmployee(emp)}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-lg transition-colors border max-w-[210px] text-left ${
                                !isGeofenceMandatory
                                  ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                  : geo.isWithin
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              }`}
                              title={`Click to inspect coordinates (${lat}° N, ${lng}° E) on map`}
                            >
                              {geo.isWithin ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              )}
                              <div className="truncate">
                                <span>{geo.isWithin ? 'Within Geofence' : 'Outside Geofence'}</span>
                                <span className="text-[10px] text-slate-500 ml-1">({geo.distance}m)</span>
                              </div>
                            </button>
                          ) : (
                            <span className="text-[#667085] text-[11px] block">
                              {emp.todayCheckIn ? 'Office HQ (Verified)' : 'No Punch Recorded'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewEmployee(emp)}
                            className="p-1.5 rounded-lg text-[#667085] hover:text-[#3D78C5] hover:bg-[#EAF2FB] transition-colors"
                            title="View employee profile details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-[#667085] hover:text-[#123B66] hover:bg-[#F1F5F9] transition-colors"
                            title="Edit employee details, manager, and geofence"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTarget(emp);
                              setIsRelievingMode(false);
                              setRelieveDate(new Date().toISOString().split('T')[0]);
                              setRelieveReason('Resignation (Notice Period Served)');
                              setRelieveNotes('');
                              setClearanceChecks({ assets: true, kt: true, access: true, fnf: true });
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title={`Delete ${emp.fullName}'s profile`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Employee Creation Modal with Geofence Selection (Requirement 2, 3, 4) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#E4EAF1] shadow-soft-xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5]">
                  HR Administrator
                </span>
                <h3 className="text-xl font-extrabold text-[#172033] tracking-tight mt-1">
                  Create New Employee Account
                </h3>
                <p className="text-xs text-[#667085] mt-1">
                  Enter credentials, calibration division, and assign reporting manager & geofence policy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsUploadModalOpen(true);
                }}
                className="self-start sm:self-auto text-xs font-bold text-[#3D78C5] bg-[#EAF2FB] hover:bg-[#d6e7f8] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Employee Name */}
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Employee Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maya Krishnan"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#172033]">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#3D78C5] font-semibold">Starts with EMP41001</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. EMP41001"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3D78C5] uppercase"
                  />
                </div>

                {/* Department (Calibration Division) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#172033]">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#3D78C5] font-semibold">Calibration Division</span>
                  </div>
                  <select
                    value={form.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const roles = getRolesForDepartment(newDept);
                      setForm({
                        ...form,
                        department: newDept,
                        designation: roles[0] || form.designation,
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  >
                    {ALL_CALIBRATION_DEPARTMENT_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation / Role Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#172033]">
                      Designation / Role Title <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#3D78C5] font-semibold">Calibration Role</span>
                  </div>
                  <select
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  >
                    {getRolesForDepartment(form.department).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    {!getRolesForDepartment(form.department).includes(form.designation) && form.designation && (
                      <option value={form.designation}>{form.designation}</option>
                    )}
                  </select>
                </div>

                {/* Email ID */}
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. maya.k@atenhr.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98000 12345"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                {/* Employee Account Login Password (User Request) */}
                <div className="sm:col-span-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#3D78C5]" />
                      <label className="text-xs font-bold text-[#172033]">
                        Account Login Password <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <span className="text-[10px] text-[#667085] font-mono">
                      Default: <strong className="text-[#123B66]">msirindia1</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      placeholder="Set login password for this employee"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3D78C5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033] p-1 transition-colors"
                      title={showAddPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#3D78C5]" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    The employee will use this password alongside their Employee ID ({form.employeeId}) or email to sign in to the attendance portal.
                  </p>
                </div>

                {/* Manager Designation & Reporting Hierarchy (User Request: Yes / No option for Manager) */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#172033]">
                          Is this employee a Manager?
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF2FB] text-[#123B66]">
                          Reporting Hierarchy
                        </span>
                      </div>
                      <p className="text-[11px] text-[#667085] mt-0.5">
                        Choose whether this employee has team members reporting under them or reports to another manager.
                      </p>
                    </div>

                    {/* Manager Yes / No Pill Selector */}
                    <div className="inline-flex items-center p-1 bg-white border border-[#E4EAF1] rounded-xl self-start sm:self-auto shadow-sm">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, isManager: false })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !form.isManager
                            ? 'bg-[#123B66] text-white shadow-sm'
                            : 'text-[#667085] hover:text-[#172033]'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, isManager: true })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          form.isManager
                            ? 'bg-[#123B66] text-white shadow-sm'
                            : 'text-[#667085] hover:text-[#172033]'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Yes (Manager)
                      </button>
                    </div>
                  </div>

                  {!form.isManager ? (
                    /* When No: Select which manager this employee reports to */
                    <div className="pt-2 border-t border-[#E4EAF1]/70">
                      <label className="text-xs font-bold text-[#172033] block mb-1">
                        Assign Reporting Manager <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.manager}
                        onChange={(e) => setForm({ ...form, manager: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                      >
                        {allManagerOptions.map((mgr) => (
                          <option key={mgr} value={mgr}>
                            {mgr}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#667085] mt-1">
                        This reporting manager will oversee attendance regularizations and leave approvals for this employee.
                      </p>
                    </div>
                  ) : (
                    /* When Yes: Choose employees who report under this manager */
                    <div className="pt-3 border-t border-[#E4EAF1]/70 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-bold text-[#172033] block">
                            Choose Employees Under This Manager
                          </label>
                          <p className="text-[11px] text-[#667085]">
                            Select team members who will directly report to this manager.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#123B66] bg-[#EAF2FB] px-2.5 py-1 rounded-lg">
                            {selectedSubordinateIds.length} Selected
                          </span>
                          <button
                            type="button"
                            onClick={handleSelectAllSubordinates}
                            className="text-xs font-semibold text-[#3D78C5] hover:text-[#123B66] px-2 py-1 hover:bg-white rounded-lg transition-colors"
                          >
                            Select All
                          </button>
                          {selectedSubordinateIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedSubordinateIds([])}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 hover:bg-white rounded-lg transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Search box for subordinates */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
                        <input
                          type="text"
                          placeholder="Search employees by name, ID, or department..."
                          value={subordinateSearchQuery}
                          onChange={(e) => setSubordinateSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E4EAF1] rounded-xl text-xs focus:outline-none focus:border-[#3D78C5]"
                        />
                      </div>

                      {/* Scrollable list of selectable employees */}
                      <div className="max-h-52 overflow-y-auto rounded-xl border border-[#E4EAF1] bg-white divide-y divide-[#E4EAF1]">
                        {availableSubordinatesForAdd.length === 0 ? (
                          <div className="p-4 text-center text-xs text-[#667085]">
                            No employees match your search.
                          </div>
                        ) : (
                          availableSubordinatesForAdd.map((emp) => {
                            const isSelected = selectedSubordinateIds.includes(emp.id);
                            return (
                              <label
                                key={emp.id}
                                className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-[#F0F6FF]' : 'hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSubordinate(emp.id)}
                                  className="w-4 h-4 rounded text-[#123B66] border-[#E4EAF1] focus:ring-[#3D78C5] cursor-pointer"
                                />
                                <img
                                  src={emp.avatarUrl}
                                  alt={emp.fullName}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#172033] truncate">
                                      {emp.fullName}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-[#667085]">
                                      {emp.employeeId}
                                    </span>
                                    {emp.isManager && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                        Manager
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#667085] truncate">
                                    {emp.designation} • {emp.department}
                                  </p>
                                </div>
                                <div className="text-right text-[10px] text-[#667085] hidden sm:block">
                                  <span>Currently: {emp.manager?.split('(')[0] || 'Unassigned'}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                      <p className="text-[11px] text-[#3D78C5] bg-[#EAF2FB] p-2 rounded-xl">
                        💡 All selected employees will automatically have their reporting manager updated to this new manager upon creation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Dedicated Geofence Selection for this Employee (User Request) */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EAF2FB] text-[#3D78C5] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#172033] block">
                          Geofence Verification for this Employee
                        </label>
                        <p className="text-[11px] text-[#667085]">
                          Specify whether this employee must punch within the permitted office location perimeter.
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.geofenceEnabled}
                        onChange={(e) => setForm({ ...form, geofenceEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#123B66]"></div>
                    </label>
                  </div>

                  {form.geofenceEnabled ? (
                    <div className="pt-2 border-t border-[#E4EAF1]/70 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      <div>
                        <label className="text-[11px] font-bold text-[#172033] block mb-1">
                          Permitted Geofence Perimeter
                        </label>
                        <select
                          value={form.assignedGeofence}
                          onChange={(e) => setForm({ ...form, assignedGeofence: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                        >
                          {geofencePerimeterOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col justify-center bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-900">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Strict 250m Verification Active
                        </span>
                        <span className="text-[10px] text-emerald-700 mt-0.5">
                          Attendance is validated against GPS coordinates when punching in/out.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#E4EAF1]/70 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold block text-[11px]">Geofence Exempted / Flexible Remote</span>
                        <span className="text-[10px] text-amber-700">
                          This employee is permitted to punch from client locations or remote sites without distance checks.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Toggle (Requirement 5) */}
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Account Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  >
                    <option value="Active">Active (Permitted to Log In)</option>
                    <option value="Inactive">Inactive (Login Blocked)</option>
                    <option value="On Probation">On Probation</option>
                  </select>
                </div>

                {/* Joining Date */}
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4EAF1]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#194c80] transition-colors shadow-soft-xs"
                >
                  Create Employee Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee & Reporting Manager & Geofence Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#E4EAF1] shadow-soft-xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditTarget(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5]">
                Account Management
              </span>
              <h3 className="text-xl font-extrabold text-[#172033] tracking-tight mt-1">
                Edit Employee & Geofence Policy
              </h3>
              <p className="text-xs text-[#667085] mt-1">
                Modify employee details, reassign reporting manager, or configure geofence verification rules.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editForm.employeeId}
                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#172033]">Department</label>
                    <span className="text-[10px] text-[#3D78C5] font-semibold">Calibration Division</span>
                  </div>
                  <select
                    value={editForm.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const roles = getRolesForDepartment(newDept);
                      setEditForm({
                        ...editForm,
                        department: newDept,
                        designation: roles[0] || editForm.designation,
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  >
                    {ALL_CALIBRATION_DEPARTMENT_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#172033]">Designation / Role</label>
                    <span className="text-[10px] text-[#3D78C5] font-semibold">Calibration Role</span>
                  </div>
                  <select
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  >
                    {getRolesForDepartment(editForm.department).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    {!getRolesForDepartment(editForm.department).includes(editForm.designation) && editForm.designation && (
                      <option value={editForm.designation}>{editForm.designation}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Email ID</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5]"
                  />
                </div>

                {/* Account Password in Edit Modal */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#3D78C5]" />
                      <span>Employee Login Password</span>
                    </label>
                    <span className="text-[10px] text-[#667085]">
                      Leave as is or enter new password
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      placeholder="Enter new login password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3D78C5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033] p-1 transition-colors"
                      title={showEditPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#3D78C5]" />}
                    </button>
                  </div>
                </div>

                {/* Manager Designation & Reporting Hierarchy (User Request: Yes / No option for Manager in Edit Modal) */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#172033]">
                          Is this employee a Manager?
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF2FB] text-[#123B66]">
                          Reporting Hierarchy
                        </span>
                      </div>
                      <p className="text-[11px] text-[#667085] mt-0.5">
                        Configure whether this employee has team members reporting to them or reports to another manager.
                      </p>
                    </div>

                    {/* Manager Yes / No Pill Selector */}
                    <div className="inline-flex items-center p-1 bg-white border border-[#E4EAF1] rounded-xl self-start sm:self-auto shadow-sm">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, isManager: false })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !editForm.isManager
                            ? 'bg-[#123B66] text-white shadow-sm'
                            : 'text-[#667085] hover:text-[#172033]'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, isManager: true })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          editForm.isManager
                            ? 'bg-[#123B66] text-white shadow-sm'
                            : 'text-[#667085] hover:text-[#172033]'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Yes (Manager)
                      </button>
                    </div>
                  </div>

                  {!editForm.isManager ? (
                    /* When No: Select which manager this employee reports to */
                    <div className="pt-2 border-t border-[#E4EAF1]/70">
                      <label className="text-xs font-bold text-[#172033] block mb-1">
                        Assigned Reporting Manager
                      </label>
                      <select
                        value={editForm.manager}
                        onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                      >
                        {allManagerOptions
                          .filter((m) => !editTarget || !m.toLowerCase().includes(editTarget.fullName.toLowerCase()))
                          .map((mgr) => (
                            <option key={mgr} value={mgr}>
                              {mgr}
                            </option>
                          ))}
                      </select>
                      <p className="text-[11px] text-[#667085] mt-1">
                        This reporting manager will oversee attendance regularizations and leave approvals for this employee.
                      </p>
                    </div>
                  ) : (
                    /* When Yes: Choose employees who report under this manager */
                    <div className="pt-3 border-t border-[#E4EAF1]/70 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-bold text-[#172033] block">
                            Choose Employees Under This Manager
                          </label>
                          <p className="text-[11px] text-[#667085]">
                            Select team members who will directly report to {editForm.fullName || 'this manager'}.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#123B66] bg-[#EAF2FB] px-2.5 py-1 rounded-lg">
                            {editSelectedSubordinateIds.length} Selected
                          </span>
                          <button
                            type="button"
                            onClick={handleSelectAllEditSubordinates}
                            className="text-xs font-semibold text-[#3D78C5] hover:text-[#123B66] px-2 py-1 hover:bg-white rounded-lg transition-colors"
                          >
                            Select All
                          </button>
                          {editSelectedSubordinateIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setEditSelectedSubordinateIds([])}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 hover:bg-white rounded-lg transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Search box for subordinates */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
                        <input
                          type="text"
                          placeholder="Search employees by name, ID, or department..."
                          value={editSubordinateSearchQuery}
                          onChange={(e) => setEditSubordinateSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E4EAF1] rounded-xl text-xs focus:outline-none focus:border-[#3D78C5]"
                        />
                      </div>

                      {/* Scrollable list of selectable employees */}
                      <div className="max-h-52 overflow-y-auto rounded-xl border border-[#E4EAF1] bg-white divide-y divide-[#E4EAF1]">
                        {availableSubordinatesForEdit.length === 0 ? (
                          <div className="p-4 text-center text-xs text-[#667085]">
                            No employees match your search.
                          </div>
                        ) : (
                          availableSubordinatesForEdit.map((emp) => {
                            const isSelected = editSelectedSubordinateIds.includes(emp.id);
                            return (
                              <label
                                key={emp.id}
                                className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-[#F0F6FF]' : 'hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleEditSubordinate(emp.id)}
                                  className="w-4 h-4 rounded text-[#123B66] border-[#E4EAF1] focus:ring-[#3D78C5] cursor-pointer"
                                />
                                <img
                                  src={emp.avatarUrl}
                                  alt={emp.fullName}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#172033] truncate">
                                      {emp.fullName}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-[#667085]">
                                      {emp.employeeId}
                                    </span>
                                    {emp.isManager && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                        Manager
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#667085] truncate">
                                    {emp.designation} • {emp.department}
                                  </p>
                                </div>
                                <div className="text-right text-[10px] text-[#667085] hidden sm:block">
                                  <span>Currently: {emp.manager?.split('(')[0] || 'Unassigned'}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                      <p className="text-[11px] text-[#3D78C5] bg-[#EAF2FB] p-2 rounded-xl">
                        💡 Saving changes will immediately assign all selected employees to report to {editForm.fullName || 'this manager'}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Geofence Selection in Edit Modal (User Request) */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EAF2FB] text-[#3D78C5] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#172033] block">
                          Geofence Verification for this Employee
                        </label>
                        <p className="text-[11px] text-[#667085]">
                          Toggle whether {editForm.fullName || 'this employee'} is required to punch within permitted geofence.
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.geofenceEnabled}
                        onChange={(e) => setEditForm({ ...editForm, geofenceEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#123B66]"></div>
                    </label>
                  </div>

                  {editForm.geofenceEnabled ? (
                    <div className="pt-2 border-t border-[#E4EAF1]/70 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      <div>
                        <label className="text-[11px] font-bold text-[#172033] block mb-1">
                          Permitted Geofence Perimeter
                        </label>
                        <select
                          value={editForm.assignedGeofence}
                          onChange={(e) => setEditForm({ ...editForm, assignedGeofence: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-[#E4EAF1] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
                        >
                          {geofencePerimeterOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col justify-center bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-900">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Geofence Enforcement Active
                        </span>
                        <span className="text-[10px] text-emerald-700 mt-0.5">
                          GPS location must be verified within permitted distance when punching.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#E4EAF1]/70 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold block text-[11px]">Geofence Exempted / Flexible Remote</span>
                        <span className="text-[10px] text-amber-700">
                          This employee is allowed to punch from any location without distance warnings.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Toggle */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Account Status (Controls Login Access)
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3D78C5]"
                  >
                    <option value="Active">Active (Permitted to Log In)</option>
                    <option value="Inactive">Inactive (Login Blocked by Administrator)</option>
                    <option value="On Probation">On Probation</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4EAF1]">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#194c80] transition-colors shadow-soft-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Detail Modal */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E4EAF1] shadow-soft-xl relative">
            <button
              onClick={() => setViewEmployee(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 pb-4 border-b border-[#E4EAF1]">
              <img
                src={viewEmployee.avatarUrl}
                alt={viewEmployee.fullName}
                className="w-14 h-14 rounded-2xl object-cover border border-[#E4EAF1]"
              />
              <div>
                <h4 className="font-bold text-lg text-[#172033]">{viewEmployee.fullName}</h4>
                <p className="text-xs text-[#3D78C5] font-mono">ID: {viewEmployee.employeeId}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF2FB] text-[#3D78C5]">
                  {viewEmployee.designation}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 py-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#E4EAF1]/50">
                <span className="text-[#667085]">Department:</span>
                <span className="font-bold text-[#172033]">{viewEmployee.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E4EAF1]/50">
                <span className="text-[#667085]">Email:</span>
                <span className="font-medium text-[#172033]">{viewEmployee.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E4EAF1]/50">
                <span className="text-[#667085]">Phone:</span>
                <span className="font-medium text-[#172033]">{viewEmployee.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E4EAF1]/50 items-center">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#3D78C5]" />
                  <span>Login Password:</span>
                </span>
                <span className="font-mono font-bold text-[#123B66] bg-[#EAF2FB] px-2 py-0.5 rounded-md text-[11px]">
                  {viewEmployee.password || 'msirindia1'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E4EAF1]/50">
                <span className="text-[#667085]">Reporting Manager:</span>
                <span className="font-bold text-[#172033]">{viewEmployee.manager}</span>
              </div>
              {viewEmployee.isManager && (
                <div className="flex justify-between py-1.5 border-b border-[#E4EAF1]/50 items-center">
                  <span className="text-[#667085]">Role Type:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-amber-600" />
                    Reporting Manager ({employees.filter(e => isEmployeeAssignedToManager(e.manager, viewEmployee.fullName)).length} direct reports)
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-[#E4EAF1]/50">
                <span className="text-[#667085]">Geofence Policy:</span>
                <span
                  className={`font-bold ${
                    viewEmployee.geofenceEnabled !== false ? 'text-[#3D78C5]' : 'text-amber-600'
                  }`}
                >
                  {viewEmployee.geofenceEnabled !== false
                    ? `Mandatory (${viewEmployee.assignedGeofence || 'MSIR HQ 250m'})`
                    : 'Exempted / Flexible Remote'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E4EAF1]/50">
                <span className="text-[#667085]">Account Status:</span>
                <span
                  className={`font-bold ${
                    viewEmployee.status === 'Active' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {viewEmployee.status}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#667085]">Today's Punch Status:</span>
                <span className="font-bold text-[#3D78C5]">
                  {viewEmployee.todayStatus} {viewEmployee.todayCheckIn ? `(${viewEmployee.todayCheckIn})` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#E4EAF1]">
              <button
                type="button"
                onClick={() => {
                  const target = viewEmployee;
                  setViewEmployee(null);
                  openEditModal(target);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#EAF2FB] text-[#123B66] hover:bg-[#d5e7f9] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setViewEmployee(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#123B66] text-white hover:bg-[#194c80] font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employee Profile Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-red-100 shadow-soft-xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setDeleteTarget(null);
                setIsRelievingMode(false);
              }}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#F8FAFC] text-[#667085] hover:bg-[#EAF2FB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-soft-xs flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  Admin Workforce Action
                </span>
                <h3 className="text-xl font-extrabold text-[#172033] tracking-tight">
                  Delete Employee Profile
                </h3>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-red-50/40 border border-red-100 flex items-center gap-3.5">
              <img
                src={deleteTarget.avatarUrl}
                alt={deleteTarget.fullName}
                className="w-12 h-12 rounded-xl object-cover border border-[#E4EAF1]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#172033] truncate">
                    {deleteTarget.fullName}
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-[#3D78C5] bg-[#EAF2FB] px-2 py-0.5 rounded-full flex-shrink-0">
                    ID: {deleteTarget.employeeId}
                  </span>
                </div>
                <p className="text-xs text-[#667085] mt-0.5">
                  {deleteTarget.designation} • {deleteTarget.department}
                </p>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  Joining Date: <span className="font-medium text-[#172033]">{deleteTarget.joiningDate}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#667085] mt-4 leading-relaxed">
              Are you sure you want to permanently delete this employee profile? Once confirmed, <strong className="text-[#172033]">{deleteTarget.fullName}</strong> will be removed from the active roster.
            </p>

            <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-[#E4EAF1]">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setIsRelievingMode(false);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete()}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 shadow-soft-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Location Map Viewer Modal */}
      <EmployeeLocationModal
        isOpen={!!selectedLocationEmployee}
        onClose={() => setSelectedLocationEmployee(null)}
        employee={selectedLocationEmployee}
      />

      {/* Bulk Employee & Manager Upload Modal */}
      <BulkEmployeeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportComplete={(imported) => {
          importEmployees(imported);
        }}
      />

      {/* Cloud Database Connection Settings Modal */}
      <DatabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};
