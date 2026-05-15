import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { type Pais, useLocation } from '../../hooks/location.hook.tsx';
import { useEffect, useState } from 'react';
import { FilterCollapse } from './filter-collapse.component';

export const PaisFilterCollapse = (
  {
    filters,
    setFilters,
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void,
  }
) => {
  const location = useLocation();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [enabled, setEnabled] = useState<boolean>(false);
  
  useEffect(() => {
    if (!enabled) setFilters({ ...filters, pais: undefined });
  }, [enabled]);
  
  useEffect(() => {
    location.getPaises()
      .then(p => setPaises(p))
  }, []);
  
  return (
    <FilterCollapse title="País" enabled={enabled} onToggle={setEnabled}>
      <div className="join flex">
        {paises.map((pais) => (
          <button
            key={pais.id}
            className={`btn join-item grow ${filters.pais?.id === pais.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilters({ ...filters, pais })}
          >
            {pais.nombre}
          </button>
        ))}
      </div>
    </FilterCollapse>
  );
  
}