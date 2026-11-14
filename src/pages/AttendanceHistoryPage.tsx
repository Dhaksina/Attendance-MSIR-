import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceStatus, DailyAttendanceRecord } from '../types';
import { RegularizationModal } from '../components/attendance/RegularizationModal';

export const AttendanceHistoryPage: React.FC = () => {
  const { attendanceHistory, addNotification } = useAttendance();
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Months');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered dataset
  const filteredData = useMemo(() => {
    return attendanceHistory.filter((item) => {
      const matchSearch =
        item.date.includes(searchTerm) ||
        item.dayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'All' ? true : item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [attendanceHistory, searchTerm, statusFilter]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleExport = () => {
    addNotification(
      'Export Initiated',
      `Exported ${filteredData.length} attendance records to CSV/Excel format.`,
      'system'
    );
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Present
          </span>
        );
      case 'Late':
      case 'Half Day':
      case 'Half Day Leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
            {status}
          </span>
        );
      case 'Absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Absent
          </span>
        );
      case 'Leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF9C3] text-yellow-800 border border-yellow-200">
            Leave
          </span>
        );
      case 'Holiday':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Holiday
          </span>
        );
      case 'Weekend':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF2FB] text-[#3D78C5] border border-blue-200">
            Weekend
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header with Title and Export Button */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4EAF1] shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#3D78C5] bg-[#EAF2FB] px-2.5 py-0.5 rounded-full">
            Logs & Records
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1.5">
            Attendance History
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Complete audited logs with biometric timestamps, daily duration, and statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setIsRegModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#123B66] bg-[#F8FAFC] hover:bg-[#EAF2FB] border border-[#E4EAF1] transition-colors flex items-center justify-center gap-1.5 shadow-soft-xs"
          >
            <Plus className="w-4 h-4 text-[#3D78C5]" />
            <span>Apply Regularization</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#123B66] hover:bg-[#194d82] shadow-soft-xs transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-[#F5C542]" />
            <span>Export History (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#E4EAF1] shadow-soft-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
            <input
              type="text"
              placeholder="Search by date (e.g. 2026-10-06) or day name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3D78C5] focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Holiday">Holiday</option>
              <option value="Weekend">Weekend</option>
            </select>
          </div>

          {/* Month Range Filter */}
          <div className="sm:col-span-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E4EAF1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:outline-none focus:border-[#3D78C5]"
            >
              <option value="All Months">October 2026 (Current)</option>
              <option value="Sep 2026">September 2026</option>
              <option value="Aug 2026">August 2026</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#667085] pt-1">
          <span>
            Showing <span className="font-bold text-[#172033]">{filteredData.length}</span> recorded logs
          </span>
          {(searchTerm || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
              className="text-[#3D78C5] font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-3xl border border-[#E4EAF1] shadow-soft-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E4EAF1] text-xs font-bold text-[#667085] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Day</th>
                <th className="py-4 px-6">Check In</th>
                <th className="py-4 px-6">Check Out</th>
                <th className="py-4 px-6">Working Hours</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Notes / Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAF1]/70">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#667085]">
                    No attendance records match the selected search criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors group">
                    <td className="py-4 px-6 font-bold text-[#172033] whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="py-4 px-6 text-[#667085] whitespace-nowrap">
                      {row.dayName}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-[#172033] whitespace-nowrap">
                      {row.checkIn || '--:--'}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-[#172033] whitespace-nowrap">
                      {row.checkOut || '--:--'}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-bold text-[#3D78C5] whitespace-nowrap">
                      {row.workingHours}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-4 px-6 text-xs text-[#667085] max-w-xs">
                      {row.location ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#3D78C5] flex-shrink-0" />
                          <span className="truncate max-w-[180px]" title={row.location}>
                            {row.location}
                          </span>
                          {row.mapsUrl && (
                            <a
                              href={row.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#3D78C5] hover:text-[#123B66] p-0.5 rounded hover:bg-[#EAF2FB] transition-colors flex-shrink-0"
                              title="View punch location on Google Maps"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span>{row.note || 'Office HQ'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Responsive per Requirement 10) */}
      <div className="md:hidden space-y-3">
        {paginatedData.map((row) => (
          <div
            key={row.id}
            className="bg-white p-5 rounded-2xl border border-[#E4EAF1] shadow-soft-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-extrabold text-[#172033]">{row.date}</span>
                <span className="text-xs text-[#667085] ml-2">({row.dayName})</span>
              </div>
              {getStatusBadge(row.status)}
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-[#F8FAFC] rounded-xl border border-[#E4EAF1]/70 text-center">
              <div>
                <span className="text-[10px] text-[#667085] block uppercase">In</span>
                <span className="text-xs font-bold font-mono text-[#172033]">
                  {row.checkIn || '--:--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] block uppercase">Out</span>
                <span className="text-xs font-bold font-mono text-[#172033]">
                  {row.checkOut || '--:--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] block uppercase">Hours</span>
                <span className="text-xs font-bold font-mono text-[#3D78C5]">
                  {row.workingHours}
                </span>
              </div>
            </div>

            {(row.note || row.location) && (
              <div className="text-xs text-[#667085] flex items-center justify-between gap-1.5 pt-1">
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#3D78C5] flex-shrink-0" />
                  <span className="truncate">{row.location || row.note}</span>
                </span>
                {row.mapsUrl && (
                  <a
                    href={row.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#3D78C5] hover:text-[#123B66] flex items-center gap-1 flex-shrink-0 text-[11px]"
                  >
                    <span>Map</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="bg-white rounded-2xl p-4 border border-[#E4EAF1] shadow-soft-xs flex items-center justify-between">
        <p className="text-xs text-[#667085]">
          Page <span className="font-bold text-[#172033]">{currentPage}</span> of{' '}
          <span className="font-bold text-[#172033]">{totalPages}</span>
        </p>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                currentPage === i + 1
                  ? 'bg-[#123B66] text-white shadow-soft-xs'
                  : 'text-[#667085] hover:bg-[#F8FAFC]'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-[#E4EAF1] text-[#667085] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <RegularizationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        defaultDate="2026-09-18"
      />
    </div>
  );
};
