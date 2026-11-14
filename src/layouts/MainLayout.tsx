import React, { useState } from 'react';
import { Sidebar } from '../components/navigation/Sidebar';
import { TopHeader } from '../components/navigation/TopHeader';
import { MobileNav } from '../components/navigation/MobileNav';
import { PageId } from '../types';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MainLayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPage,
  onNavigate,
  children,
}) => {
  const { role, logout, user } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden flex">
          <div className="w-72 bg-white h-full shadow-soft-xl flex flex-col justify-between animate-fade-in">
            <div className="p-5 border-b border-[#E4EAF1] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/msir-logo.png"
                  alt="MSIR INDIA Calibration"
                  className="h-9 w-auto object-contain rounded-lg border border-amber-300/40"
                />
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#667085] hover:bg-[#F8FAFC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1">
                {[
                  { id: 'dashboard' as PageId, label: 'Dashboard', employeeOnly: true },
                  { id: 'manager-dashboard' as PageId, label: 'Manager Dashboard', managerOnly: true },
                  { id: 'admin-dashboard' as PageId, label: 'Admin Overview', adminOnly: true },
                  { id: 'admin-approvals' as PageId, label: 'Approvals Hub', approverOnly: true },
                  { id: 'employee-management' as PageId, label: 'Employees', adminOnly: true },
                  { id: 'monthly-reports' as PageId, label: 'Monthly Reports', approverOnly: true },
                  { id: 'attendance' as PageId, label: 'Attendance' },
                  { id: 'attendance-history' as PageId, label: 'Attendance History' },
                  { id: 'leave' as PageId, label: 'Leave Management' },
                  { id: 'profile' as PageId, label: 'Employee Profile' },
                  { id: 'reports' as PageId, label: 'Reports & Analytics' },
                  { id: 'settings' as PageId, label: 'Settings' },
                ]
                  .filter((item) => {
                    if (role === 'admin') {
                      return !item.employeeOnly && !item.managerOnly;
                    }
                    if (role === 'manager') {
                      return !item.employeeOnly && !item.adminOnly;
                    }
                    return !item.adminOnly && !item.managerOnly && !item.approverOnly;
                  })
                  .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                      currentPage === item.id
                        ? 'bg-[#123B66] text-white'
                        : 'text-[#172033] hover:bg-[#EAF2FB] hover:text-[#3D78C5]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[#E4EAF1] bg-[#F8FAFC]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#172033]">{user?.name}</p>
                  <p className="text-[10px] text-[#667085]">{user?.employeeId}</p>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <TopHeader
          currentPage={currentPage}
          onNavigate={onNavigate}
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  );
};
