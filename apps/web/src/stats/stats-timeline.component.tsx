import { useTranslation } from 'react-i18next';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getEfCategory, type EfCategoryId } from '../common/constants.ts';
import {
  CHART_GRID_STROKE,
  CHART_MUTED_FILL,
  CHART_REFERENCE_STROKE,
  CHART_SELECTED_FILL,
  CHART_TICK,
} from './stats-chart-theme.ts';
import { formatAxisValue, formatImpactValue } from './stats-formatters.ts';
import { StatsPlaceholder } from './stats-section.component.tsx';
import type { EvolucionTemporalItemDto } from './stats.hook.tsx';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  data: EvolucionTemporalItemDto[];
  selectedCategory: EfCategoryId;
  anio?: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: EvolucionTemporalItemDto }>;
  selectedCategory: EfCategoryId;
};

const TimelineTooltip = ({ active, payload, selectedCategory }: TooltipProps) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  const category = getEfCategory(selectedCategory);

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-lg">
      <p className="font-bold">{item.anio}</p>
      <p style={{ color: category?.color }}>
        {getCategoryLabel(selectedCategory)}:{' '}
        <span className="font-mono font-semibold">
          {formatImpactValue(item.categorias[selectedCategory] ?? 0, '0')}
        </span>{' '}
        {category?.unit}
      </p>
      <p className="text-base-content/70">
        {t('stats.chart.cropsCount', { count: item.numCultivos })}
      </p>
    </div>
  );
};

// Una sola categoría: las categorías tienen unidades distintas y no se apilan
export const StatsTimeline = ({ data, selectedCategory, anio }: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const category = getEfCategory(selectedCategory);

  if (data.length === 0) {
    return <StatsPlaceholder>{t('stats.chart.noTimelineData')}</StatsPlaceholder>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-4 text-xs text-base-content/70">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ backgroundColor: category?.color }} />
          {getCategoryLabel(selectedCategory)} ({category?.unit})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_MUTED_FILL }} />
          {t('stats.chart.sampleSize')}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis dataKey="anio" tick={CHART_TICK} />
          <YAxis
            yAxisId="impact"
            tick={CHART_TICK}
            width={72}
            tickFormatter={formatAxisValue}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            tick={CHART_TICK}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: CHART_MUTED_FILL }}
            content={<TimelineTooltip selectedCategory={selectedCategory} />}
          />
          {anio !== undefined && (
            <ReferenceLine
              yAxisId="impact"
              x={anio}
              stroke={CHART_REFERENCE_STROKE}
              strokeDasharray="4 4"
            />
          )}
          <Bar
            yAxisId="count"
            dataKey="numCultivos"
            fill={CHART_MUTED_FILL}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          >
            {data.map((item) => (
              <Cell
                key={item.anio}
                fill={item.anio === anio ? CHART_SELECTED_FILL : CHART_MUTED_FILL}
              />
            ))}
          </Bar>
          <Line
            yAxisId="impact"
            type="monotone"
            dataKey={(entry: EvolucionTemporalItemDto) =>
              entry.categorias[selectedCategory] ?? 0
            }
            stroke={category?.color}
            strokeWidth={3}
            dot={{ r: 4, fill: category?.color }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
