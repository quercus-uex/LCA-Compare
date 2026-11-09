import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SegmentedControl } from '../../components/ui/index.ts';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { type Pais, useLocation } from '../../hooks/location.hook.tsx';
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
      <SegmentedControl
        label={t('compare.filters.country')}
        size="md"
        block
        options={paises.map((pais) => ({ value: pais.id, label: pais.nombre }))}
        value={filters.pais?.id}
        onChange={(id) => setFilters({ ...filters, pais: paises.find((p) => p.id === id) })}
      />
    </FilterCollapse>
  );

}
