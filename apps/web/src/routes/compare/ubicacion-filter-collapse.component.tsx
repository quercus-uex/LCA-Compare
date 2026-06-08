import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { useState } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { LatLng, type LeafletMouseEvent } from 'leaflet';
import { FilterCollapse } from './filter-collapse.component';
import { useTranslation } from 'react-i18next';

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
        <MapContainer
          center={{ lat: 39.46292681484013, lng: -6.329063770806773 }}
          zoom={10}
          className="w-full aspect-square"
        >
          {target && (
            <>
              <Marker position={target} />
              <Circle center={target} radius={range} />
            </>
          )}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />
        </MapContainer>
        <div className="flex flex-col gap-2">
          <p>{t('compare.filters.range', { range })}</p>
          <input
            className="range range-primary w-full"
            type="range"
            min={1}
            max={100000}
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
