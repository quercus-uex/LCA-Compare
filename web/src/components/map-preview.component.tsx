import type { LatLngExpression } from 'leaflet';
import { MapContainer, Polygon, TileLayer } from 'react-leaflet';

export const MapPreview = ({ className, polygon }: { className?: string, polygon: number[][] }) => {
  return (
    <MapContainer
      className={className}
      center={polygon[0] as LatLngExpression}
      zoom={16}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polygon positions={polygon as LatLngExpression[]} />
    </MapContainer>
  );
}