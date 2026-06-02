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
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card bg-base-100 shadow-lg p-3 text-sm">
      <p className="font-bold">{d.nombreProvincia}</p>
      <p>Producción: {formatNumber(d.produccionMedia, 2)} T/Ha</p>
      <p>Consumo H₂O: {formatNumber(d.consumoAguaMedio, 1)} L/Ha</p>
      <p>Superficie: {formatNumber(d.superficieTotal, 1)} Ha</p>
      <p>Eficiencia: {formatNumber(d.eficiencia, 4)}</p>
    </div>
  );
};

export const StatsScatterChart = ({ ranking }: Props) => {
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
          name="Consumo H₂O"
          unit=" L/Ha"
          tick={{ fontSize: 12 }}
          label={{
            value: 'Consumo H₂O (L/Ha)',
            position: 'bottom',
            offset: -5,
            style: { fontSize: 12 },
          }}
        />
        <YAxis
          type="number"
          dataKey="produccionMedia"
          name="Producción"
          unit=" T/Ha"
          tick={{ fontSize: 12 }}
          label={{
            value: 'Producción (T/Ha)',
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
