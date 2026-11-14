export interface CalibrationDepartment {
  id: string;
  name: string;
  code: string;
  roles: string[];
}

export const CALIBRATION_DEPARTMENTS: CalibrationDepartment[] = [
  {
    id: 'mech-mass',
    name: 'Mechanical & Mass Calibration',
    code: 'MECH-MASS',
    roles: [
      'Technical Lead - Mechanical Metrology',
      'Senior Mass Calibration Engineer',
      'Mass & Precision Balance Metrologist',
      'Force, Torque & Hardness Calibration Engineer',
      'Mechanical Calibration Technician',
      'Calibration Trainee - Mass Metrology',
    ],
  },
  {
    id: 'thermal',
    name: 'Thermal & Temperature Calibration',
    code: 'THERMAL',
    roles: [
      'Thermal Metrology Manager',
      'Senior Temperature Calibration Engineer',
      'Chamber, Bath & Furnace Calibration Specialist',
      'RTD & Thermocouple Calibration Technician',
      'Thermal Calibration Technician',
      'Temperature Metrology Trainee',
    ],
  },
  {
    id: 'electro',
    name: 'Electro-Technical Calibration',
    code: 'ELECTRO',
    roles: [
      'Electro-Technical Laboratory Head',
      'Senior Electrical Metrology Engineer',
      'Precision Voltage, Current & Resistance Specialist',
      'RF & Oscilloscope Calibration Engineer',
      'Electrical Calibration Technician',
    ],
  },
  {
    id: 'dimensional',
    name: 'Dimensional Metrology & Calibration',
    code: 'DIMENSIONAL',
    roles: [
      'Dimensional Calibration Lead',
      'Senior Dimensional Metrology Engineer',
      'Vernier, Micrometer & Gauge Specialist',
      'CMM & Profile Projector Specialist',
      'Dimensional Calibration Technician',
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure & Vacuum Calibration',
    code: 'PRESSURE',
    roles: [
      'Pressure Calibration Technical Manager',
      'Senior Pressure & Vacuum Metrologist',
      'Dead Weight Tester & Gauge Specialist',
      'Pressure & Vacuum Technician',
    ],
  },
  {
    id: 'fluid-flow',
    name: 'Fluid Flow & Volume Calibration',
    code: 'FLOW-VOL',
    roles: [
      'Fluid & Flow Metrology Engineer',
      'Glassware & Micropipette Calibration Specialist',
      'Flow Meter Calibration Technician',
    ],
  },
  {
    id: 'on-site',
    name: 'On-Site & Field Calibration Services',
    code: 'ONSITE',
    roles: [
      'On-Site Calibration Services Manager',
      'Senior Industrial Site Calibration Engineer',
      'Field Metrology Technician',
      'Customer Plant Metrology Inspector',
    ],
  },
  {
    id: 'quality-nabl',
    name: 'Quality Assurance & NABL Accreditation',
    code: 'QA-NABL',
    roles: [
      'Quality Manager (ISO/IEC 17025)',
      'Authorized NABL Technical Signatory',
      'Laboratory Internal Quality Auditor',
      'Quality & Uncertainty Documentation Specialist',
    ],
  },
  {
    id: 'lab-ops',
    name: 'Operations & Laboratory Management',
    code: 'LAB-OPS',
    roles: [
      'Chief Executive Officer / Lab Director',
      'Operations Head & Laboratory In-Charge',
      'Reference Master Standards Custodian',
      'Customer Dispatch & Sample Custodian',
    ],
  },
  {
    id: 'admin-hr',
    name: 'Administration & HR',
    code: 'ADMIN-HR',
    roles: [
      'HR Administrator',
      'Customer Support & Work-Order Coordinator',
      'Billing & Calibration Accounts Officer',
    ],
  },
];

export const ALL_CALIBRATION_DEPARTMENT_NAMES = CALIBRATION_DEPARTMENTS.map((d) => d.name);

export const getRolesForDepartment = (deptName: string): string[] => {
  const match = CALIBRATION_DEPARTMENTS.find((d) => d.name.toLowerCase() === (deptName || '').toLowerCase());
  if (match) return match.roles;
  return [
    'Technical Manager (Calibration)',
    'Senior Calibration Engineer',
    'Calibration Engineer',
    'Calibration Technician',
    'Quality Manager (ISO/IEC 17025)',
  ];
};

