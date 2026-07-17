import { useTranslation } from 'react-i18next';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { FilterCollapse } from './filter-collapse.component';

export const ReferenciaFilterCollapse = ({
  filters,
  setFilters,
}: {
  filters: CompareFilterType;
  setFilters: (f: CompareFilterType) => void;
}) => {
  const { t } = useTranslation();
  const enabled = filters.soloParcelasReferencia === true;

  return (
    <FilterCollapse
      title={t('compare.filters.referenceOnly')}
      enabled={enabled}
      onToggle={(isEnabled) =>
        setFilters({
          ...filters,
          soloParcelasReferencia: isEnabled || undefined,
        })
      }
    />
  );
};