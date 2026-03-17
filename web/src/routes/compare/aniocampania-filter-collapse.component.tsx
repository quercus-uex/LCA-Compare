import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { useEffect, useState } from 'react';

export const AniocampaniaFilterCollapse = (
  {
    filters,
    setFilters
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void
  }
) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [startEnabled, setStartEnabled] = useState<boolean>(false);
  const [endEnabled, setEndEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled) setFilters({ ...filters, anioCampaniaInicio: undefined, anioCampaniaFin: undefined });
  }, [enabled]);

  useEffect(() => {
    if (!startEnabled) setFilters({ ...filters, anioCampaniaInicio: undefined });
    if (!endEnabled) setFilters({ ...filters, anioCampaniaFin: undefined });
  }, [startEnabled, endEnabled])
  
  return (
    <div
      className={`collapse bg-base-100 border-base-300 border ${enabled ? 'collapse-open' : ''}`}
    >
      <div className="flex p-5">
        <div className="flex gap-2 items-center justify-between w-full">
          <p className="font-semibold text-lg">Fecha de campaña</p>
          <input
            type="checkbox"
            className="toggle toggle-lg"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </div>
      </div>

      <div className="collapse-content">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center w-full">
            <input
              type="checkbox"
              className="checkbox"
              onChange={(e) => setStartEnabled(e.target.checked)}
            />
            <p>Desde: </p>
            <input
              type="number"
              min="2020"
              className="input"
              onChange={(e) => {
                if (startEnabled)
                  setFilters({
                    ...filters,
                    anioCampaniaInicio: parseInt(e.target.value),
                  });
              }}
            />
          </div>
          <div className="flex gap-2 items-center w-full">
            <input
              type="checkbox"
              className="checkbox"
              onChange={(e) => setEndEnabled(e.target.checked)}
            />
            <p>Hasta: </p>
            <input
              type="number"
              min="2020"
              className="input"
              onChange={(e) => {
                if (endEnabled)
                  setFilters({
                    ...filters,
                    anioCampaniaFin: parseInt(e.target.value),
                  });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}