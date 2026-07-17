import type { LatLngExpression } from 'leaflet';
import { GeoJSON, MapContainer, TileLayer, type MapContainerProps } from 'react-leaflet';
import type { Polygon } from 'geojson';
import type { ReactNode } from 'react';

type MapPreviewProps = {
  className?: string;
  polygon?: Polygon;
  center?: LatLngExpression;
  zoom?: number;
  children?: ReactNode;
};

const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MapPreview = ({ className, polygon, center, zoom = 16, children }: MapPreviewProps) => {
  const resolvedCenter: LatLngExpression =
    center ?? ([polygon!.coordinates[0][0][1], polygon!.coordinates[0][0][0]] as LatLngExpression);

  const mapProps: MapContainerProps = { className, center: resolvedCenter, zoom };

  return (
    <MapContainer {...mapProps}>
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      {polygon && <GeoJSON data={polygon} />}
      {children}
    </MapContainer>
  );
};