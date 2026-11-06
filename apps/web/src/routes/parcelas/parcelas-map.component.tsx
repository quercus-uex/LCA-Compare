import type { Polygon } from 'geojson';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiInfo } from 'react-icons/fi';
import { CircleMarker, GeoJSON, MapContainer, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router';
import { formatCampaignDate } from '../../common/format.ts';
import { polygonsBounds } from '../../common/geo.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import { BaseLayers, MAP_BOUNDS_PADDING } from '../../components/map-preview.component.tsx';
import type { ParcelaResumen } from '../../hooks/parcela.hook.tsx';
import { getCropTypeStyle } from '../../hooks/use-crop-type-label.ts';
import { formatPoblacion, type ParcelaLinkState } from './parcelas.utils.ts';

// Reencuadra el mapa cuando cambian las parcelas visibles (búsqueda o filtros)
const FitBounds = ({ bounds }: { bounds: LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: MAP_BOUNDS_PADDING });
  }, [map, bounds]);
  return null;
};

// Por debajo de este zoom una parcela ocupa pocos píxeles y se marca con un punto
const MARKER_MAX_ZOOM = 14;

const ZoomTracker = ({ onZoom }: { onZoom: (zoom: number) => void }) => {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
};

const centerOf = (geom: Polygon): LatLngTuple | undefined => {
  const bounds = polygonsBounds([geom]) as [LatLngTuple, LatLngTuple] | undefined;
  return bounds && [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
};

type ParcelaConGeom = ParcelaResumen & { geom: Polygon };

export const ParcelasMap = ({ parcelas, linkState }: { parcelas: ParcelaResumen[]; linkState: ParcelaLinkState }) => {
  const { t } = useTranslation();
  const conGeom = useMemo(() => parcelas.filter((p): p is ParcelaConGeom => !!p.geom), [parcelas]);
  const bounds = useMemo(() => polygonsBounds(conGeom.map((p) => p.geom)), [conGeom]);
  const sinGeom = parcelas.length - conGeom.length;
  const [zoom, setZoom] = useState<number | undefined>();

  if (!bounds) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-box bg-base-100 text-base-content/70 shadow-sm">
        {t('parcelas.map.noneWithLocation')}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {sinGeom > 0 && (
        <p className="flex items-center gap-2 text-sm text-base-content/70">
          <FiInfo aria-hidden />
          {t('parcelas.map.withoutLocation', { count: sinGeom })}
        </p>
      )}
      <MapContainer
        className="h-[70vh] min-h-96 w-full rounded-box shadow-sm"
        bounds={bounds}
        boundsOptions={{ padding: MAP_BOUNDS_PADDING }}
        maxZoom={19}
      >
        <BaseLayers satellite />
        <FitBounds bounds={bounds} />
        <ZoomTracker onZoom={setZoom} />
        {conGeom.map((p) => {
          const color = p.ultimoCultivo ? getCropTypeStyle(p.ultimoCultivo.tipo).color : '#64748b';
          const center = centerOf(p.geom);
          const popup = (
            <Popup>
              <div className="flex min-w-48 flex-col gap-1.5">
                <strong className="text-base">{p.nombre}</strong>
                <span>{formatPoblacion(p.poblacion, t)}</span>
                {p.ultimoCultivo && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <CropTypeBadge tipo={p.ultimoCultivo.tipo} className="badge-sm" />
                    {formatCampaignDate(p.ultimoCultivo.fechaInicioCampania)}
                  </span>
                )}
                <Link to={`/parcelas/${p.id}`} state={linkState} className="btn btn-primary btn-sm mt-1 text-primary-content!">
                  {t('parcelas.viewPlot')}
                </Link>
              </div>
            </Popup>
          );
          return (
            <Fragment key={p.id}>
              <GeoJSON data={p.geom} style={{ color, weight: 2, fillOpacity: 0.35 }}>{popup}</GeoJSON>
              {center && zoom !== undefined && zoom < MARKER_MAX_ZOOM && (
                <CircleMarker
                  center={center}
                  radius={8}
                  pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }}
                >
                  {popup}
                </CircleMarker>
              )}
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
