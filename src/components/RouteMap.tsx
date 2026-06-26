import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import type { GeoPosition } from "hooks/useGeolocation";
import type { PlaceDto } from "types/domain";
import { CARTO_TILE_URL, isProxyTileUrl, resolveMapTileUrl } from "utils/mapTiles";
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
const CARTO_SUBDOMAINS = ["a", "b", "c", "d"] as const;

function MapResizeFix({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    const refresh = () => {
      map.invalidateSize();
      map.setView(center, zoom, { animate: false });
    };

    const frame = requestAnimationFrame(refresh);
    const timeout0 = window.setTimeout(refresh, 0);
    const timeout150 = window.setTimeout(refresh, 150);
    const timeout400 = window.setTimeout(refresh, 400);
    const container = map.getContainer();
    const stage = container.closest(".capture-map-stage");
    const observer = new ResizeObserver(refresh);
    observer.observe(container);
    if (stage) {
      observer.observe(stage);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout0);
      window.clearTimeout(timeout150);
      window.clearTimeout(timeout400);
      observer.disconnect();
    };
  }, [map, center, zoom]);

  return null;
}

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
  const [activeTileUrl, setActiveTileUrl] = useState(resolveMapTileUrl);
  const [tileFailed, setTileFailed] = useState(false);
  const mapStyle = { width: "100%", height: "100%" };
  const ordered = useMemo(() => orderPlaces(points), [points]);
  const polyline = ordered.map((point) => [point.latitude, point.longitude] as [number, number]);
  const center = ordered.length
    ? ([ordered[0].latitude, ordered[0].longitude] as LatLngExpression)
    : userPosition
      ? ([userPosition.latitude, userPosition.longitude] as LatLngExpression)
      : DEFAULT_CENTER;
  const zoom = preview ? 12 : 13;

  const mapClass = ["map-container", preview ? "map-container-preview" : "", compact ? "map-container-compact" : "", className]
    .filter(Boolean)
    .join(" ");

  const usesSubdomains = activeTileUrl.includes("{s}");

  const handleTileError = useCallback(() => {
    if (isProxyTileUrl(activeTileUrl)) {
      setActiveTileUrl(CARTO_TILE_URL);
      return;
    }
    setTileFailed(true);
  }, [activeTileUrl]);

  const handleMapReady = useCallback(() => {
    window.setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
  }, []);

  return (
    <div className="map-container-host" style={mapStyle}>
      {tileFailed ? (
        <div className="map-tile-error" role="alert">
          Mapa indisponível — verifique a conexão.
        </div>
      ) : null}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={!preview}
        dragging={!preview}
        doubleClickZoom={!preview}
        touchZoom={!preview}
        boxZoom={!preview}
        keyboard={!preview}
        className={mapClass}
        style={mapStyle}
        whenReady={handleMapReady}
      >
        <TileLayer
          key={activeTileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={activeTileUrl}
          {...(usesSubdomains ? { subdomains: [...CARTO_SUBDOMAINS] } : {})}
          eventHandlers={{
            tileerror: handleTileError
          }}
        />
        <MapResizeFix center={center} zoom={zoom} />
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
    </div>
  );
}
