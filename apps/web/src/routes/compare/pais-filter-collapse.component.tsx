import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { type Pais, useLocation } from '../../hooks/location.hook.tsx';
import { useEffect, useState } from 'react';
import { FilterCollapse } from './filter-collapse.component';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
  const { t } = useTranslation();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [enabled, setEnabled] = useState<boolean>(false);
  
  useEffect(() => {
    location.getPaises()
      .then(p => setPaises(p))
      .catch(() => toast.error(t('location.countriesError')));
  }, [location, t]);
  
  return (
    <FilterCollapse
      title={t('compare.filters.country')}
      enabled={enabled}
      onToggle={(isEnabled) => {
        setEnabled(isEnabled);
        if (!isEnabled) setFilters({ ...filters, pais: undefined });
      }}
    >
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
