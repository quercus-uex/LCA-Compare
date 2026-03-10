import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { LatLng, type LeafletMouseEvent } from 'leaflet';

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

  useEffect(() => {
    if (!enabled) setFilters({ ...filters, lat: undefined, long: undefined, range: undefined });
  }, [enabled])

  useEffect(() => {
    if (enabled) {
      setFilters({ ...filters, lat: target?.lat, long: target?.lng, range });
    }
  }, [target, range]);

  function MapClickHandler() {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        setTarget(e.latlng);
      }
    })
    return null;
  }

  return (
    <div
      className={`collapse bg-base-100 border-base-300 border ${enabled ? 'collapse-open' : ''}`}
    >
      <div className="flex p-5">
        <div className="flex gap-2 items-center justify-between w-full">
          <p className="font-semibold text-lg">Ubicación</p>
          <input
            type="checkbox"
            className="toggle toggle-lg"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </div>
      </div>

      <div className="collapse-content">
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
            <p>Rango: {range} m</p>
            <input
              className="range range-primary w-full"
              type="range"
              min={1}
              max={100000}
              value={range}
              onChange={(e) => setRange(parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}