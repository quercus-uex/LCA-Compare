import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { useState } from 'react';
import { Circle, Marker, useMapEvents } from 'react-leaflet';
import { LatLng, type LeafletMouseEvent } from 'leaflet';
import { FilterCollapse } from './filter-collapse.component';
import { MapPreview } from '../../components/map-preview.component.tsx';
import { useTranslation } from 'react-i18next';
import { DEFAULT_MAP_CENTER, UBICACION_RANGE_MAX, UBICACION_RANGE_MIN } from '../../common/constants.ts';

export const UbicacionFilterCollapse = (
  {
    filters,
    setFilters,
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void,
  }
) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [target, setTarget] = useState<LatLng | undefined>();
  const [range, setRange] = useState<number>(1);
  const { t } = useTranslation();

  function MapClickHandler() {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        setTarget(e.latlng);
        if (enabled) setFilters({ ...filters, lat: e.latlng.lat, long: e.latlng.lng, range });
      }
    })
    return null;
  }

  return (
    <FilterCollapse
      title={t('compare.filters.location')}
      enabled={enabled}
      onToggle={(isEnabled) => {
        setEnabled(isEnabled);
        setFilters({
          ...filters,
          lat: isEnabled ? target?.lat : undefined,
          long: isEnabled ? target?.lng : undefined,
          range: isEnabled ? range : undefined,
        });
      }}
    >
      <div className="flex flex-col gap-5 w-full">
        <MapPreview
          className="w-full aspect-square"
          center={DEFAULT_MAP_CENTER}
          zoom={10}
        >
          {target && (
            <>
              <Marker position={target} />
              <Circle center={target} radius={range} />
            </>
          )}
          <MapClickHandler />
        </MapPreview>
        <div className="flex flex-col gap-2">
          <p>{t('compare.filters.range', { range })}</p>
          <input
            className="range range-primary w-full"
            type="range"
            min={UBICACION_RANGE_MIN}
            max={UBICACION_RANGE_MAX}
            value={range}
            onChange={(e) => {
              const nextRange = parseInt(e.target.value);
              setRange(nextRange);
              if (enabled) setFilters({ ...filters, lat: target?.lat, long: target?.lng, range: nextRange });
            }}
          />
        </div>
      </div>
    </FilterCollapse>
  );
}
