import type { Polygon } from 'geojson';
import type { LatLngExpression } from 'leaflet';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { GeoJSON, MapContainer, TileLayer, type MapContainerProps } from 'react-leaflet';

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
  const { t } = useTranslation();
  const firstPosition = polygon?.coordinates[0]?.[0];
  const resolvedCenter: LatLngExpression | undefined =
    center ?? (firstPosition ? [firstPosition[1]!, firstPosition[0]!] : undefined);

  // Parcelas ingestadas sin geolocalización
  if (!resolvedCenter) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center bg-base-200 text-base-content/60`}>
        {t('parcelas.noLocation')}
      </div>
    );
  }

  const mapProps: MapContainerProps = { className, center: resolvedCenter, zoom };

  return (
    <MapContainer {...mapProps}>
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      {polygon && <GeoJSON data={polygon} />}
      {children}
    </MapContainer>
  );
};