import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { colorAt } from './stats-colors.ts';
import {
  formatInteger,
  formatNumber,
  formatPercent,
} from './stats-formatters.ts';
import type { DistribucionCultivoItemDto } from './stats.hook.tsx';

type Props = {
  data: DistribucionCultivoItemDto[];
};

export const StatsCropDonut = ({ data }: Props) => {
  const { t } = useTranslation();
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="tipo"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={colorAt(idx)} />
          ))}
        </Pie>
        <Tooltip
          content={
            (({ active, payload }: Record<string, unknown>) => {
              if (
                !active ||
                !payload ||
                !Array.isArray(payload) ||
                !payload.length
              ) {
                return null;
              }
              const entry = payload[0] as Record<string, unknown>;
              const item = entry.payload as DistribucionCultivoItemDto;
              const value = (entry.value as number) || 0;
              const pct = total > 0 ? formatPercent((value / total) * 100) : '0%';
              return (
                <div className="card bg-base-100 shadow-lg p-3 text-sm">
                  <p className="font-bold">{item.tipo}</p>
                  <p>{t('stats.ranking.cropsCount', { count: formatInteger(value) })} ({pct})</p>
                  <p>{formatNumber(item.superficieTotal, 1)} Ha</p>
                </div>
              );
            }) as React.ComponentProps<typeof Tooltip>['content']
          }
          contentStyle={{
            backgroundColor: 'hsl(var(--b1))',
            border: '1px solid hsl(var(--bc) / 0.1)',
            borderRadius: '0.5rem',
          }}
        />
        <Legend
          formatter={(value: string) => {
            const item = data.find((d) => d.tipo === value);
            const pct =
              item && total > 0
                ? formatPercent((item.count / total) * 100, 0)
                : '0%';
            return `${value} (${pct})`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
