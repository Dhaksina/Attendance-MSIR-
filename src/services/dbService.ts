import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { getFirestoreDb, isFirebaseConfigured } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import {
  EmployeeDirectoryItem,
  DailyAttendanceRecord,
  LeaveRequest,
  RegularizationRequest,
} from '../types';

export type DatabaseProvider = 'supabase' | 'firebase' | 'local';

export interface DatabaseStatus {
  connected: boolean;
  provider: DatabaseProvider;
  name: string;
  details?: string;
}

// Determines which database is active. Default to Firebase when configured.
export const getActiveProvider = (): DatabaseProvider => {
  try {
    const chosen = localStorage.getItem('msir_active_db_provider') as DatabaseProvider;
    if (chosen === 'supabase' && isSupabaseConfigured()) return 'supabase';
    if (chosen === 'firebase' && isFirebaseConfigured()) return 'firebase';
  } catch {}
  if (isFirebaseConfigured()) return 'firebase';
  if (isSupabaseConfigured()) return 'supabase';
  return 'local';
};

// Firestore rejects `undefined` values. This helper cleans all undefined keys before upload.
const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
};

export const dbService = {
  getStatus(): DatabaseStatus {
    const active = getActiveProvider();
    if (active === 'firebase') {
      return {
        connected: true,
        provider: 'firebase',
        name: 'Firebase Firestore',
        details: 'Connected to Cloud Firestore project "attendancemsir". Real-time multi-device sync active.',
      };
    }
    if (active === 'supabase') {
      return {
        connected: true,
        provider: 'supabase',
        name: 'Supabase PostgreSQL',
        details: 'Connected to Supabase Cloud PostgreSQL database.',
      };
    }
    return {
      connected: false,
      provider: 'local',
      name: 'Local Storage (Awaiting DB Keys)',
      details: 'Operating in local browser storage mode. Connect Firebase or Supabase to sync across laptops.',
    };
  },

  async testConnection(): Promise<{ success: boolean; provider: string; message: string; count?: number }> {
    const active = getActiveProvider();
    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (!firestore) {
        return { success: false, provider: 'Firebase', message: 'Firebase SDK not initialized. Verify API keys in .env' };
      }
      try {
        const snap = await getDocs(collection(firestore, 'employees'));
        return {
          success: true,
          provider: 'Firebase Firestore',
          message: `Connected successfully! Found ${snap.size} employee record(s) in cloud database.`,
          count: snap.size,
        };
      } catch (err: any) {
        return {
          success: false,
          provider: 'Firebase Firestore',
          message: err?.message || 'Failed to query Firestore. Check security rules and internet connection.',
        };
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, provider: 'Supabase', message: 'Supabase client not initialized.' };
      }
      try {
        const { data, error } = await supabase.from('employees').select('*').limit(5);
        if (error) {
          return { success: false, provider: 'Supabase', message: `Supabase error: ${error.message}` };
        }
        return {
          success: true,
          provider: 'Supabase',
          message: `Connected successfully! Retrieved ${Array.isArray(data) ? data.length : 0} employee records.`,
          count: Array.isArray(data) ? data.length : 0,
        };
      } catch (err: any) {
        return { success: false, provider: 'Supabase', message: err?.message || 'Failed to reach Supabase endpoint.' };
      }
    }
    return { success: false, provider: 'Local Storage', message: 'No cloud database active.' };
  },

  // -------------------------------------------------------------
  // EMPLOYEES & MANAGERS
  // -------------------------------------------------------------
  async getEmployees(): Promise<EmployeeDirectoryItem[]> {
    const active = getActiveProvider();

    // 1. Try Firebase Firestore
    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          const snapshot = await getDocs(collection(firestore, 'employees'));
          const list = snapshot.docs.map((d) => d.data() as EmployeeDirectoryItem);
          if (list.length > 0) {
            try {
              localStorage.setItem('msir_employees_directory', JSON.stringify(list));
            } catch {}
            return list;
          }
        } catch (err) {
          console.warn('Firestore getEmployees notice:', err);
        }
      }
    }

    // 2. Try Supabase
    if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('employees').select('*');
          if (!error && Array.isArray(data) && data.length > 0) {
            try {
              localStorage.setItem('msir_employees_directory', JSON.stringify(data));
            } catch {}
            return data as EmployeeDirectoryItem[];
          }
        } catch (err) {
          console.warn('Supabase getEmployees notice:', err);
        }
      }
    }

    // 3. Fallback to LocalStorage
    try {
      const saved = localStorage.getItem('msir_employees_directory');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  async saveEmployee(employee: EmployeeDirectoryItem): Promise<void> {
    const active = getActiveProvider();
    const cleanData = sanitizeForFirestore(employee);

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          await setDoc(doc(firestore, 'employees', employee.employeeId), cleanData, { merge: true });
        } catch (err) {
          console.error('Firestore saveEmployee error:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('employees').upsert(employee, { onConflict: 'employeeId' });
        } catch (err) {
          console.error('Supabase saveEmployee error:', err);
        }
      }
    }

    // Keep LocalStorage in sync
    try {
      const saved = localStorage.getItem('msir_employees_directory');
      const list: EmployeeDirectoryItem[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((e) => e.employeeId === employee.employeeId);
      if (idx !== -1) {
        list[idx] = employee;
      } else {
        list.unshift(employee);
      }
      localStorage.setItem('msir_employees_directory', JSON.stringify(list));
    } catch {}
  },

  async bulkSaveEmployees(employees: EmployeeDirectoryItem[]): Promise<void> {
    if (!employees || employees.length === 0) return;
    const active = getActiveProvider();

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          const CHUNK_SIZE = 400; // Firestore batch limit is 500
          for (let i = 0; i < employees.length; i += CHUNK_SIZE) {
            const chunk = employees.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(firestore);
            chunk.forEach((emp) => {
              const docRef = doc(firestore, 'employees', emp.employeeId);
              batch.set(docRef, sanitizeForFirestore(emp), { merge: true });
            });
            await batch.commit();
          }
        } catch (err) {
          console.error('Firestore bulkSaveEmployees error:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('employees').upsert(employees, { onConflict: 'employeeId' });
        } catch (err) {
          console.error('Supabase bulkSaveEmployees error:', err);
        }
      }
    }

    // Keep LocalStorage in sync
    try {
      const saved = localStorage.getItem('msir_employees_directory');
      const existing: EmployeeDirectoryItem[] = saved ? JSON.parse(saved) : [];
      const incomingIds = new Set(employees.map((e) => e.employeeId.toUpperCase()));
      const combined = [...employees, ...existing.filter((e) => !incomingIds.has(e.employeeId.toUpperCase()))];
      localStorage.setItem('msir_employees_directory', JSON.stringify(combined));
    } catch {}
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    const active = getActiveProvider();

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          await deleteDoc(doc(firestore, 'employees', employeeId));
        } catch (err) {
          console.error('Firestore deleteEmployee error:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('employees').delete().eq('employeeId', employeeId);
        } catch (err) {
          console.error('Supabase deleteEmployee error:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_employees_directory');
      if (saved) {
        const list: EmployeeDirectoryItem[] = JSON.parse(saved);
        const filtered = list.filter((e) => e.employeeId !== employeeId);
        localStorage.setItem('msir_employees_directory', JSON.stringify(filtered));
      }
    } catch {}
  },

  // -------------------------------------------------------------
  // ATTENDANCE RECORDS
  // -------------------------------------------------------------
  async getAttendanceRecords(): Promise<DailyAttendanceRecord[]> {
    const active = getActiveProvider();

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          const snapshot = await getDocs(collection(firestore, 'attendance'));
          const list = snapshot.docs.map((d) => d.data() as DailyAttendanceRecord);
          return list;
        } catch (err) {
          console.warn('Firestore getAttendanceRecords notice:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('attendance').select('*').order('date', { ascending: false });
          if (!error && Array.isArray(data)) {
            return data as DailyAttendanceRecord[];
          }
        } catch (err) {
          console.warn('Supabase getAttendanceRecords notice:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_attendance_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  async saveAttendanceRecord(record: DailyAttendanceRecord): Promise<void> {
    const active = getActiveProvider();
    const cleanData = sanitizeForFirestore(record);

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          await setDoc(doc(firestore, 'attendance', record.id), cleanData, { merge: true });
        } catch (err) {
          console.error('Firestore saveAttendanceRecord error:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('attendance').upsert(record, { onConflict: 'id' });
        } catch (err) {
          console.error('Supabase saveAttendanceRecord error:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_attendance_history');
      const list: DailyAttendanceRecord[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((a) => a.id === record.id);
      if (idx !== -1) list[idx] = record;
      else list.unshift(record);
      localStorage.setItem('msir_attendance_history', JSON.stringify(list));
    } catch {}
  },

  // -------------------------------------------------------------
  // LEAVE REQUESTS
  // -------------------------------------------------------------
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const active = getActiveProvider();

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          const snapshot = await getDocs(collection(firestore, 'leave_requests'));
          const list = snapshot.docs.map((d) => d.data() as LeaveRequest);
          return list;
        } catch (err) {
          console.warn('Firestore getLeaveRequests notice:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('leave_requests').select('*').order('appliedDate', { ascending: false });
          if (!error && Array.isArray(data)) {
            return data as LeaveRequest[];
          }
        } catch (err) {
          console.warn('Supabase getLeaveRequests notice:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_leave_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    const active = getActiveProvider();
    const cleanData = sanitizeForFirestore(request);

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          await setDoc(doc(firestore, 'leave_requests', request.id), cleanData, { merge: true });
        } catch (err) {
          console.error('Firestore saveLeaveRequest error:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('leave_requests').upsert(request, { onConflict: 'id' });
        } catch (err) {
          console.error('Supabase saveLeaveRequest error:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_leave_requests');
      const list: LeaveRequest[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((l) => l.id === request.id);
      if (idx !== -1) list[idx] = request;
      else list.unshift(request);
      localStorage.setItem('msir_leave_requests', JSON.stringify(list));
    } catch {}
  },

  async deleteLeaveRequest(id: string): Promise<void> {
    const active = getActiveProvider();

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          await deleteDoc(doc(firestore, 'leave_requests', id));
        } catch (err) {
          console.error('Firestore deleteLeaveRequest error:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('leave_requests').delete().eq('id', id);
        } catch (err) {
          console.error('Supabase deleteLeaveRequest error:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_leave_requests');
      if (saved) {
        const list: LeaveRequest[] = JSON.parse(saved);
        localStorage.setItem('msir_leave_requests', JSON.stringify(list.filter((l) => l.id !== id)));
      }
    } catch {}
  },

  // -------------------------------------------------------------
  // REGULARIZATION REQUESTS
  // -------------------------------------------------------------
  async getRegularizationRequests(): Promise<RegularizationRequest[]> {
    const active = getActiveProvider();

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          const snapshot = await getDocs(collection(firestore, 'regularization_requests'));
          const list = snapshot.docs.map((d) => d.data() as RegularizationRequest);
          return list;
        } catch (err) {
          console.warn('Firestore getRegularizationRequests notice:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('regularization_requests')
            .select('*')
            .order('appliedDate', { ascending: false });
          if (!error && Array.isArray(data)) {
            return data as RegularizationRequest[];
          }
        } catch (err) {
          console.warn('Supabase getRegularizationRequests notice:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_regularization_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  async saveRegularizationRequest(request: RegularizationRequest): Promise<void> {
    const active = getActiveProvider();
    const cleanData = sanitizeForFirestore(request);

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          await setDoc(doc(firestore, 'regularization_requests', request.id), cleanData, { merge: true });
        } catch (err) {
          console.error('Firestore saveRegularizationRequest error:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('regularization_requests').upsert(request, { onConflict: 'id' });
        } catch (err) {
          console.error('Supabase saveRegularizationRequest error:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_regularization_requests');
      const list: RegularizationRequest[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((r) => r.id === request.id);
      if (idx !== -1) list[idx] = request;
      else list.unshift(request);
      localStorage.setItem('msir_regularization_requests', JSON.stringify(list));
    } catch {}
  },

  async deleteRegularizationRequest(id: string): Promise<void> {
    const active = getActiveProvider();

    if (active === 'firebase') {
      const firestore = getFirestoreDb();
      if (firestore) {
        try {
          await deleteDoc(doc(firestore, 'regularization_requests', id));
        } catch (err) {
          console.error('Firestore deleteRegularizationRequest error:', err);
        }
      }
    } else if (active === 'supabase') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('regularization_requests').delete().eq('id', id);
        } catch (err) {
          console.error('Supabase deleteRegularizationRequest error:', err);
        }
      }
    }

    try {
      const saved = localStorage.getItem('msir_regularization_requests');
      if (saved) {
        const list: RegularizationRequest[] = JSON.parse(saved);
        localStorage.setItem('msir_regularization_requests', JSON.stringify(list.filter((r) => r.id !== id)));
      }
    } catch {}
  },

  // -------------------------------------------------------------
  // REAL-TIME MULTI-DEVICE LISTENERS (Firebase Firestore)
  // -------------------------------------------------------------
  subscribeToLeaveRequests(callback: (leaves: LeaveRequest[]) => void): () => void {
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        return onSnapshot(
          collection(firestore, 'leave_requests'),
          (snapshot) => {
            const list = snapshot.docs.map((d) => d.data() as LeaveRequest);
            callback(list);
          },
          (err) => {
            console.warn('Firestore leave_requests listener error:', err);
          }
        );
      } catch (err) {
        console.warn('Failed to attach Firestore leave_requests listener:', err);
      }
    }
    return () => {};
  },

  subscribeToRegularizations(callback: (regs: RegularizationRequest[]) => void): () => void {
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        return onSnapshot(
          collection(firestore, 'regularization_requests'),
          (snapshot) => {
            const list = snapshot.docs.map((d) => d.data() as RegularizationRequest);
            callback(list);
          },
          (err) => {
            console.warn('Firestore regularization_requests listener error:', err);
          }
        );
      } catch (err) {
        console.warn('Failed to attach Firestore regularization_requests listener:', err);
      }
    }
    return () => {};
  },

  subscribeToEmployees(callback: (employees: EmployeeDirectoryItem[]) => void): () => void {
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        return onSnapshot(
          collection(firestore, 'employees'),
          (snapshot) => {
            const list = snapshot.docs.map((d) => d.data() as EmployeeDirectoryItem);
            callback(list);
          },
          (err) => {
            console.warn('Firestore employees listener error:', err);
          }
        );
      } catch (err) {
        console.warn('Failed to attach Firestore employees listener:', err);
      }
    }
    return () => {};
  },

  subscribeToAttendance(callback: (records: DailyAttendanceRecord[]) => void): () => void {
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        return onSnapshot(
          collection(firestore, 'attendance'),
          (snapshot) => {
            const list = snapshot.docs.map((d) => d.data() as DailyAttendanceRecord);
            callback(list);
          },
          (err) => {
            console.warn('Firestore attendance listener error:', err);
          }
        );
      } catch (err) {
        console.warn('Failed to attach Firestore attendance listener:', err);
      }
    }
    return () => {};
  },
};
