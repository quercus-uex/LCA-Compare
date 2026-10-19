import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { EF_CATEGORIES, getEfCategory, type EfCategoryId } from '../common/constants.ts';
import { CHART_TOOLTIP_STYLE } from './stats-colors.ts';
import { formatImpactValue } from './stats-formatters.ts';
import type { EvolucionTemporalItemDto } from './stats.hook.tsx';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  data: EvolucionTemporalItemDto[];
  selectedCategory: EfCategoryId;
};

export const StatsTimeline = ({ data, selectedCategory }: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  // Una sola categoría en el gráfico principal: las categorías tienen unidades
  // distintas y no se apilan ni se suman
  const selected = getEfCategory(selectedCategory);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-base-content/50">
        {t('stats.chart.noTimelineData')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--bc) / 0.1)"
          />
          <XAxis
            dataKey="anio"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => v.toString()}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => formatImpactValue(v, '0')}
            label={{
              value: selected?.unit ?? '',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => {
              const v = typeof value === 'number' ? value : 0;
              return [
                formatImpactValue(v, '0'),
                `${getCategoryLabel(selectedCategory)} (${selected?.unit ?? ''})`,
              ];
            }}
          />
          <Area
            dataKey={(entry: EvolucionTemporalItemDto) =>
              entry.categorias[selectedCategory] ?? 0
            }
            name={getCategoryLabel(selectedCategory)}
            stroke={selected?.color}
            fill={selected?.color}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {EF_CATEGORIES.map((cat) => (
          <div key={cat.id} className="card bg-base-100 shadow-sm">
            <div className="card-body p-2">
              <div
                className="text-[11px] font-semibold truncate"
                style={{ color: cat.color }}
              >
                {getCategoryLabel(cat.id)}
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={data}>
                  <Line
                    type="monotone"
                    dataKey={(entry: EvolucionTemporalItemDto) =>
                      entry.categorias[cat.id] ?? 0
                    }
                    stroke={cat.color}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-[10px] text-base-content/50 text-right">
                {data.length > 0
                  ? formatImpactValue(
                      data[data.length - 1]?.categorias[cat.id] ?? 0,
                      '0',
                    )
                  : '—'}{' '}
                {cat.unit.split(' ')[0]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
