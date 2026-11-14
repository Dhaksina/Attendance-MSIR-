import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Building2,
  Factory,
  Car,
  Home,
  CheckCircle2,
  ExternalLink,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Crosshair,
} from 'lucide-react';
import { CheckInLocation, LocationType } from '../../types';
import { verifyGeofence, OFFICE_GEOFENCE } from '../../utils/geofence';

interface LocationMarkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (locationData: Partial<CheckInLocation>) => Promise<void> | void;
  initialLocation?: CheckInLocation | null;
  employeeName?: string;
  geofenceEnabled?: boolean;
  mode?: 'check-in' | 'check-out';
}

export const LocationMarkingModal: React.FC<LocationMarkingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
  employeeName = 'Employee',
  geofenceEnabled = true,
  mode = 'check-in',
}) => {
  const [locationType, setLocationType] = useState<LocationType>('Office');
  const [selectedPreset, setSelectedPreset] = useState<string>('MSIR HQ');
  const [customSiteName, setCustomSiteName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Coordinates state
  const [lat, setLat] = useState<number>(initialLocation?.latitude || OFFICE_GEOFENCE.latitude);
  const [lng, setLng] = useState<number>(initialLocation?.longitude || OFFICE_GEOFENCE.longitude);
  const [accuracy, setAccuracy] = useState<number>(initialLocation?.accuracy || 12);
  const [address, setAddress] = useState<string>(
    initialLocation?.address || OFFICE_GEOFENCE.address
  );
  
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('GPS Lock Acquired');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calibration client presets in Chennai / Tamil Nadu industrial corridors
  const locationPresets = [
    {
      id: 'MSIR HQ',
      label: 'Science & Industrial Resources HQ',
      type: 'Office' as LocationType,
      lat: OFFICE_GEOFENCE.latitude,
      lng: OFFICE_GEOFENCE.longitude,
      address: OFFICE_GEOFENCE.address,
    },
    {
      id: 'Hyundai',
      label: 'Hyundai Motors India - Plant 2',
      type: 'Client On-Site' as LocationType,
      lat: 12.9815,
      lng: 79.9723,
      address: 'Hyundai Motor India Ltd, Sriperumbudur Industrial Corridor, Chennai',
    },
    {
      id: 'Ashok Leyland',
      label: 'Ashok Leyland Engine Test Facility',
      type: 'Client On-Site' as LocationType,
      lat: 13.2084,
      lng: 80.3228,
      address: 'Ashok Leyland Manufacturing Unit, Ennore, Chennai',
    },
    {
      id: 'TVS Hosur',
      label: 'TVS Motor Facility - Calibration Bay',
      type: 'Field Work' as LocationType,
      lat: 12.7409,
      lng: 77.8253,
      address: 'TVS Motor Company Plant, SIPCOT Industrial Complex, Hosur',
    },
    {
      id: 'Remote',
      label: 'Remote / Work From Home',
      type: 'Work From Home' as LocationType,
      lat: 12.9716,
      lng: 80.2184,
      address: 'Approved Work From Home Location (Chennai Region)',
    },
  ];

  // Detect live GPS
  const detectLiveGPS = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatusMessage('Geolocation unavailable on this device. Using calibrated office geofence.');
      return;
    }

    setIsLocating(true);
    setStatusMessage('Querying satellite GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const detectedLat = Number(pos.coords.latitude.toFixed(5));
        const detectedLng = Number(pos.coords.longitude.toFixed(5));
        const detectedAcc = Math.round(pos.coords.accuracy || 15);

        setLat(detectedLat);
        setLng(detectedLng);
        setAccuracy(detectedAcc);

        // Reverse geocode
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${detectedLat}&lon=${detectedLng}&zoom=18&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const place = addr.suburb || addr.neighbourhood || addr.road || addr.industrial || addr.commercial || '';
            const city = addr.city || addr.town || addr.county || 'Chennai';
            if (place) {
              setAddress(`${place}, ${city}`);
            } else if (data.display_name) {
              const parts = data.display_name.split(',').map((p: string) => p.trim());
              setAddress(parts.slice(0, 3).join(', '));
            }
          }
        } catch {
          setAddress(`GPS Position: ${detectedLat}° N, ${detectedLng}° E`);
        }

        setIsLocating(false);
        setStatusMessage('Live GPS location verified');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setStatusMessage('Location permission denied. You can select an approved client preset below.');
        } else {
          setStatusMessage('GPS timeout. Fallback to calibrated site perimeter.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      if (!initialLocation) {
        detectLiveGPS();
      } else {
        setLat(initialLocation.latitude);
        setLng(initialLocation.longitude);
        setAccuracy(initialLocation.accuracy || 12);
        setAddress(initialLocation.address);
        setLocationType(initialLocation.locationType || 'Office');
      }
    }
  }, [isOpen]);

  const handleSelectPreset = (preset: typeof locationPresets[0]) => {
    setSelectedPreset(preset.id);
    setLocationType(preset.type);
    setLat(preset.lat);
    setLng(preset.lng);
    setAddress(preset.address);
    setCustomSiteName(preset.label);
    setStatusMessage(`Marked preset: ${preset.label}`);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const resolvedAddress = customSiteName ? `${customSiteName} - ${address}` : address;
    const geo = verifyGeofence(lat, lng);

    const isCompliant = geofenceEnabled === false ? true : geo.isWithin;

    const finalLocation: Partial<CheckInLocation> = {
      latitude: lat,
      longitude: lng,
      accuracy,
      address: resolvedAddress,
      city: address.includes('Hosur') ? 'Hosur' : 'Chennai',
      locationType,
      siteName: customSiteName || selectedPreset,
      notes,
      source: selectedPreset === 'MSIR HQ' ? 'Office Geofence' : 'Manual Pinpoint',
      mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      isWithinGeofence: isCompliant,
      geofenceDistance: geo.distance,
      permittedRadius: geo.permittedRadius,
    };

    await onConfirm(finalLocation);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  // OpenStreetMap embed URL with exact pin marker
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.007}%2C${lat - 0.007}%2C${lng + 0.007}%2C${lat + 0.007}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-[#E4EAF1] shadow-soft-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#123B66] p-5 sm:p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F5C542]/20 border border-[#F5C542]/40 flex items-center justify-center text-[#F5C542]">
                <MapPin className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5C542] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                    MSIR INDIA Calibration
                  </span>
                  <span className="text-xs text-white/70">
                    • {mode === 'check-out' ? 'Check-Out Location' : 'Check-In Location'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  {mode === 'check-out' ? 'Confirm & Mark Check-Out Location' : 'Confirm & Mark Check-In Location'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-white/80 mt-2">
            {mode === 'check-out'
              ? `Verify where ${employeeName} is checking out from today. Coordinates and site details will be permanently logged.`
              : `Verify where ${employeeName} is punching in from today. Coordinates and site details will be permanently logged.`}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Interactive Map Pin Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#172033] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#3D78C5]" />
                Interactive Map Pinpoint
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={detectLiveGPS}
                  disabled={isLocating}
                  className="text-xs font-semibold text-[#3D78C5] hover:text-[#123B66] flex items-center gap-1 bg-[#EAF2FB] px-2.5 py-1 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>Re-detect GPS</span>
                </button>
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#667085] hover:text-[#172033] flex items-center gap-1"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Embedded Live Map */}
            <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-[#E4EAF1] shadow-soft-inner bg-slate-100">
              <iframe
                title="Punch Location Map"
                src={mapEmbedUrl}
                className="w-full h-full border-0 pointer-events-auto"
                loading="lazy"
              />

              {/* Floating Pin Overlay Card */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-[#E4EAF1] shadow-soft-md flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#172033] truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="truncate">{address}</span>
                  </p>
                  <p className="text-[10px] text-[#667085] font-mono mt-0.5">
                    {lat.toFixed(4)}° N, {lng.toFixed(4)}° E • Accuracy ±{accuracy}m
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap">
                  GPS Active
                </span>
              </div>
            </div>
          </div>

          {/* Location Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#667085] block">
              1. Select Work Location Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setLocationType('Office')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 ${
                  locationType === 'Office'
                    ? 'border-[#3D78C5] bg-[#EAF2FB] text-[#123B66] shadow-soft-xs ring-2 ring-[#3D78C5]/20'
                    : 'border-[#E4EAF1] bg-white hover:bg-[#F8FAFC] text-[#667085]'
                }`}
              >
                <Building2 className={`w-5 h-5 ${locationType === 'Office' ? 'text-[#3D78C5]' : 'text-[#667085]'}`} />
                <div>
                  <span className="text-xs font-bold block">MSIR HQ</span>
                  <span className="text-[10px] text-[#667085] block">Calibration Lab</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocationType('Client On-Site')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 ${
                  locationType === 'Client On-Site'
                    ? 'border-[#3D78C5] bg-[#EAF2FB] text-[#123B66] shadow-soft-xs ring-2 ring-[#3D78C5]/20'
                    : 'border-[#E4EAF1] bg-white hover:bg-[#F8FAFC] text-[#667085]'
                }`}
              >
                <Factory className={`w-5 h-5 ${locationType === 'Client On-Site' ? 'text-[#3D78C5]' : 'text-[#667085]'}`} />
                <div>
                  <span className="text-xs font-bold block">Client Site</span>
                  <span className="text-[10px] text-[#667085] block">Factory Unit</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocationType('Field Work')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 ${
                  locationType === 'Field Work'
                    ? 'border-[#3D78C5] bg-[#EAF2FB] text-[#123B66] shadow-soft-xs ring-2 ring-[#3D78C5]/20'
                    : 'border-[#E4EAF1] bg-white hover:bg-[#F8FAFC] text-[#667085]'
                }`}
              >
                <Car className={`w-5 h-5 ${locationType === 'Field Work' ? 'text-[#3D78C5]' : 'text-[#667085]'}`} />
                <div>
                  <span className="text-xs font-bold block">Field Visit</span>
                  <span className="text-[10px] text-[#667085] block">Mobile Lab</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocationType('Work From Home')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 ${
                  locationType === 'Work From Home'
                    ? 'border-[#3D78C5] bg-[#EAF2FB] text-[#123B66] shadow-soft-xs ring-2 ring-[#3D78C5]/20'
                    : 'border-[#E4EAF1] bg-white hover:bg-[#F8FAFC] text-[#667085]'
                }`}
              >
                <Home className={`w-5 h-5 ${locationType === 'Work From Home' ? 'text-[#3D78C5]' : 'text-[#667085]'}`} />
                <div>
                  <span className="text-xs font-bold block">Remote</span>
                  <span className="text-[10px] text-[#667085] block">WFH Approved</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Facility / Client Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#667085] block">
              2. Quick Location Marking Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {locationPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    selectedPreset === preset.id
                      ? 'bg-[#123B66] text-white border-[#123B66] shadow-soft-xs'
                      : 'bg-[#F8FAFC] text-[#172033] border-[#E4EAF1] hover:bg-[#EAF2FB]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Site / Bay Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Client / Facility Specific Name
              </label>
              <input
                type="text"
                value={customSiteName}
                onChange={(e) => setCustomSiteName(e.target.value)}
                placeholder="e.g. MSIR Lab Bay 2 / Client Testing Unit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EAF1] text-xs text-[#172033] focus:outline-none focus:border-[#3D78C5] bg-[#F8FAFC]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Punch Note / Job Assignment (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Pressure gauge inspection calibration"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EAF1] text-xs text-[#172033] focus:outline-none focus:border-[#3D78C5] bg-[#F8FAFC]"
              />
            </div>
          </div>

          {/* Geofence Compliance Banner */}
          {(() => {
            const geo = verifyGeofence(lat, lng);
            const isOfficePunch = locationType === 'Office';
            const isExempted = geofenceEnabled === false;

            if (isExempted) {
              return (
                <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/80 text-purple-900 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-purple-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">Geofence Policy: Exempted Account</p>
                        <span className="font-mono text-[11px] font-bold text-purple-700">
                          ({geo.distance}m from HQ Center)
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-800">
                        This employee account is configured as Geofence Exempted. You can check in from field, client site, or remote locations without distance warnings.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap bg-purple-100 text-purple-800 border border-purple-300">
                    Policy Exempted
                  </span>
                </div>
              );
            }

            return (
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  geo.isWithin || !isOfficePunch
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/90 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck
                    className={`w-5 h-5 flex-shrink-0 ${
                      geo.isWithin || !isOfficePunch ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">
                        {geo.isWithin
                          ? 'Within Office Geofence Perimeter'
                          : isOfficePunch
                          ? 'Outside Permitted Office Geofence'
                          : `${locationType} Attendance Log`}
                      </p>
                      <span className="font-mono text-[11px] font-bold">
                        ({geo.distance}m from HQ Center)
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      {geo.isWithin
                        ? `Permitted office radius: ≤ ${geo.permittedRadius}m. Geofence verification passed.`
                        : isOfficePunch
                        ? `Caution: Check-in point is ${geo.distance}m away (permitted radius ≤ ${geo.permittedRadius}m). Manager review may be flagged.`
                        : `Authorized out-of-office location. Permitted radius for campus is ${geo.permittedRadius}m.`}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${
                    geo.isWithin
                      ? 'bg-emerald-100 text-emerald-800'
                      : isOfficePunch
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {geo.isWithin ? 'Verified In-Bounds' : isOfficePunch ? 'Out of Range' : 'Field Authorized'}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-[#F8FAFC] border-t border-[#E4EAF1] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#667085] hover:bg-[#EAF2FB] hover:text-[#123B66] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#123B66] to-[#1e5894] hover:from-[#194c80] hover:to-[#256bb3] shadow-soft-md hover:shadow-glow-blue transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-[#F5C542]" />
            <span>{mode === 'check-out' ? 'Confirm & Mark Check Out' : 'Confirm & Mark Check In'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
