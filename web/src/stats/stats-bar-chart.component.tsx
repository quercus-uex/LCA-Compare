import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
  payload?: Array<{ payload: ProvinciaRankingItemDto }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card bg-base-100 shadow-lg p-3 text-sm">
      <p className="font-bold">{d.nombreProvincia}</p>
      <p>Impacto: {d.impactoTotalMedio.toFixed(2)}</p>
      <p>Parcelas: {d.numParcelas}</p>
      <p>Cultivos: {d.numCultivos}</p>
    </div>
  );
};

export const StatsBarChart = ({ ranking }: Props) => {
  const data = [...ranking]
    .sort((a, b) => a.impactoTotalMedio - b.impactoTotalMedio)
    .map((r) => ({
      ...r,
      nombre: r.nombreProvincia.slice(0, 20),
    }));

  const min = data[0]?.impactoTotalMedio ?? 0;
  const max = data[data.length - 1]?.impactoTotalMedio ?? 1;
  const range = max - min || 1;

  const getColor = (value: number) => {
    const ratio = (value - min) / range;
    const hue = 120 - ratio * 120;
    return `hsl(${hue}, 70%, 45%)`;
  };

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 28, 300)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          dataKey="nombre"
          type="category"
          tick={{ fontSize: 11 }}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="impactoTotalMedio" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.idProvincia} fill={getColor(entry.impactoTotalMedio)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
