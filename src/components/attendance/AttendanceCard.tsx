import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ExternalLink,
  Navigation,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Compass,
  Building2,
  Factory,
  Car,
  Home,
  Crosshair,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { LocationMarkingModal } from './LocationMarkingModal';
import { CheckInLocation } from '../../types';

export const AttendanceCard: React.FC = () => {
  const { user } = useAuth();
  const {
    isCheckedIn,
    isCheckedOut,
    checkInTime,
    checkOutTime,
    workingDuration,
    checkInLocation,
    checkOutLocation,
    isTrackingLocation,
    locationError,
    checkIn,
    checkOut,
    refreshLocation,
  } = useAttendance();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [locationModalMode, setLocationModalMode] = useState<'check-in' | 'check-out'>('check-in');

  return (
    <div className="bg-gradient-to-br from-[#123B66] via-[#164375] to-[#205796] rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg relative overflow-hidden">
      {/* Decorative subtle ambient lights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#3D78C5]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-[#F5C542]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Left Side: Today's Status & Live Timer & Tracked Location */}
        <div className="space-y-4 max-w-xl flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-white border border-white/15 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F5C542] animate-pulse" />
              Today's Attendance
            </span>
            <span className="text-xs text-white/80 flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#F5C542]" />
              {checkInLocation?.city || 'Chromepet, Tambaram'} • Science & Industrial Resources
            </span>
            <span className="text-xs text-white/80 flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              GPS Geofence Verified
            </span>
          </div>

          <div>
            {!isCheckedIn ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Ready to start your day, {user?.name.split(' ')[0]}?
                </h2>
                <p className="text-sm text-white/80 mt-1 leading-relaxed">
                  Record your entry to begin calculating your productive hours. Real-time GPS location will be captured and verified on check-in. Shift: 09:00 AM - 05:30 PM (Grace cutoff: 09:10 AM).
                </p>
              </>
            ) : isCheckedOut ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  Day Completed!
                </h2>
                <p className="text-sm text-white/80 mt-1 leading-relaxed">
                  Great work today. You logged <span className="font-semibold text-white">{workingDuration}</span>. See you tomorrow!
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  You are checked in, {user?.name.split(' ')[0]}!
                </h2>
                <p className="text-sm text-white/80 mt-1 leading-relaxed">
                  Biometric & GPS punch recorded at <span className="font-mono font-bold text-[#F5C542]">{checkInTime}</span>. Status is marked as <span className="font-semibold text-emerald-300">Present</span>.
                </p>
              </>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-medium text-white/70 block">Check In Time</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">
                {checkInTime || '--:--'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-medium text-white/70 block">Check Out Time</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">
                {checkOutTime || '--:--'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-white/70 block">Working Duration</span>
              <span className="text-base font-bold font-mono text-[#F5C542] mt-0.5 block">
                {isCheckedIn ? workingDuration : '0h 0m'}
              </span>
            </div>
          </div>

          {/* Live Tracked GPS Location Section (Check-In & Check-Out) */}
          {isCheckedIn && (checkInLocation || checkOutLocation) && (
            <div className="space-y-2.5 mt-3">
              {/* Check-In Location Card */}
              {checkInLocation && (
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/20 shadow-soft-xs space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">
                            Marked Check-In Location ({checkInTime || 'Morning'})
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-[#F5C542] text-[#123B66]">
                            {checkInLocation.locationType || 'Office'}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#F5C542] flex-shrink-0" />
                          <span className="line-clamp-1">{checkInLocation.address}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setLocationModalMode('check-in');
                          setIsLocationModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/20 shadow-soft-xs"
                        title="View pin on interactive map"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-[#F5C542]" />
                        <span>View Pin</span>
                      </button>

                      <a
                        href={checkInLocation.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-[#F5C542] hover:bg-[#ebd553] text-[#123B66] font-bold text-xs flex items-center gap-1.5 shadow-soft-xs transition-colors"
                      >
                        <span>Google Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/80 pt-1 border-t border-white/10">
                    <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
                      {checkInLocation.latitude.toFixed(4)}° N, {checkInLocation.longitude.toFixed(4)}° E
                    </span>
                    <span>•</span>
                    <span className="text-emerald-300 font-medium flex items-center gap-1">
                      <Compass className="w-3 h-3" />
                      Accuracy ±{checkInLocation.accuracy || 12}m
                    </span>
                    <span>•</span>
                    <span className="text-white/70">{checkInLocation.source}</span>
                  </div>
                </div>
              )}

              {/* Check-Out Location Card */}
              {isCheckedOut && checkOutLocation && (
                <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-amber-300/30 shadow-soft-xs space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                        <Clock className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 block">
                            Marked Check-Out Location ({checkOutTime || 'Evening'})
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-400 text-[#123B66]">
                            {checkOutLocation.locationType || 'Office'}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                          <span className="line-clamp-1">{checkOutLocation.address}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setLocationModalMode('check-out');
                          setIsLocationModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/20 shadow-soft-xs"
                        title="View pin on interactive map"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-amber-300" />
                        <span>View Pin</span>
                      </button>

                      <a
                        href={checkOutLocation.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#123B66] font-bold text-xs flex items-center gap-1.5 shadow-soft-xs transition-colors"
                      >
                        <span>Google Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/80 pt-1 border-t border-amber-300/20">
                    <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
                      {checkOutLocation.latitude.toFixed(4)}° N, {checkOutLocation.longitude.toFixed(4)}° E
                    </span>
                    <span>•</span>
                    <span className="text-amber-200 font-medium flex items-center gap-1">
                      <Compass className="w-3 h-3" />
                      Accuracy ±{checkOutLocation.accuracy || 12}m
                    </span>
                    <span>•</span>
                    <span className="text-white/70">{checkOutLocation.source}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location fallback notice if permission was denied */}
          {locationError && (
            <div className="bg-amber-500/20 border border-amber-300/40 rounded-xl p-2.5 text-xs text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* Right Side: Primary Big CTA Button */}
        <div className="flex flex-col items-center lg:items-end justify-center pt-2 lg:pt-0">
          <div className="w-full sm:w-auto flex flex-col items-center gap-3">
            {!isCheckedIn ? (
              <div className="w-full sm:w-60 flex flex-col gap-2">
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  disabled={isTrackingLocation}
                  className="w-full py-4 px-6 rounded-2xl font-extrabold text-base tracking-wide uppercase bg-gradient-to-r from-[#3D78C5] to-[#285da6] hover:from-[#4b86d1] hover:to-[#326ab5] text-white shadow-soft-xl hover:shadow-glow-blue border border-white/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 group disabled:opacity-75"
                >
                  <MapPin className="w-5 h-5 text-[#F5C542] group-hover:scale-110 transition-transform" />
                  <span>Mark & Check In</span>
                </button>

                <button
                  onClick={() => checkIn()}
                  disabled={isTrackingLocation}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-[#F5C542]" />
                  <span>Quick 1-Click Check In</span>
                </button>
              </div>
            ) : !isCheckedOut ? (
              <div className="w-full sm:w-60 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setLocationModalMode('check-out');
                    setIsLocationModalOpen(true);
                  }}
                  disabled={isTrackingLocation}
                  className="w-full py-4 px-6 rounded-2xl font-extrabold text-base tracking-wide uppercase bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-soft-xl border border-white/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 group disabled:opacity-75"
                >
                  <MapPin className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  <span>Mark & Check Out</span>
                </button>

                <button
                  onClick={() => checkOut()}
                  disabled={isTrackingLocation}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-75"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isTrackingLocation ? 'Tracking GPS...' : 'Quick 1-Click Check Out'}</span>
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-60 py-3.5 px-6 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <span className="text-xs font-semibold text-white/70 block uppercase tracking-wider">
                  Attendance Status
                </span>
                <span className="text-sm font-bold text-white flex items-center justify-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Shift Completed
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Shift: 09:00 AM - 05:30 PM (Grace Cutoff: 09:10 AM)</span>
            </div>
            
            <p className="text-[11px] text-white/60 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-[#F5C542]" />
              <span>GPS geofencing records punch coordinates</span>
            </p>
          </div>
        </div>
      </div>

      {/* Location Marking & Pinpoint Modal */}
      <LocationMarkingModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        mode={locationModalMode}
        onConfirm={async (loc) => {
          if (locationModalMode === 'check-out') {
            await checkOut(loc);
          } else {
            await checkIn(loc);
          }
        }}
        initialLocation={locationModalMode === 'check-out' ? (checkOutLocation || checkInLocation) : checkInLocation}
        employeeName={user?.name || 'Employee'}
        geofenceEnabled={user?.geofenceEnabled}
      />
    </div>
  );
};
