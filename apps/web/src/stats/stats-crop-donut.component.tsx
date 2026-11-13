import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber, formatPercent } from '../common/format.ts';
import { ColorDot, EmptyState } from '../components/ui/index.ts';
import { getCropTypeStyle, useCropTypeLabel } from '../hooks/use-crop-type-label.ts';
import { ChartTooltip } from './chart-tooltip.component.tsx';
import type { DistribucionCultivoItemDto } from './stats.hook.tsx';

type Props = {
  data: DistribucionCultivoItemDto[];
  selected?: string;
  onSelect: (tipo: string | undefined) => void;
};

export const StatsCropDonut = ({ data, selected, onSelect }: Props) => {
  const { t } = useTranslation();
  const getCropTypeLabel = useCropTypeLabel();
  const total = data.reduce((sum, d) => sum + d.count, 0);
  // Mismo color por cultivo que en las vistas de parcelas
  const colorOf = (tipo: string) => getCropTypeStyle(tipo).color;
  const toggle = (tipo: string) => onSelect(selected === tipo ? undefined : tipo);

  if (data.length === 0) {
    return <EmptyState variant="inset" icon={false} description={t('stats.noData')} className="h-72" />;
  }

  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="tipo"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              className="cursor-pointer"
              onClick={(_, index) => {
                const tipo = data[index]?.tipo;
                if (tipo) toggle(tipo);
              }}
            >
              {data.map((d) => (
                <Cell
                  key={d.tipo}
                  fill={colorOf(d.tipo)}
                  fillOpacity={!selected || selected === d.tipo ? 1 : 0.25}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const item = payload?.[0]?.payload as DistribucionCultivoItemDto | undefined;
                if (!active || !item) return null;
                return (
                  <ChartTooltip title={getCropTypeLabel(item.tipo)}>
                    <p>
                      {t('stats.chart.cropsCount', { count: item.count })} (
                      {formatPercent(total > 0 ? (item.count / total) * 100 : 0)})
                    </p>
                    <p>{formatNumber(item.superficieTotal, 1)} ha</p>
                  </ChartTooltip>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{formatNumber(total)}</span>
          <span className="text-xs text-muted">{t('stats.kpis.crops')}</span>
        </div>
      </div>

      <ul className="space-y-1">
        {data.map((d) => {
          const isSelected = selected === d.tipo;
          return (
            <li key={d.tipo}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(d.tipo)}
                className={`flex w-full items-center gap-2 rounded-field px-2 py-1.5 text-left text-sm transition hover:bg-base-200 ${
                  isSelected ? 'bg-base-200 font-semibold' : ''
                }`}
              >
                {/* Se atenúa solo el color: el texto debe seguir cumpliendo el contraste */}
                <ColorDot color={colorOf(d.tipo)} className={`transition ${selected && !isSelected ? 'opacity-30' : ''}`} />
                <span className="min-w-0 flex-1 truncate">{getCropTypeLabel(d.tipo)}</span>
                <span className="font-mono text-xs text-muted">
                  {formatPercent(total > 0 ? (d.count / total) * 100 : 0, 0)}
                </span>
                <span className="w-20 text-right font-mono text-xs text-muted">
                  {formatNumber(d.superficieTotal, 1)} ha
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
