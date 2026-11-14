-- ==============================================================
-- Aten & MSIR Calibration Attendance System
-- Supabase PostgreSQL Schema & Security Policies
-- ==============================================================
-- Paste and run this script in Supabase Dashboard -> SQL Editor -> New Query

-- 1. EMPLOYEES & MANAGERS TABLE
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  designation TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  manager TEXT,
  status TEXT DEFAULT 'Active',
  "isManager" BOOLEAN DEFAULT false,
  password TEXT DEFAULT 'msirindia1',
  shift TEXT,
  "geofenceEnabled" BOOLEAN DEFAULT true,
  "assignedGeofence" TEXT,
  "joiningDate" TEXT,
  "avatarUrl" TEXT,
  "todayStatus" TEXT DEFAULT 'Absent',
  "todayCheckIn" TEXT,
  "todayCheckOut" TEXT,
  "todayLocation" TEXT,
  "todayMapsUrl" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Employees" ON public.employees;
CREATE POLICY "Public Access Employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- 2. DAILY ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT,
  "employeeName" TEXT,
  date TEXT NOT NULL,
  "dayName" TEXT,
  "checkIn" TEXT,
  "checkOut" TEXT,
  "workingHours" TEXT,
  "workingMinutes" INTEGER DEFAULT 0,
  "breakDuration" TEXT,
  status TEXT DEFAULT 'Present',
  location TEXT,
  "mapsUrl" TEXT,
  "checkOutLocation" TEXT,
  "checkOutMapsUrl" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Attendance" ON public.attendance;
CREATE POLICY "Public Access Attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- 3. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT,
  "employeeName" TEXT,
  department TEXT,
  category TEXT DEFAULT 'Leave',
  "leaveType" TEXT NOT NULL,
  "fromDate" TEXT NOT NULL,
  "toDate" TEXT NOT NULL,
  days NUMERIC DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  "appliedDate" TEXT NOT NULL,
  "reviewedBy" TEXT,
  "adminRemarks" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Leave Requests" ON public.leave_requests;
CREATE POLICY "Public Access Leave Requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);

-- 4. REGULARIZATION & PERMISSION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.regularization_requests (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT,
  "employeeName" TEXT,
  department TEXT,
  date TEXT NOT NULL,
  "requestedCheckIn" TEXT,
  "requestedCheckOut" TEXT,
  category TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  "appliedDate" TEXT NOT NULL,
  "reviewedBy" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.regularization_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Regularizations" ON public.regularization_requests;
CREATE POLICY "Public Access Regularizations" ON public.regularization_requests FOR ALL USING (true) WITH CHECK (true);
