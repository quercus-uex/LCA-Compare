import { useState } from 'react';
import { ProvinciaFilterCollapse } from './provincia-filter-collapse.component.tsx';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { PoblacionFilterCollapse } from './poblacion-filter-collapse.component.tsx';
import { UbicacionFilterCollapse } from './ubicacion-filter-collapse.component.tsx';
import { TipocultivoFilterCollapse } from './tipocultivo-filter-collapse.component.tsx';
import { AniocampaniaFilterCollapse } from './aniocampania-filter-collapse.component.tsx';
import { PaisFilterCollapse } from './pais-filter-collapse.component.tsx';
import { ParcelaFilterCollapse } from './parcela-filter-collapse.component.tsx';
import { ReferenciaFilterCollapse } from './referencia-filter-collapse.component.tsx';
import { useTranslation } from 'react-i18next';

type ChipItem = { id: string; nombre: string };

const SelectedChips = ({ items, onRemove }: { items: ChipItem[]; onRemove: (id: string) => void }) => (
  <>
    {items.map((p) => (
      <div
        key={p.id}
        className="badge badge-primary cursor-pointer"
        onClick={() => onRemove(p.id)}
      >
        {p.nombre}
      </div>
    ))}
  </>
);

export const CompareFilterCard = (
  { name, required = false, initialFilters, onSubmit }: { name: string, required?: boolean, initialFilters?: CompareFilterType, onSubmit: (data?: CompareFilterType) => void }
) => {
  const [enabled, setEnabled] = useState<boolean>(required || !!initialFilters);
  const [filters, setFilters] = useState<CompareFilterType>(initialFilters ?? {
    parcelas: [],
    provincias: [],
    poblaciones: [],
  });
  const { t } = useTranslation();

  return (
    <div className="collapse max-xl:collapse-close xl:collapse-open xl:card bg-base-100 xl:min-w-72 xl:w-1/5 h-fit xl:flex-1">
      <input type="checkbox" name="compare-filters" className="xl:hidden" />

      <div className="collapse-title font-semibold xl:hidden">{name}</div>

      <div className="collapse-content xl:card-body">
        <div className="flex xl:justify-between max-xl:justify-end">
          <h2 className="card-title text-xl max-xl:hidden">{name}</h2>
          {!required && (
            <input
              type="checkbox"
              className="toggle toggle-lg"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                if (!e.target.checked) onSubmit(undefined);
              }}
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center justify-start flex-wrap min-h-6">
            <SelectedChips
              items={filters.provincias ?? []}
              onRemove={(id) => setFilters({
                ...filters,
                provincias: filters.provincias?.filter((i) => i.id !== id),
              })}
            />
            <SelectedChips
              items={filters.poblaciones ?? []}
              onRemove={(id) => setFilters({
                ...filters,
                poblaciones: filters.poblaciones?.filter((i) => i.id !== id),
              })}
            />
            <SelectedChips
              items={filters.parcelas ?? []}
              onRemove={(id) => setFilters({
                ...filters,
                parcelas: filters.parcelas?.filter((i) => i.id !== id),
              })}
            />
            {filters.pais && (
              <div
                className="badge badge-primary cursor-pointer"
                onClick={() => setFilters({ ...filters, pais: undefined })}
              >
                {filters.pais.nombre}
              </div>
            )}
          </div>

          <PaisFilterCollapse filters={filters} setFilters={setFilters} />
          <ProvinciaFilterCollapse filters={filters} setFilters={setFilters} />
          <PoblacionFilterCollapse filters={filters} setFilters={setFilters} />
          <ParcelaFilterCollapse filters={filters} setFilters={setFilters} />
          <UbicacionFilterCollapse filters={filters} setFilters={setFilters} />

          <div className="flex gap-2">
            <div className="divider w-full p-0 m-0" />
            {t('compare.filters.and')}
            <div className="divider w-full p-0 m-0" />
          </div>

          <TipocultivoFilterCollapse
            filters={filters}
            setFilters={setFilters}
          />
          <AniocampaniaFilterCollapse
            filters={filters}
            setFilters={setFilters}
          />
          <ReferenciaFilterCollapse filters={filters} setFilters={setFilters} />

          <button
            className={`btn btn-primary ${!enabled ? 'btn-disabled' : ''}`}
            onClick={() => onSubmit(filters)}
          >
            {t('common.actions.applyFilters')}
          </button>
        </div>
      </div>
    </div>
  );
}
