/**
 * Science & Industrial Resources - Geofence Utility & Distance Calculation
 * Permitted office location: 2nd Floor, Science & Industrial Resources, #40, 2nd St, Lakshmi Nagar, Padmavathy Nagar, Chromepet, Tambaram, Tamil Nadu 600044
 */

export interface OfficeGeofenceConfig {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  permittedRadiusMeters: number;
}

export const OFFICE_GEOFENCE: OfficeGeofenceConfig = {
  name: 'Science & Industrial Resources',
  address: '2nd Floor, Science & Industrial Resources, #40, 2nd St, Lakshmi Nagar, Padmavathy Nagar, Chromepet, Tambaram, Tamil Nadu 600044',
  latitude: 12.9516,
  longitude: 80.1410,
  permittedRadiusMeters: 250, // Permitted office boundary: 250 meters
};

/**
 * Computes exact distance in meters between two GPS coordinates using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number = OFFICE_GEOFENCE.latitude,
  lon2: number = OFFICE_GEOFENCE.longitude
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Verifies whether given coordinates are inside the permitted geofence perimeter
 */
export function verifyGeofence(
  lat: number,
  lng: number,
  maxRadius: number = OFFICE_GEOFENCE.permittedRadiusMeters
): {
  distance: number;
  isWithin: boolean;
  permittedRadius: number;
  badgeLabel: string;
  description: string;
} {
  const distance = calculateDistanceMeters(lat, lng);
  const isWithin = distance <= maxRadius;

  return {
    distance,
    isWithin,
    permittedRadius: maxRadius,
    badgeLabel: isWithin ? 'Within Permitted Geofence' : 'Outside Office Geofence',
    description: isWithin
      ? `Verified within office perimeter (${distance}m from HQ center, permitted ≤ ${maxRadius}m)`
      : `Exceeds permitted office perimeter (${distance}m from HQ center, max allowed: ${maxRadius}m)`,
  };
}
