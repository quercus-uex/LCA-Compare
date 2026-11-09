import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Input } from '../../components/ui/index.ts';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { FilterCollapse } from './filter-collapse.component';

export const AniocampaniaFilterCollapse = (
  {
    filters,
    setFilters
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void
  }
) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [startEnabled, setStartEnabled] = useState<boolean>(false);
  const [endEnabled, setEndEnabled] = useState<boolean>(false);
  const { t } = useTranslation();

  return (
    <FilterCollapse
      title={t('compare.filters.campaignDate')}
      enabled={enabled}
      onToggle={(isEnabled) => {
        setEnabled(isEnabled);
        if (!isEnabled) setFilters({ ...filters, anioCampaniaInicio: undefined, anioCampaniaFin: undefined });
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center w-full">
          <Checkbox
            label={t('common.fields.start')}
            className="shrink-0"
            onChange={(e) => {
              setStartEnabled(e.target.checked);
              if (!e.target.checked) setFilters({ ...filters, anioCampaniaInicio: undefined });
            }}
          />
          <Input
            type="number"
            min="2020"
            aria-label={t('common.fields.start')}
            onChange={(e) => {
              if (startEnabled)
                setFilters({
                  ...filters,
                  anioCampaniaInicio: parseInt(e.target.value),
                });
            }}
          />
        </div>
        <div className="flex gap-2 items-center w-full">
          <Checkbox
            label={t('common.fields.end')}
            className="shrink-0"
            onChange={(e) => {
              setEndEnabled(e.target.checked);
              if (!e.target.checked) setFilters({ ...filters, anioCampaniaFin: undefined });
            }}
          />
          <Input
            type="number"
            min="2020"
            aria-label={t('common.fields.end')}
            onChange={(e) => {
              if (endEnabled)
                setFilters({
                  ...filters,
                  anioCampaniaFin: parseInt(e.target.value),
                });
            }}
          />
        </div>
      </div>
    </FilterCollapse>
  );
}
