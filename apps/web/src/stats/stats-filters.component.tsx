import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { useCropTypeLabel } from '../hooks/use-crop-type-label.ts';
import type { GlobalStatsDto } from './stats.hook.tsx';
import type { StatsFilters } from './use-stats-filters.ts';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  data: GlobalStatsDto;
  filters: StatsFilters;
  isFetching: boolean;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<StatsFilters>) => void;
  onReset: () => void;
};

export const StatsFiltersBar = ({
  data,
  filters,
  isFetching,
  hasActiveFilters,
  onChange,
  onReset,
}: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const getCropTypeLabel = useCropTypeLabel();

  return (
    <div className="z-20 rounded-box bg-base-200 px-4 py-3 md:sticky md:top-2 md:shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-1 sm:flex-none">
          <span className="text-xs font-medium text-base-content/70">
            {t('stats.filters.category')}
          </span>
          <select
            className="select select-bordered select-sm w-full"
            value={filters.categoria}
            onChange={(e) =>
              onChange({ categoria: e.target.value as EfCategoryId })
            }
          >
            {EF_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getCategoryLabel(cat.id)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-44 flex-1 flex-col gap-1 sm:flex-none">
          <span className="text-xs font-medium text-base-content/70">
            {t('stats.filters.crop')}
          </span>
          <select
            className="select select-bordered select-sm w-full"
            value={filters.tipoCultivo ?? ''}
            onChange={(e) =>
              onChange({ tipoCultivo: e.target.value || undefined })
            }
          >
            <option value="">{t('stats.filters.allCrops')}</option>
            {data.tiposCultivoDisponibles.map((tipo) => (
              <option key={tipo} value={tipo}>
                {getCropTypeLabel(tipo)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-40 flex-1 flex-col gap-1 sm:flex-none">
          <span className="text-xs font-medium text-base-content/70">
            {t('stats.filters.year')}
          </span>
          <select
            className="select select-bordered select-sm w-full"
            value={filters.anio ?? ''}
            onChange={(e) =>
              onChange({
                anio: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">{t('stats.filters.allYears')}</option>
            {[...data.aniosDisponibles].reverse().map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>
            <FiX />
            {t('stats.filters.reset')}
          </button>
        )}

        {isFetching && (
          <span
            className="ml-auto flex items-center gap-2 self-center text-xs text-base-content/60"
            role="status"
          >
            <span className="loading loading-spinner loading-xs" />
            {t('stats.updating')}
          </span>
        )}
      </div>
    </div>
  );
};
