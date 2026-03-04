import { useEffect, useState } from 'react';
import { ProvinciaFilterCollapse } from './provincia-filter-collapse.component.tsx';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { PoblacionFilterCollapse } from './poblacion-filter-collapse.component.tsx';
import { UbicacionFilterCollapse } from './ubicacion-filter-collapse.component.tsx';
import { TipocultivoFilterCollapse } from './tipocultivo-filter-collapse.component.tsx';

export const CompareFilterCard = (
  { name, required = false, onSubmit }: { name: string, required?: boolean, onSubmit: (data?: CompareFilterType) => void }
) => {
  const [enabled, setEnabled] = useState<boolean>(required);
  const [filters, setFilters] = useState<CompareFilterType>({});

  useEffect(() => {
    console.log(filters);
  }, [filters]);

  useEffect(() => {
    if (!enabled) onSubmit(undefined);
  }, [enabled]);

  return (
    <div className="card bg-base-100 min-w-72 w-1/5 h-fit">
      <div className="card-body">
        <div className="flex justify-between">
          <h2 className="card-title text-xl">{name}</h2>
          {!required && (
            <input
              type="checkbox"
              className="toggle toggle-lg"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center justify-start flex-wrap min-h-6">
            {filters.provincia && (
              <div className="badge badge-primary">
                {filters.provincia.nombre}
              </div>
            )}
            {filters.poblacion && (
              <div className="badge badge-primary">
                {filters.poblacion.nombre}
              </div>
            )}
          </div>

          <ProvinciaFilterCollapse filters={filters} setFilters={setFilters} />
          <PoblacionFilterCollapse filters={filters} setFilters={setFilters} />
          <UbicacionFilterCollapse filters={filters} setFilters={setFilters} />
          <TipocultivoFilterCollapse filters={filters} setFilters={setFilters} />

          <button
            className={`btn btn-primary ${!enabled ? 'btn-disabled' : ''}`}
            onClick={() => onSubmit(filters)}
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}