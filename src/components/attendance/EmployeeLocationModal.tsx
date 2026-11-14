import React from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  X,
  Building2,
  Factory,
  Car,
  Home,
  Clock,
  ShieldCheck,
  User,
  Compass,
} from 'lucide-react';
import { EmployeeDirectoryItem } from '../../types';
import { verifyGeofence, OFFICE_GEOFENCE } from '../../utils/geofence';

interface EmployeeLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeDirectoryItem | null;
}

export const EmployeeLocationModal: React.FC<EmployeeLocationModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  if (!isOpen || !employee) return null;

  const [activePin, setActivePin] = React.useState<'check-in' | 'check-out'>('check-in');
  const hasCheckOutLocation = Boolean(employee.todayCheckOutLocation);

  const checkInLat = employee.todayCoordinates?.lat || OFFICE_GEOFENCE.latitude;
  const checkInLng = employee.todayCoordinates?.lng || OFFICE_GEOFENCE.longitude;
  const checkInGeo = verifyGeofence(checkInLat, checkInLng);
  const checkInAddress = employee.todayLocation || OFFICE_GEOFENCE.address;
  const checkInMapsUrl = employee.todayMapsUrl || `https://www.google.com/maps?q=${checkInLat},${checkInLng}`;

  const checkOutLat = employee.todayCheckOutCoordinates?.lat || OFFICE_GEOFENCE.latitude;
  const checkOutLng = employee.todayCheckOutCoordinates?.lng || OFFICE_GEOFENCE.longitude;
  const checkOutGeo = verifyGeofence(checkOutLat, checkOutLng);
  const checkOutAddress = employee.todayCheckOutLocation || OFFICE_GEOFENCE.address;
  const checkOutMapsUrl = employee.todayCheckOutMapsUrl || `https://www.google.com/maps?q=${checkOutLat},${checkOutLng}`;

  const currentLat = activePin === 'check-out' && hasCheckOutLocation ? checkOutLat : checkInLat;
  const currentLng = activePin === 'check-out' && hasCheckOutLocation ? checkOutLng : checkInLng;
  const currentGeo = activePin === 'check-out' && hasCheckOutLocation ? checkOutGeo : checkInGeo;
  const currentAddress = activePin === 'check-out' && hasCheckOutLocation ? checkOutAddress : checkInAddress;
  const currentMapsUrl = activePin === 'check-out' && hasCheckOutLocation ? checkOutMapsUrl : checkInMapsUrl;
  const locationType = (activePin === 'check-out' && employee.todayCheckOutLocationType)
    ? employee.todayCheckOutLocationType
    : (employee.todayLocationType || 'Office');

  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${currentLng - 0.007}%2C${currentLat - 0.007}%2C${currentLng + 0.007}%2C${currentLat + 0.007}&layer=mapnik&marker=${currentLat}%2C${currentLng}`;

  const getTypeIcon = () => {
    switch (locationType) {
      case 'Client On-Site':
        return <Factory className="w-3.5 h-3.5 text-blue-600" />;
      case 'Field Work':
        return <Car className="w-3.5 h-3.5 text-amber-600" />;
      case 'Work From Home':
        return <Home className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const getTypeBadgeClass = () => {
    switch (locationType) {
      case 'Client On-Site':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Field Work':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Work From Home':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl border border-[#E4EAF1] shadow-soft-2xl overflow-hidden my-4 flex flex-col">
        {/* Header */}
        <div className="bg-[#123B66] p-5 sm:p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={employee.avatarUrl}
                alt={employee.fullName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white/20 shadow-soft-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5C542] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                    ID: {employee.employeeId}
                  </span>
                  <span className="text-xs text-white/70">• {employee.department}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  {employee.fullName}
                </h3>
                <p className="text-xs text-white/80">{employee.designation}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Toggle between Check-In location and Check-Out location */}
          {hasCheckOutLocation && (
            <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActivePin('check-in')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activePin === 'check-in'
                    ? 'bg-[#123B66] text-white shadow-soft-xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Check-In ({employee.todayCheckIn || 'Punch In'})</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePin('check-out')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activePin === 'check-out'
                    ? 'bg-amber-600 text-white shadow-soft-xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                <span>Check-Out ({employee.todayCheckOut || 'Punch Out'})</span>
              </button>
            </div>
          )}

          {/* Punch Time & Location Category strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                {activePin === 'check-out' && hasCheckOutLocation ? "Check-Out Punch Time" : "Check-In Punch Time"}
              </span>
              <span className="text-base font-extrabold font-mono text-[#172033] flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-[#3D78C5]" />
                {activePin === 'check-out' && hasCheckOutLocation ? (employee.todayCheckOut || '--:--') : (employee.todayCheckIn || '09:15 AM')}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1]">
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                Work Location Type
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border mt-0.5 ${getTypeBadgeClass()}`}>
                {getTypeIcon()}
                <span>{locationType}</span>
              </span>
            </div>
          </div>

          {/* Marked Location Name & Geofence Verification */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E4EAF1] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#3D78C5]" />
                {activePin === 'check-out' && hasCheckOutLocation ? "Marked Check-Out Address" : "Marked Check-In Address"}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  employee.geofenceEnabled === false
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : currentGeo.isWithin
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {employee.geofenceEnabled === false
                  ? 'Geofence Exempted'
                  : `${currentGeo.badgeLabel} (${currentGeo.distance}m)`}
              </span>
            </div>
            <p className="text-sm font-bold text-[#172033] leading-snug">{currentAddress}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#667085] font-mono border-t border-[#E4EAF1]/70">
              <span>{currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E</span>
              <span>•</span>
              <span className="text-[#123B66] font-sans font-medium">
                {employee.geofenceEnabled === false
                  ? `Assigned: ${employee.assignedGeofence || 'Flexible / Exempted'}`
                  : `Permitted Office Geofence: ≤ ${currentGeo.permittedRadius}m`}
              </span>
              <span>•</span>
              <span className="font-sans font-medium">
                {employee.geofenceEnabled === false
                  ? 'Exempted from physical campus boundary'
                  : currentGeo.description}
              </span>
            </div>
          </div>

          {/* Interactive Map Visualizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#172033] flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-[#3D78C5]" />
                Employee's Position on Map
              </span>
              <a
                href={currentMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#3D78C5] hover:text-[#123B66] flex items-center gap-1"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-[#E4EAF1] shadow-soft-inner bg-slate-100">
              <iframe
                title="Employee Location Map"
                src={mapEmbedUrl}
                className="w-full h-full border-0 pointer-events-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E4EAF1] flex items-center justify-between">
          <span className="text-xs text-[#667085] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            MSIR India Calibration Workforce Suite
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#123B66] hover:bg-[#1c4b7d] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
