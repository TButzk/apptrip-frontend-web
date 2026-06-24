import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import type { GeoPosition } from "hooks/useGeolocation";
import type { PlaceDto } from "types/domain";
import { orderPlaces } from "utils/routeMetrics";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

export type RouteMapProps = {
  points: PlaceDto[];
  userPosition?: GeoPosition | null;
  followUser?: boolean;
  preview?: boolean;
  compact?: boolean;
  recenterToken?: number;
  className?: string;
};

const DEFAULT_CENTER: LatLngExpression = [-29.1667, -51.1794];

function MapViewport({
  points,
  userPosition,
  followUser,
  preview,
  recenterToken
}: Pick<RouteMapProps, "points" | "userPosition" | "followUser" | "preview" | "recenterToken">) {
  const map = useMap();
  const ordered = useMemo(() => orderPlaces(points), [points]);

  useEffect(() => {
    const coords: LatLngExpression[] = ordered.map((point) => [point.latitude, point.longitude]);
    if (userPosition) coords.push([userPosition.latitude, userPosition.longitude]);

    if (coords.length === 0) {
      if (userPosition) map.setView([userPosition.latitude, userPosition.longitude], 15, { animate: true });
      return;
    }

    if (followUser && userPosition) {
      map.panTo([userPosition.latitude, userPosition.longitude], { animate: true });
      return;
    }

    if (preview || ordered.length > 0) {
      const bounds = coords as LatLngBoundsExpression;
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: preview ? 14 : 16, animate: true });
    }
  }, [ordered, userPosition, followUser, preview, recenterToken, map]);

  return null;
}

export function RouteMap({
  points,
  userPosition,
  followUser = false,
  preview = false,
  compact = false,
  recenterToken = 0,
  className
}: RouteMapProps) {
  const ordered = useMemo(() => orderPlaces(points), [points]);
  const polyline = ordered.map((point) => [point.latitude, point.longitude] as [number, number]);
  const center = ordered.length
    ? ([ordered[0].latitude, ordered[0].longitude] as LatLngExpression)
    : userPosition
      ? ([userPosition.latitude, userPosition.longitude] as LatLngExpression)
      : DEFAULT_CENTER;

  const mapClass = ["map-container", preview ? "map-container-preview" : "", compact ? "map-container-compact" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <MapContainer
      center={center}
      zoom={preview ? 12 : 13}
      scrollWheelZoom={!preview}
      dragging={!preview}
      doubleClickZoom={!preview}
      touchZoom={!preview}
      boxZoom={!preview}
      keyboard={!preview}
      className={mapClass}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport
        points={ordered}
        userPosition={userPosition}
        followUser={followUser}
        preview={preview}
        recenterToken={recenterToken}
      />
      {polyline.length > 1 ? (
        <Polyline positions={polyline} pathOptions={{ color: "#8d4f11", weight: 4, opacity: 0.85 }} />
      ) : null}
      {ordered.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.latitude, point.longitude]}
          radius={compact ? 5 : 8}
          pathOptions={{ color: "#8d4f11", fillColor: "#f4a460", fillOpacity: 0.95, weight: 2 }}
        />
      ))}
      {userPosition ? (
        <CircleMarker
          center={[userPosition.latitude, userPosition.longitude]}
          radius={compact ? 6 : 9}
          pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.95, weight: 2 }}
        />
      ) : null}
    </MapContainer>
  );
}
