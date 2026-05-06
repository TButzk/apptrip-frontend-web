import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, TileLayer, Popup } from "react-leaflet";
import type { PlaceDto } from "types/domain";

type RouteMapProps = {
  points: PlaceDto[];
};

const DEFAULT_CENTER: [number, number] = [-29.1667, -51.1794];

export function RouteMap({ points }: RouteMapProps) {
  const hasPoints = points.length > 0;

  const center = hasPoints
    ? ([points[0].latitude, points[0].longitude] as [number, number])
    : DEFAULT_CENTER;

  const polyline = points.map((p) => [p.latitude, p.longitude] as [number, number]);

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {polyline.length > 1 && <Polyline positions={polyline} />}

      {points.map((point, index) => (
        <Marker key={point.id} position={[point.latitude, point.longitude]}>
          <Popup>
            <strong>Ponto {index + 1}</strong>
            <div>{point.name || "Sem nome"}</div>
            <div>
              {point.city} - {point.state}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
