import type { Polygon } from 'geojson';
import type { LatLngExpression } from 'leaflet';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { GeoJSON, LayersControl, MapContainer, TileLayer, type MapContainerProps } from 'react-leaflet';
import { polygonsBounds } from '../common/geo.ts';

type MapPreviewProps = {
  className?: string;
  polygon?: Polygon;
  center?: LatLngExpression;
  zoom?: number;
  /** Abre el mapa con la capa de satélite en lugar de la de calles */
  satellite?: boolean;
  children?: ReactNode;
};

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const MAX_ZOOM = 19;

export const MAP_BOUNDS_PADDING: [number, number] = [24, 24];

/** Capas base (calles y satélite) con su selector */
export const BaseLayers = ({ satellite = false }: { satellite?: boolean }) => {
  const { t } = useTranslation();

  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked={!satellite} name={t('common.map.streets')}>
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_URL} maxZoom={MAX_ZOOM} />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer checked={satellite} name={t('common.map.satellite')}>
        <TileLayer attribution={SATELLITE_ATTRIBUTION} url={SATELLITE_URL} maxZoom={MAX_ZOOM} />
      </LayersControl.BaseLayer>
    </LayersControl>
  );
};

export const MapPreview = ({ className, polygon, center, zoom = 16, satellite, children }: MapPreviewProps) => {
  const { t } = useTranslation();
  // Con polígono, el mapa se encuadra en él; si no, usa el centro indicado
  const bounds = useMemo(() => (polygon ? polygonsBounds([polygon]) : undefined), [polygon]);

  // Parcelas ingestadas sin geolocalización
  if (!bounds && !center) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center bg-base-200 text-base-content/70`}>
        {t('parcelas.noLocation')}
      </div>
    );
  }

  const mapProps: MapContainerProps = bounds
    ? { className, bounds, boundsOptions: { padding: MAP_BOUNDS_PADDING }, maxZoom: MAX_ZOOM }
    : { className, center, zoom, maxZoom: MAX_ZOOM };

  return (
    <MapContainer {...mapProps}>
      <BaseLayers satellite={satellite} />
      {polygon && <GeoJSON data={polygon} />}
      {children}
    </MapContainer>
  );
};
