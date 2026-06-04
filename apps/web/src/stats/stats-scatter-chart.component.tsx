import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
} from 'recharts';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';
import { formatNumber } from './stats-formatters.ts';
import { useTranslation } from 'react-i18next';

type Props = {
  ranking: ProvinciaRankingItemDto[];
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ProvinciaRankingItemDto & { z: number } }>;
}) => {
  const { t } = useTranslation();

  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card bg-base-100 shadow-lg p-3 text-sm">
      <p className="font-bold">{d.nombreProvincia}</p>
      <p>{t('common.fields.production')}: {formatNumber(d.produccionMedia, 2)} T/Ha</p>
      <p>{t('stats.chart.h2oConsumption')}: {formatNumber(d.consumoAguaMedio, 1)} L/Ha</p>
      <p>{t('stats.kpis.area')}: {formatNumber(d.superficieTotal, 1)} Ha</p>
      <p>{t('stats.chart.efficiency')}: {formatNumber(d.eficiencia, 4)}</p>
    </div>
  );
};

export const StatsScatterChart = ({ ranking }: Props) => {
  const { t } = useTranslation();
  const consumoValues = ranking.map((r) => r.consumoAguaMedio).sort((a, b) => a - b);
  const prodValues = ranking.map((r) => r.produccionMedia).sort((a, b) => a - b);
  const medianConsumo = consumoValues[Math.floor(consumoValues.length / 2)] ?? 0;
  const medianProd = prodValues[Math.floor(prodValues.length / 2)] ?? 0;

  const maxZ = Math.max(...ranking.map((r) => r.superficieTotal), 1);

  const data = ranking.map((r) => ({
    ...r,
    z: Math.max((r.superficieTotal / maxZ) * 200, 20),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
        <XAxis
          type="number"
          dataKey="consumoAguaMedio"
          name={t('stats.chart.h2oConsumption')}
          unit=" L/Ha"
          tick={{ fontSize: 12 }}
          label={{
            value: t('stats.chart.h2oConsumptionAxis'),
            position: 'bottom',
            offset: -5,
            style: { fontSize: 12 },
          }}
        />
        <YAxis
          type="number"
          dataKey="produccionMedia"
          name={t('common.fields.production')}
          unit=" T/Ha"
          tick={{ fontSize: 12 }}
          label={{
            value: t('stats.chart.productionAxis'),
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 12 },
          }}
        />
        <ZAxis type="number" dataKey="z" range={[20, 200]} />
        <ReferenceLine
          x={medianConsumo}
          stroke="hsl(var(--bc) / 0.2)"
          strokeDasharray="3 3"
        />
        <ReferenceLine
          y={medianProd}
          stroke="hsl(var(--bc) / 0.2)"
          strokeDasharray="3 3"
        />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={data} fill="#3b82f6" opacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};
