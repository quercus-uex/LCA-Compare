import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { FilterCollapse } from './filter-collapse.component';

const CROP_TYPE_OPTIONS = [
  { value: 'Tomate', labelKey: 'cropTypes.tomate' },
  { value: 'Olivo', labelKey: 'cropTypes.olivo' },
  { value: 'Ciruelo', labelKey: 'cropTypes.ciruelo' },
  { value: 'Viñedo', labelKey: 'cropTypes.vinedo' },
  { value: 'Arroz', labelKey: 'cropTypes.arroz' },
  { value: 'Melocotonero', labelKey: 'cropTypes.melocotonero' },
] as const;

export const TipocultivoFilterCollapse = (
  {
    filters,
    setFilters,
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void,
  }
) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const { t } = useTranslation();

  return (
    <FilterCollapse
      title={t('compare.filters.cropType')}
      enabled={enabled}
      onToggle={(isEnabled) => {
        setEnabled(isEnabled);
        if (!isEnabled) setFilters({ ...filters, tipoCultivo: undefined });
      }}
    >
      <select
        className="select w-full"
        value={filters.tipoCultivo}
        defaultValue={t('compare.filters.selectType')}
        onChange={(e) => {
          setFilters({ ...filters, tipoCultivo: e.target.value });
        }}
      >
        <option disabled>{t('compare.filters.selectType')}</option>
        {CROP_TYPE_OPTIONS.map(({ value, labelKey }) => (
          <option key={value} value={value}>{t(labelKey)}</option>
        ))}
      </select>
    </FilterCollapse>
  );
}
