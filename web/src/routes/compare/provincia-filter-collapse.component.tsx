import { useEffect, useState } from 'react';
import { type Provincia, useLocation } from '../../hooks/location.hook.tsx';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';

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

  const [enabled, setEnabled] = useState<boolean>(false);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    location.getProvincias().then((p) => setProvincias(p));
  }, [location]);

  useEffect(() => {
    if (!enabled) setFilters({ ...filters, provincia: undefined });
  }, [enabled]);

  return (
    <div
      className={`collapse bg-base-100 border-base-300 border ${enabled ? 'collapse-open' : ''}`}
    >
      <div className="flex p-5">
        <div className="flex gap-2 items-center justify-between w-full">
          <p className="font-semibold text-lg">Provincia</p>
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
          <input
            className="input w-full"
            placeholder="Provincia..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <ul className="list rounded-box shadow-sm h-40 overflow-auto bg-base-100">
            {provincias
              .filter((p) =>
                p.nombre.match(new RegExp(`^.*${query.toUpperCase()}.*$`)),
              )
              .map((p) => (
                <li
                  key={p.id}
                  className={`list-row rounded-none flex hover:bg-base-300 cursor-pointer ${p.id === filters.provincia?.id ? 'bg-base-300' : ''}`}
                  onClick={() => setFilters({ ...filters, provincia: p })}
                >
                  {p.nombre}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}