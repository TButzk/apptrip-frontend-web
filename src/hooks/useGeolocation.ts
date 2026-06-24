import { useEffect, useRef, useState } from "react";

export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
};

type UseGeolocationOptions = {
  enabled?: boolean;
  onUpdate?: (position: GeolocationPosition) => void;
};

export function useGeolocation({ enabled = true, onUpdate }: UseGeolocationOptions = {}) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (geo) => {
        setPermissionDenied(false);
        setError(null);
        const next: GeoPosition = {
          latitude: geo.coords.latitude,
          longitude: geo.coords.longitude,
          accuracy: geo.coords.accuracy,
          altitude: geo.coords.altitude,
          speed: geo.coords.speed
        };
        setPosition(next);
        onUpdateRef.current?.(geo);
      },
      (geoError) => {
        setPermissionDenied(geoError.code === 1);
        setError(geoError.code === 1
          ? "Permita o acesso à localização."
          : "Não foi possível receber a localização.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error, permissionDenied };
}
