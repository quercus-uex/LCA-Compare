import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { useCropTypeLabel } from '../hooks/use-crop-type-label.ts';
import {
  CHART_AXIS_LABEL_STYLE,
  CHART_GRID_STROKE,
  CHART_POINT_LABEL_STYLE,
  CHART_REFERENCE_STROKE,
  CHART_TICK,
  colorAt,
} from './stats-chart-theme.ts';
import { formatInteger, formatNumber } from './stats-formatters.ts';
import { StatsPlaceholder } from './stats-section.component.tsx';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';

type Props = {
  ranking: ProvinciaRankingItemDto[];
  tipoCultivo?: string;
  tiposCultivo: string[];
  onSelectCrop: (tipo: string) => void;
};

type Point = ProvinciaRankingItemDto & {
  rendimiento: number;
  dotacionAgua: number;
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
};

const WaterTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
}) => {
  const { t } = useTranslation();
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-lg">
      <p className="font-bold">{d.nombreProvincia}</p>
      <p>{t('stats.chart.yield')}: {formatInteger(d.rendimiento)} kg/ha</p>
      <p>{t('stats.chart.waterUse')}: {formatInteger(d.dotacionAgua)} m³/ha</p>
      {d.productividadAgua !== null && (
        <p className="font-semibold">
          {t('stats.chart.waterProductivity')}: {formatNumber(d.productividadAgua, 2)} kg/m³
        </p>
      )}
      <p className="text-base-content/60">
        {t('stats.chart.area')}: {formatNumber(d.superficieTotal, 1)} ha
      </p>
    </div>
  );
};

export const StatsWaterChart = ({
  ranking,
  tipoCultivo,
  tiposCultivo,
  onSelectCrop,
}: Props) => {
  const { t } = useTranslation();
  const getCropTypeLabel = useCropTypeLabel();

  // El rendimiento de cultivos distintos no es comparable entre sí
  if (!tipoCultivo) {
    return (
      <StatsPlaceholder>
        <span>{t('stats.chart.selectCropForWater')}</span>
        <div className="flex flex-wrap justify-center gap-2">
          {tiposCultivo.map((tipo) => (
            <button
              key={tipo}
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => onSelectCrop(tipo)}
            >
              {getCropTypeLabel(tipo)}
            </button>
          ))}
        </div>
      </StatsPlaceholder>
    );
  }

  const points: Point[] = ranking.flatMap((r) =>
    r.rendimiento !== null && r.dotacionAgua !== null
      ? [{ ...r, rendimiento: r.rendimiento, dotacionAgua: r.dotacionAgua }]
      : [],
  );

  if (points.length === 0) {
    return <StatsPlaceholder>{t('stats.chart.noWaterData')}</StatsPlaceholder>;
  }

  const color = colorAt(Math.max(tiposCultivo.indexOf(tipoCultivo), 0));

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
          <XAxis
            type="number"
            dataKey="dotacionAgua"
            name={t('stats.chart.waterUse')}
            tick={CHART_TICK}
            tickFormatter={(v: number) => formatInteger(v)}
            domain={['auto', 'auto']}
            padding={{ left: 24, right: 24 }}
            label={{
              value: t('stats.chart.waterUseAxis'),
              position: 'bottom',
              offset: 0,
              style: CHART_AXIS_LABEL_STYLE,
            }}
          />
          <YAxis
            type="number"
            dataKey="rendimiento"
            name={t('stats.chart.yield')}
            tick={CHART_TICK}
            tickFormatter={(v: number) => formatInteger(v)}
            domain={['auto', 'auto']}
            padding={{ top: 24, bottom: 24 }}
            width={80}
            label={{
              value: t('stats.chart.yieldAxis'),
              angle: -90,
              position: 'insideLeft',
              style: { ...CHART_AXIS_LABEL_STYLE, textAnchor: 'middle' },
            }}
          />
          <ZAxis type="number" dataKey="superficieTotal" range={[60, 400]} />
          <ReferenceLine
            x={median(points.map((p) => p.dotacionAgua))}
            stroke={CHART_REFERENCE_STROKE}
            strokeDasharray="4 4"
          />
          <ReferenceLine
            y={median(points.map((p) => p.rendimiento))}
            stroke={CHART_REFERENCE_STROKE}
            strokeDasharray="4 4"
          />
          <Tooltip content={<WaterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={points} fill={color} fillOpacity={0.7} stroke={color}>
            <LabelList dataKey="nombreProvincia" position="top" offset={10} style={CHART_POINT_LABEL_STYLE} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-base-content/60">{t('stats.chart.quadrantHint')}</p>
    </div>
  );
};
