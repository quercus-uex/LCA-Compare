import { useTranslation } from 'react-i18next';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { SearchableLocationSelect } from './searchable-location-select.component.tsx';
import {
  CHART_GRID_STROKE,
  CHART_SMALL_TICK,
  PROFILE_COLORS,
} from './stats-chart-theme.ts';
import { formatImpactValue, formatNumber } from './stats-formatters.ts';
import { StatsPlaceholder } from './stats-section.component.tsx';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

export type ProfileMode = 'province' | 'town';

export type ProfileEntity = {
  id: string;
  nombre: string;
  impactosPorCategoria: Record<EfCategoryId, number>;
};

type Props = {
  mode: ProfileMode;
  entities: ProfileEntity[];
  primary: ProfileEntity | null;
  secondary: ProfileEntity | null;
  onModeChange: (mode: ProfileMode) => void;
  onPrimaryChange: (entity: ProfileEntity | null) => void;
  onSecondaryChange: (entity: ProfileEntity | null) => void;
};

const MODES: ProfileMode[] = ['province', 'town'];

type ChartRow = {
  category: string;
  unit: string;
  primary: number;
  primaryRaw: number;
  secondary?: number;
  secondaryRaw?: number;
};

export const StatsSpiderChart = ({
  mode,
  entities,
  primary,
  secondary,
  onModeChange,
  onPrimaryChange,
  onSecondaryChange,
}: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const entityLabel = t(`stats.chart.${mode}`).toLowerCase();

  // Cada eje se normaliza respecto a la zona con mayor impacto en esa categoría
  const maxByCategory = Object.fromEntries(
    EF_CATEGORIES.map((cat) => [
      cat.id,
      Math.max(...entities.map((e) => e.impactosPorCategoria[cat.id] ?? 0), 0),
    ]),
  ) as Record<EfCategoryId, number>;
  const normalize = (catId: EfCategoryId, value: number) => {
    const max = maxByCategory[catId];
    return max > 0 ? Math.max(value / max, 0) : 0;
  };

  const chartData: ChartRow[] = primary
    ? EF_CATEGORIES.map((cat) => {
        const primaryRaw = primary.impactosPorCategoria[cat.id] ?? 0;
        const secondaryRaw = secondary?.impactosPorCategoria[cat.id];
        return {
          category: getCategoryLabel(cat.id),
          unit: cat.unit,
          primary: normalize(cat.id, primaryRaw),
          primaryRaw,
          ...(secondaryRaw !== undefined && {
            secondary: normalize(cat.id, secondaryRaw),
            secondaryRaw,
          }),
        };
      })
    : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="tabs tabs-box tabs-sm">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`tab ${mode === m ? 'tab-active' : ''}`}
              onClick={() => onModeChange(m)}
            >
              {t(`stats.chart.${m}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: PROFILE_COLORS[0] }} />
          <SearchableLocationSelect<ProfileEntity>
            items={entities}
            value={primary}
            onChange={onPrimaryChange}
            getLabel={(e) => e.nombre}
            getId={(e) => e.id}
            placeholder={t('stats.chart.searchEntity', { entity: entityLabel })}
            emptyMessage={t('common.empty.noResults')}
          />
        </div>
        <div className="flex flex-1 items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: PROFILE_COLORS[1] }} />
          <SearchableLocationSelect<ProfileEntity>
            items={entities.filter((e) => e.id !== primary?.id)}
            value={secondary}
            onChange={onSecondaryChange}
            getLabel={(e) => e.nombre}
            getId={(e) => e.id}
            placeholder={t('stats.chart.compareWith')}
            emptyMessage={t('common.empty.noResults')}
          />
        </div>
      </div>

      {entities.length === 0 ? (
        <StatsPlaceholder className="h-80">{t('stats.chart.noImpactData')}</StatsPlaceholder>
      ) : !primary ? (
        <StatsPlaceholder className="h-80">
          {t('stats.chart.selectEntity', { entity: entityLabel })}
        </StatsPlaceholder>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
            <PolarGrid stroke={CHART_GRID_STROKE} />
            <PolarAngleAxis dataKey="category" tick={CHART_SMALL_TICK} />
            <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} tickCount={5} />
            <Tooltip
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                if (!active || !row) return null;
                const lines = [
                  { entity: primary, raw: row.primaryRaw, ratio: row.primary, color: PROFILE_COLORS[0] },
                  ...(secondary && row.secondaryRaw !== undefined
                    ? [{ entity: secondary, raw: row.secondaryRaw, ratio: row.secondary ?? 0, color: PROFILE_COLORS[1] }]
                    : []),
                ];
                return (
                  <div className="rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-lg">
                    <p className="font-bold">{row.category}</p>
                    {lines.map((line) => (
                      <p key={line.entity.id} style={{ color: line.color }}>
                        {line.entity.nombre}:{' '}
                        <span className="font-mono font-semibold">
                          {formatImpactValue(line.raw, '0')}
                        </span>{' '}
                        {row.unit}{' '}
                        <span className="text-base-content/60">
                          ({t('stats.chart.percentOfMax', { value: formatNumber(line.ratio * 100) })})
                        </span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Radar
              name={primary.nombre}
              dataKey="primary"
              stroke={PROFILE_COLORS[0]}
              fill={PROFILE_COLORS[0]}
              fillOpacity={0.25}
              strokeWidth={2}
            />
            {secondary && (
              <Radar
                name={secondary.nombre}
                dataKey="secondary"
                stroke={PROFILE_COLORS[1]}
                fill={PROFILE_COLORS[1]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            )}
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
