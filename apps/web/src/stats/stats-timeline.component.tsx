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
import { EF_CATEGORIES } from '../common/constants.ts';
import type { EvolucionTemporalItemDto } from './stats.hook.tsx';
import { formatImpactValue } from './stats-formatters.ts';
import { useTranslation } from 'react-i18next';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  data: EvolucionTemporalItemDto[];
};

export const StatsTimeline = ({ data }: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();

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
            tickFormatter={(v) => v.toString()}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.21 0.006 285.885)',
              border: '1px solid oklch(0.3 0.01 285.885)',
              borderRadius: '0.5rem',
              fontSize: '12px',
              color: 'oklch(0.9 0.01 285.885)',
            }}
            formatter={(value, name) => {
              const v = typeof value === 'number' ? value : 0;
              const n = String(name);
              const cat = EF_CATEGORIES.find((c) => c.id === n);
              return [
                formatImpactValue(v, '0'),
                cat ? `${getCategoryLabel(cat.id)} (${cat.unit})` : n,
              ];
            }}
          />
          {EF_CATEGORIES.map((cat) => (
            <Area
              key={cat.id}
              dataKey={(entry: EvolucionTemporalItemDto) =>
                entry.categorias[cat.id] ?? 0
              }
              name={getCategoryLabel(cat.id)}
              stackId="1"
              stroke={cat.color}
              fill={cat.color}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                      data[data.length - 1].categorias[cat.id] ?? 0,
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
