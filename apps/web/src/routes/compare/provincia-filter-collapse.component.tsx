import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { toggleInArray } from '../../common/utils.ts';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { type Provincia, useLocation } from '../../hooks/location.hook.tsx';
import { FilterCollapse } from './filter-collapse.component';

export const ProvinciaFilterCollapse = (
  {
    filters,
    setFilters,
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void,
  }
) => {
  const location = useLocation();
  const { t } = useTranslation();

  const [enabled, setEnabled] = useState<boolean>(
    !!filters.provincias?.length,
  );
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    location.getProvincias()
      .then((p) => setProvincias(p))
      .catch(() => toast.error(t('location.provincesError')));
  }, [location, t]);

  const toggleProvincia = (p: Provincia) => {
    setFilters({ ...filters, provincias: toggleInArray(filters.provincias ?? [], p) });
  };

  return (
    <FilterCollapse
      title={t('compare.filters.province')}
      enabled={enabled}
      onToggle={(isEnabled) => {
        setEnabled(isEnabled);
        if (!isEnabled) setFilters({ ...filters, provincias: [] });
      }}
    >
      <div className="flex flex-col gap-5 w-full">
        <input
          className="input w-full"
          placeholder={t('compare.filters.placeholders.province')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <ul className="list rounded-box shadow-sm h-40 overflow-auto bg-base-100">
          {provincias
            .filter((p) =>
              p.nombre.toUpperCase().includes(query.toUpperCase()),
            )
            .map((p) => (
              <li
                key={p.id}
                className={`list-row rounded-none flex items-center hover:bg-base-300 cursor-pointer ${filters.provincias?.find(i => i.id === p.id) ? 'bg-base-300' : ''}`}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between"
                  onClick={() => toggleProvincia(p)}
                >
                  {p.nombre}
                  <div className="badge badge-md badge-primary line-clamp-1">{p.pais!.codigo}</div>
                </button>
              </li>
            ))}
        </ul>
      </div>
    </FilterCollapse>
  );
}
