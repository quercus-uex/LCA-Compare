import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { useTranslation } from 'react-i18next';

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
    <div
      className={`collapse bg-base-100 border-base-300 border ${enabled ? 'collapse-open' : ''}`}
    >
      <div className="flex p-5">
        <div className="flex gap-2 items-center justify-between w-full">
          <p className="font-semibold text-lg">
            {t('compare.filters.referenceOnly')}
          </p>
          <input
            type="checkbox"
            className="toggle toggle-lg"
            checked={enabled}
            onChange={(e) =>
              setFilters({
                ...filters,
                soloParcelasReferencia: e.target.checked || undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
};