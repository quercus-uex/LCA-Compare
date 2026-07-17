import { useEffect, useState } from 'react';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { type Poblacion, useLocation } from '../../hooks/location.hook.tsx';
import { useDebouncedValue } from '../../hooks/use-debounced-value.ts';
import { FilterCollapse } from './filter-collapse.component';
import { useTranslation } from 'react-i18next';

export const PoblacionFilterCollapse = (
  {
    filters,
    setFilters,
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void
  }
) => {
  const location = useLocation();
  const { t } = useTranslation();
  const [poblaciones, setPoblaciones] = useState<Poblacion[]>([]);
  const [enabled, setEnabled] = useState<boolean>(
    !!filters.poblaciones?.length,
  );
  const [query, setQuery] = useState<string>('');
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    let cancelled = false;
    location.getPoblacionesByName(debouncedQuery)
      .then(p => { if (!cancelled) setPoblaciones(p); });
    return () => { cancelled = true; };
  }, [location, debouncedQuery]);

  const togglePoblacion = (p: Poblacion) => {
    const selected = filters.poblaciones!;
    if (selected.find((i) => i.id === p.id)) {
      setFilters({ ...filters, poblaciones: selected.filter((i) => i.id !== p.id) });
    } else {
      setFilters({ ...filters, poblaciones: [...selected, p] });
    }
  };

  return (
    <FilterCollapse
      title={t('compare.filters.town')}
      enabled={enabled}
      onToggle={(isEnabled) => {
        setEnabled(isEnabled);
        if (!isEnabled) setFilters({ ...filters, poblaciones: [] });
      }}
    >
      <div className="flex flex-col gap-5 w-full">
        <input
          className="input w-full"
          placeholder={t('compare.filters.placeholders.town')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <ul className="list rounded-box shadow-sm h-40 overflow-auto bg-base-100">
          {poblaciones.map((p) => (
            <li
              key={p.id}
              className={`list-row rounded-none flex items-center hover:bg-base-300 cursor-pointer ${filters.poblaciones!.find((i) => i.id === p.id) ? 'bg-base-300' : ''}`}
              onClick={() => togglePoblacion(p)}
            >
              {p.nombre}
              <div className="badge badge-md badge-primary w-12">
                {p.provincia?.pais?.codigo ?? p.provincia?.nombre ?? ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </FilterCollapse>
  );
}
