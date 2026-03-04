import { useEffect, useState } from 'react';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { type Poblacion, useLocation } from '../../hooks/location.hook.tsx';

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
  const [poblaciones, setPoblaciones] = useState<Poblacion[]>([]);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    if (!enabled) setFilters({ ...filters, poblacion: undefined });
  }, [enabled]);

  useEffect(() => {
    location.getPoblacionesByName(query)
      .then(p => setPoblaciones(p))
  }, [query]);

  return (
    <div
      className={`collapse bg-base-100 border-base-300 border ${enabled ? 'collapse-open' : ''}`}
    >
      <div className="flex p-5">
        <div className="flex gap-2 items-center justity-between w-full">
          <p className="font-semibold text-lg">Población</p>
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
            placeholder="Población..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <ul className="list rounded-box shadow-sm h-40 overflow-auto bg-base-100">
            {poblaciones.map((p) => (
              <li
                key={p.id}
                className={`list-row rounded-none flex hover:bg-base-300 cursor-pointer ${p.id === filters.poblacion?.id ? 'bg-base-300' : ''}`}
                onClick={() => setFilters({ ...filters, poblacion: p })}
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