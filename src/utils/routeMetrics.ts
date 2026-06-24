import type { PlaceDto } from "types/domain";

const EARTH_RADIUS_M = 6371000;

function rad(value: number) {
  return value * Math.PI / 180;
}

export function orderPlaces(items: PlaceDto[]) {
  return [...items].sort((a, b) => (a.sequence ?? 999999) - (b.sequence ?? 999999) || a.id.localeCompare(b.id));
}

export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function routeDistanceKm(points: PlaceDto[]) {
  const ordered = orderPlaces(points);
  if (ordered.length < 2) return Math.max(0, ordered.length * 0.5);
  let meters = 0;
  for (let index = 1; index < ordered.length; index += 1) {
    meters += distanceMeters(ordered[index - 1], ordered[index]);
  }
  return meters / 1000;
}

export function routeDurationLabel(points: PlaceDto[]) {
  const ordered = orderPlaces(points);
  if (ordered.length < 2) {
    const minutes = Math.max(15, ordered.length * 18);
    return formatMinutes(minutes);
  }
  const first = ordered.find((point) => point?.capturedAt)?.capturedAt;
  const last = ordered[ordered.length - 1]?.capturedAt;
  if (!first || !last) return formatMinutes(Math.max(25, ordered.length * 18));
  const start = Date.parse(first);
  const end = Date.parse(last);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return formatMinutes(Math.max(25, ordered.length * 18));
  }
  return formatMinutes(Math.floor((end - start) / 60000));
}

export function routeDifficultyLabel(distanceKm: number, pointCount: number) {
  if (pointCount < 2) return "—";
  if (distanceKm >= 12 || pointCount >= 20) return "Difícil";
  if (distanceKm >= 5 || pointCount >= 10) return "Moderada";
  return "Fácil";
}

export function formatLocation(points: PlaceDto[]) {
  const first = orderPlaces(points)[0];
  if (!first) return "Localização indisponível";
  const city = first.city?.trim();
  const state = first.state?.trim();
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Rota publicada";
}

function formatMinutes(minutes: number) {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  return `${minutes}min`;
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatSpeedKmh(speedMps: number | null | undefined) {
  if (speedMps == null || Number.isNaN(speedMps) || speedMps < 0) return "—";
  return `${(speedMps * 3.6).toFixed(1)} km/h`;
}

export function formatAltitude(altitude: number | null | undefined) {
  if (altitude == null || Number.isNaN(altitude)) return "—";
  return `${Math.round(altitude)} m`;
}
