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
    if (isFirebaseConfigured()) {
      return {
        connected: true,
        provider: 'firebase',
        name: 'Firebase Firestore',
        details: 'Connected to Cloud Firestore project "attendancemsir".',
      };
    }
    if (isSupabaseConfigured()) {
      return {
        connected: true,
        provider: 'supabase',
        name: 'Supabase PostgreSQL',
        details: 'Live cloud database connected via Supabase Client.',
      };
    }
    return {
      connected: false,
      provider: 'local',
      name: 'Local Storage (Awaiting DB Keys)',
      details: 'Operating in secure local mode. Enter Supabase or Firebase credentials to sync with cloud database.',
    };
  },

  // -------------------------------------------------------------
  // EMPLOYEES & MANAGERS
  // -------------------------------------------------------------
  async getEmployees(): Promise<EmployeeDirectoryItem[]> {
    // 1. Try Firebase Firestore
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        const snapshot = await getDocs(collection(firestore, 'employees'));
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as EmployeeDirectoryItem);
          try {
            localStorage.setItem('msir_employees_directory', JSON.stringify(list));
          } catch {}
          return list;
        }
      } catch (err) {
        console.warn('Firestore getEmployees error, falling back to local storage:', err);
      }
    }

    // 2. Try Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          return data as EmployeeDirectoryItem[];
        }
      } catch (err) {
        console.warn('Supabase getEmployees failed:', err);
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
    const cleanData = sanitizeForFirestore(employee);

    // Save to Firebase Firestore
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'employees', employee.employeeId), cleanData, { merge: true });
        console.log(`[Firebase] Successfully synced employee/manager ${employee.fullName} (${employee.employeeId})`);
      } catch (err) {
        console.error('Firestore saveEmployee error:', err);
      }
    }

    // Save to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('employees').upsert(employee, { onConflict: 'employeeId' });
      } catch (err) {
        console.error('Supabase saveEmployee error:', err);
      }
    }

    // Keep LocalStorage in sync as offline fallback
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

    // Bulk Save to Firebase Firestore using chunked batch writes
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
        console.log(`[Firebase] Successfully bulk-uploaded ${employees.length} employees/managers to Firestore!`);
      } catch (err) {
        console.error('Firestore bulkSaveEmployees error:', err);
      }
    }

    // Bulk Save to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('employees').upsert(employees, { onConflict: 'employeeId' });
      } catch (err) {
        console.error('Supabase bulkSaveEmployees error:', err);
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
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'employees', employeeId));
        console.log(`[Firebase] Deleted employee ${employeeId} from Firestore.`);
      } catch (err) {
        console.error('Firestore deleteEmployee error:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('employees').delete().eq('employeeId', employeeId);
      } catch (err) {
        console.error('Supabase deleteEmployee error:', err);
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
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        const snapshot = await getDocs(collection(firestore, 'attendance'));
        if (!snapshot.empty) {
          return snapshot.docs.map((d) => d.data() as DailyAttendanceRecord);
        }
      } catch (err) {
        console.warn('Firestore getAttendanceRecords error:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('attendance').select('*').order('date', { ascending: false });
        if (!error && Array.isArray(data)) {
          return data as DailyAttendanceRecord[];
        }
      } catch (err) {
        console.warn('Supabase getAttendanceRecords failed:', err);
      }
    }

    try {
      const saved = localStorage.getItem('msir_attendance_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  async saveAttendanceRecord(record: DailyAttendanceRecord): Promise<void> {
    const cleanData = sanitizeForFirestore(record);

    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'attendance', record.id), cleanData, { merge: true });
      } catch (err) {
        console.error('Firestore saveAttendanceRecord error:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('attendance').upsert(record, { onConflict: 'id' });
      } catch (err) {
        console.error('Supabase saveAttendanceRecord error:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // LEAVE REQUESTS
  // -------------------------------------------------------------
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        const snapshot = await getDocs(collection(firestore, 'leave_requests'));
        if (!snapshot.empty) {
          return snapshot.docs.map((d) => d.data() as LeaveRequest);
        }
      } catch (err) {
        console.warn('Firestore getLeaveRequests error:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('leave_requests').select('*').order('appliedDate', { ascending: false });
        if (!error && Array.isArray(data)) {
          return data as LeaveRequest[];
        }
      } catch (err) {
        console.warn('Supabase getLeaveRequests failed:', err);
      }
    }

    try {
      const saved = localStorage.getItem('msir_leave_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    const cleanData = sanitizeForFirestore(request);

    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'leave_requests', request.id), cleanData, { merge: true });
      } catch (err) {
        console.error('Firestore saveLeaveRequest error:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('leave_requests').upsert(request, { onConflict: 'id' });
      } catch (err) {
        console.error('Supabase saveLeaveRequest error:', err);
      }
    }
  },

  async deleteLeaveRequest(id: string): Promise<void> {
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'leave_requests', id));
      } catch (err) {
        console.error('Firestore deleteLeaveRequest error:', err);
      }
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('leave_requests').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteLeaveRequest error:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // REGULARIZATION REQUESTS
  // -------------------------------------------------------------
  async getRegularizationRequests(): Promise<RegularizationRequest[]> {
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        const snapshot = await getDocs(collection(firestore, 'regularization_requests'));
        if (!snapshot.empty) {
          return snapshot.docs.map((d) => d.data() as RegularizationRequest);
        }
      } catch (err) {
        console.warn('Firestore getRegularizationRequests error:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('regularization_requests').select('*');
        if (!error && Array.isArray(data)) {
          return data as RegularizationRequest[];
        }
      } catch (err) {
        console.warn('Supabase getRegularizationRequests failed:', err);
      }
    }

    try {
      const saved = localStorage.getItem('msir_regularization_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  async saveRegularizationRequest(req: RegularizationRequest): Promise<void> {
    const cleanData = sanitizeForFirestore(req);

    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'regularization_requests', req.id), cleanData, { merge: true });
      } catch (err) {
        console.error('Firestore saveRegularizationRequest error:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('regularization_requests').upsert(req, { onConflict: 'id' });
      } catch (err) {
        console.error('Supabase saveRegularizationRequest error:', err);
      }
    }
  },

  async deleteRegularizationRequest(id: string): Promise<void> {
    const firestore = getFirestoreDb();
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'regularization_requests', id));
      } catch (err) {
        console.error('Firestore deleteRegularizationRequest error:', err);
      }
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('regularization_requests').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteRegularizationRequest error:', err);
      }
    }
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
