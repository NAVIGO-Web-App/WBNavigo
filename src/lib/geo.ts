// src/lib/geo.ts
export type LatLng = { lat: number; lng: number };

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);

  const A = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng;
  const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));

  return R * C;
}
