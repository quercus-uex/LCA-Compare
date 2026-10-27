import { useTranslation } from 'react-i18next';
import { FiActivity, FiBox, FiGrid } from 'react-icons/fi';
import {
  EF_CATEGORIES,
  getEfCategory,
  type EfCategoryId,
} from '../common/constants.ts';
import {
  formatImpactValue,
  formatInteger,
  formatPercent,
} from './stats-formatters.ts';
import type { KpiDto } from './stats.hook.tsx';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  kpis: KpiDto;
  /** Provincias con datos, se muestren o no en el ranking */
  numProvincias: number;
  anio?: number;
  selectedCategory: EfCategoryId;
  onCategoryChange: (category: EfCategoryId) => void;
};

// En todas las categorías EF un valor menor es mejor
const yoyClass = (value: number) =>
  value < 0 ? 'text-success-content bg-success' : value > 0 ? 'text-error-content bg-error' : 'bg-base-200';

const YoyBadge = ({ value, small = false }: { value: number; small?: boolean }) => (
  <span
    className={`badge ${small ? 'badge-xs' : 'badge-sm'} border-0 font-mono ${yoyClass(value)}`}
  >
    {value < 0 ? '↓' : value > 0 ? '↑' : '='} {formatPercent(Math.abs(value))}
  </span>
);

export const StatsOverview = ({
  kpis,
  numProvincias,
  anio,
  selectedCategory,
  onCategoryChange,
}: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const selected = getEfCategory(selectedCategory);
  const selectedValue = kpis.impactosPorCategoria[selectedCategory] ?? 0;
  const selectedYoy = kpis.variacionInteranual?.[selectedCategory] ?? null;

  const contextStats = [
    {
      icon: <FiGrid />,
      label: t('stats.kpis.plots'),
      value: formatInteger(kpis.totalParcelas),
      desc: t('stats.kpis.inProvinces', { count: numProvincias }),
    },
    {
      icon: <FiBox />,
      label: t('stats.kpis.crops'),
      value: formatInteger(kpis.totalCultivos),
      desc: t('stats.kpis.cropsWithImpact', { count: kpis.cultivosConImpacto }),
    },
    {
      icon: <FiActivity />,
      label: t('stats.kpis.area'),
      value: formatInteger(kpis.superficieTotal),
      unit: t('stats.kpis.areaUnit'),
      // Sin año, la misma parcela suma su superficie en cada campaña
      desc:
        anio === undefined
          ? t('stats.kpis.areaAllYears')
          : t('stats.kpis.areaYear', { year: anio }),
    },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <div
          className="card bg-base-100 shadow-sm border-l-8"
          style={{ borderLeftColor: selected?.color }}
        >
          <div className="card-body gap-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">
              {t('stats.kpis.meanPerCrop')}
            </p>
            <p className="font-semibold" style={{ color: selected?.color }}>
              {getCategoryLabel(selectedCategory)}
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-3xl font-bold tabular-nums">
                {formatImpactValue(selectedValue, '0')}
              </span>
              <span className="text-sm text-base-content/60">{selected?.unit}</span>
            </p>
            <div className="mt-1 text-xs text-base-content/60">
              {anio === undefined ? (
                t('stats.kpis.yoyHint')
              ) : selectedYoy === null ? (
                t('stats.kpis.noPreviousYear', { year: anio - 1 })
              ) : (
                <span className="flex flex-wrap items-center gap-2">
                  <YoyBadge value={selectedYoy} />
                  {t('stats.kpis.vsYear', { year: anio - 1 })}
                  <span>
                    · {t('stats.kpis.comparablePlots', { count: kpis.parcelasComparables ?? 0 })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stats stats-vertical bg-base-100 shadow-sm sm:stats-horizontal">
          {contextStats.map((stat) => (
            <div key={stat.label} className="stat min-w-0 px-4 py-3">
              <div className="stat-title flex items-center gap-1 text-xs">
                {stat.icon}
                {stat.label}
              </div>
              <div className="stat-value text-2xl tabular-nums">
                {stat.value}
                {stat.unit && (
                  <span className="ml-1 text-sm font-normal text-base-content/60">
                    {stat.unit}
                  </span>
                )}
              </div>
              <div className="stat-desc whitespace-normal">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="sr-only">{t('stats.kpis.allCategories')}</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
          {EF_CATEGORIES.map((cat) => {
            const isSelected = cat.id === selectedCategory;
            const yoy = kpis.variacionInteranual?.[cat.id] ?? null;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isSelected}
                title={`${getCategoryLabel(cat.id)} (${cat.unit})`}
                onClick={() => onCategoryChange(cat.id)}
                className={`flex min-w-0 flex-col gap-0.5 rounded-box border-l-4 bg-base-100 px-3 py-2 text-left shadow-sm transition hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                style={{ borderLeftColor: cat.color }}
              >
                <span className="truncate text-xs font-semibold" style={{ color: cat.color }}>
                  {getCategoryLabel(cat.id)}
                </span>
                <span className="flex items-baseline justify-between gap-1">
                  <span className="truncate font-mono text-sm font-bold">
                    {formatImpactValue(kpis.impactosPorCategoria[cat.id] ?? 0, '0')}
                  </span>
                  {yoy !== null && <YoyBadge value={yoy} small />}
                </span>
                <span className="truncate text-[10px] text-base-content/50">{cat.unit}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
