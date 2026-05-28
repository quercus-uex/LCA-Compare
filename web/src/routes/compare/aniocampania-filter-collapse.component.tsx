import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { useEffect, useState } from 'react';
import { FilterCollapse } from './filter-collapse.component';

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
    <FilterCollapse title="Fecha de campaña" enabled={enabled} onToggle={setEnabled}>
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
    </FilterCollapse>
  );
}
