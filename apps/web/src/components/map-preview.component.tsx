import type { LatLngExpression } from 'leaflet';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import type { Polygon } from 'geojson';

export const MapPreview = ({ className, polygon }: { className?: string, polygon: Polygon }) => {
  return (
    <MapContainer
      className={className}
      center={
        [
          polygon.coordinates[0][0][1],
          polygon.coordinates[0][0][0],
        ] as LatLngExpression
      }
      zoom={16}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={polygon} />
    </MapContainer>
  );
}