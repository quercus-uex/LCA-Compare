import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';

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
      <p>Superficie: {d.superficieTotal.toFixed(1)} Ha</p>
      <p>Impacto medio: {d.impactoTotalMedio.toFixed(2)}</p>
      <p>Cultivos: {d.numCultivos}</p>
    </div>
  );
};

export const StatsImpactScatterChart = ({ ranking }: Props) => {
  const maxCultivos = Math.max(...ranking.map((r) => r.numCultivos), 1);

  const data = ranking.map((r) => ({
    ...r,
    z: Math.max((r.numCultivos / maxCultivos) * 200, 20),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
        <XAxis
          type="number"
          dataKey="superficieTotal"
          name="Superficie"
          unit=" Ha"
          tick={{ fontSize: 12 }}
          label={{
            value: 'Superficie Cultivada (Ha)',
            position: 'bottom',
            offset: -5,
            style: { fontSize: 12 },
          }}
        />
        <YAxis
          type="number"
          dataKey="impactoTotalMedio"
          name="Impacto Total"
          tick={{ fontSize: 12 }}
          label={{
            value: 'Impacto Total Medio',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 12 },
          }}
        />
        <ZAxis type="number" dataKey="z" range={[20, 200]} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={data} fill="#ef4444" opacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};
