import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { MainLayout } from './layouts/MainLayout';
import { PageId } from './types';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AttendancePage } from './pages/AttendancePage';
import { AttendanceHistoryPage } from './pages/AttendanceHistoryPage';
import { LeaveManagementPage } from './pages/LeaveManagementPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminApprovalsPage } from './pages/AdminApprovalsPage';
import { EmployeeManagementPage } from './pages/EmployeeManagementPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { MonthlyAttendanceReportPage } from './pages/MonthlyAttendanceReportPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    try {
      const savedUser = localStorage.getItem('msir_user_profile');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'admin') return 'admin-dashboard';
        if (parsed.role === 'manager') return 'manager-dashboard';
      }
    } catch {}
    return 'dashboard';
  });

  React.useEffect(() => {
    if (
      role === 'admin' &&
      (currentPage === 'dashboard' ||
        currentPage === 'attendance' ||
        currentPage === 'attendance-history' ||
        currentPage === 'leave' ||
        currentPage === 'profile')
    ) {
      setCurrentPage('admin-dashboard');
    } else if (
      role === 'manager' &&
      currentPage === 'dashboard'
    ) {
      setCurrentPage('manager-dashboard');
    }
  }, [role, currentPage]);

  if (!isAuthenticated) {
    return (
      <LoginPage
        onSuccess={(targetRole) => {
          const activeRole = targetRole || role;
          if (activeRole === 'admin') setCurrentPage('admin-dashboard');
          else if (activeRole === 'manager') setCurrentPage('manager-dashboard');
          else setCurrentPage('dashboard');
        }}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'attendance':
        return <AttendancePage />;
      case 'attendance-history':
        return <AttendanceHistoryPage />;
      case 'leave':
        return <LeaveManagementPage />;
      case 'profile':
        return <ProfilePage onNavigate={setCurrentPage} />;
      case 'notifications':
        return <NotificationsPage />;
      case 'admin-dashboard':
        return role === 'admin' ? (
          <AdminDashboardPage onNavigate={setCurrentPage} />
        ) : role === 'manager' ? (
          <ManagerDashboardPage onNavigate={setCurrentPage} />
        ) : (
          <DashboardPage onNavigate={setCurrentPage} />
        );
      case 'admin-approvals':
        return role === 'admin' ? (
          <AdminApprovalsPage />
        ) : role === 'manager' ? (
          <ManagerDashboardPage onNavigate={setCurrentPage} initialTab="approvals" />
        ) : (
          <DashboardPage onNavigate={setCurrentPage} />
        );
      case 'manager-dashboard':
        return <ManagerDashboardPage onNavigate={setCurrentPage} />;
      case 'employee-management':
        return role === 'admin' ? (
          <EmployeeManagementPage />
        ) : (
          <DashboardPage onNavigate={setCurrentPage} />
        );
      case 'monthly-reports':
        return <MonthlyAttendanceReportPage onNavigate={setCurrentPage} />;
      case 'reports':
        return <ReportsPage onNavigate={setCurrentPage} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return role === 'admin' ? (
          <AdminDashboardPage onNavigate={setCurrentPage} />
        ) : role === 'manager' ? (
          <ManagerDashboardPage onNavigate={setCurrentPage} />
        ) : (
          <DashboardPage onNavigate={setCurrentPage} />
        );
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <AppContent />
      </AttendanceProvider>
    </AuthProvider>
  );
}
