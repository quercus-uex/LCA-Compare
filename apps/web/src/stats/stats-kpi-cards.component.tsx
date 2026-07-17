import { useTranslation } from 'react-i18next';
import { FiBox, FiGrid, FiActivity } from 'react-icons/fi';
import { EF_CATEGORIES } from '../common/constants.ts';
import { formatInteger, formatNumber } from './stats-formatters.ts';
import type { KpiDto } from './stats.hook.tsx';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  kpis: KpiDto;
};

export const StatsKPICards = ({ kpis }: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {EF_CATEGORIES.map((cat) => {
          const value = kpis.impactosPorCategoria[cat.id] ?? 0;
          return (
            <div
              key={cat.id}
              className="card bg-base-100 shadow-sm border-l-4"
              style={{ borderLeftColor: cat.color }}
            >
              <div className="card-body p-3">
                <div
                  className="text-xs font-semibold truncate tooltip tooltip-top"
                  data-tip={`${getCategoryLabel(cat.id)} (${cat.unit})`}
                  style={{ color: cat.color }}
                >
                  {getCategoryLabel(cat.id)}
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-bold truncate">
                    {formatNumber(value, 4)}
                  </span>
                </div>
                <div className="text-[10px] text-base-content/50 truncate">
                  {cat.unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="stat bg-base-100 shadow-sm rounded-box px-4 py-2 min-w-0 flex-1">
          <div className="stat-title text-xs flex items-center gap-1">
            <FiGrid size={14} />
            {t('stats.kpis.plots')}
          </div>
          <div className="stat-value text-lg">
            {formatInteger(kpis.totalParcelas)}
          </div>
        </div>
        <div className="stat bg-base-100 shadow-sm rounded-box px-4 py-2 min-w-0 flex-1">
          <div className="stat-title text-xs flex items-center gap-1">
            <FiBox size={14} />
            {t('stats.kpis.crops')}
          </div>
          <div className="stat-value text-lg">
            {formatInteger(kpis.totalCultivos)}
          </div>
        </div>
        <div className="stat bg-base-100 shadow-sm rounded-box px-4 py-2 min-w-0 flex-1">
          <div className="stat-title text-xs flex items-center gap-1">
            <FiActivity size={14} />
            {t('stats.kpis.area')}
          </div>
          <div className="stat-value text-lg">
            {formatInteger(kpis.superficieTotal)}{' '}
            <span className="text-sm font-normal text-base-content/50">Ha</span>
          </div>
        </div>
        {kpis.variacionInteranual !== null && (
          <div className="stat bg-base-100 shadow-sm rounded-box px-4 py-2 min-w-0 flex-1">
            <div className="stat-title text-xs">{t('stats.kpis.yoy')}</div>
            <div
              className={`stat-value text-lg ${
                kpis.variacionInteranual <= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {kpis.variacionInteranual <= 0 ? '↓' : '↑'}{' '}
              {Math.abs(kpis.variacionInteranual).toFixed(1)}%
            </div>
            <div className="stat-desc text-[10px]">{t('stats.kpis.vsPreviousYear')}</div>
          </div>
        )}
      </div>
    </div>
  );
};
