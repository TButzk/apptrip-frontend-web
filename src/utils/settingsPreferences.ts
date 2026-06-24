export const MINIMUM_DISTANCE_KEY = "apptrip_minimum_distance_meters";

export function getMinimumDistanceMeters() {
  const raw = localStorage.getItem(MINIMUM_DISTANCE_KEY);
  if (!raw) return 25;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 25;
  return Math.min(100, Math.max(10, Math.round(value)));
}

export function saveMinimumDistanceMeters(value: number) {
  localStorage.setItem(MINIMUM_DISTANCE_KEY, String(Math.round(value)));
}
