import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { EvolucionTemporalItemDto } from './stats.hook.tsx';

type Props = {
  data: EvolucionTemporalItemDto[];
};

const COLORS = {
  impactoFertilizantes: '#f59e0b',
  impactoManejoCultivo: '#3b82f6',
  impactoPesticidas: '#ef4444',
  impactoSistemaRiego: '#06b6d4',
  impactoTotal: '#6b7280',
};

export const StatsTimeline = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
        <XAxis
          dataKey="anio"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => v.toString()}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--b1))',
            border: '1px solid hsl(var(--bc) / 0.1)',
            borderRadius: '0.5rem',
          }}
        />
        <Legend />
        <Line
          name="Fertilizantes"
          type="monotone"
          dataKey="impactoFertilizantes"
          stroke={COLORS.impactoFertilizantes}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          name="Manejo Cultivo"
          type="monotone"
          dataKey="impactoManejoCultivo"
          stroke={COLORS.impactoManejoCultivo}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          name="Pesticidas"
          type="monotone"
          dataKey="impactoPesticidas"
          stroke={COLORS.impactoPesticidas}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          name="Sistema Riego"
          type="monotone"
          dataKey="impactoSistemaRiego"
          stroke={COLORS.impactoSistemaRiego}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          name="Impacto Total"
          type="monotone"
          dataKey="impactoTotal"
          stroke={COLORS.impactoTotal}
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
