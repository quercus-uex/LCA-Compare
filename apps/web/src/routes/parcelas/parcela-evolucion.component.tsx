import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DEFAULT_EF_CATEGORY, EF_CATEGORIES, type EfCategoryId } from '../../common/constants.ts';
import { formatAxisValue, formatCampaignDate, formatCampaignMonth, formatImpactValue, formatQuantity } from '../../common/format.ts';
import type { CultivoConImpacto } from '../../hooks/parcela.hook.tsx';
import { useCropTypeLabel } from '../../hooks/use-crop-type-label.ts';
import { CHART_GRID_STROKE, CHART_TICK } from '../../stats/stats-chart-theme.ts';
import { useTranslatedEfCategories } from '../../stats/use-translated-ef-categories.ts';

type CropMetric = 'produccion' | 'rendimiento' | 'consumoAgua';
type Metric = CropMetric | EfCategoryId;

type Point = { fecha: string; tipo: string; value: number | null };

const CROP_METRICS: Array<{ id: CropMetric; labelKey: string; unitKey: string }> = [
  { id: 'produccion', labelKey: 'common.fields.production', unitKey: 'common.units.kilograms' },
  { id: 'rendimiento', labelKey: 'parcelas.detail.yield', unitKey: 'common.units.kilogramsPerHectare' },
  { id: 'consumoAgua', labelKey: 'common.fields.waterConsumption', unitKey: 'common.units.cubicMeters' },
];

const CROP_METRIC_COLOR = '#0f766e';

const cropMetricValue = (c: CultivoConImpacto, metric: CropMetric): number | null => {
  if (metric === 'rendimiento') return c.superficieCultivada > 0 ? c.produccion / c.superficieCultivada : null;
  return c[metric];
};

const isCropMetric = (metric: Metric): metric is CropMetric => CROP_METRICS.some((m) => m.id === metric);

/** Evolución de un indicador a lo largo de las campañas de la parcela */
export const ParcelaEvolucion = ({ cultivos }: { cultivos: CultivoConImpacto[] }) => {
  const { t } = useTranslation();
  const getCropTypeLabel = useCropTypeLabel();
  const { getCategoryLabel } = useTranslatedEfCategories();

  // Solo se ofrecen las categorías que trae algún resultado de la parcela
  const categories = useMemo(
    () => EF_CATEGORIES.filter((cat) => cultivos.some((c) => c.impactoTotal?.[cat.id] !== undefined)),
    [cultivos],
  );
  const [metric, setMetric] = useState<Metric>(
    categories.some((c) => c.id === DEFAULT_EF_CATEGORY) ? DEFAULT_EF_CATEGORY : 'produccion',
  );

  const cropMetric = CROP_METRICS.find((m) => m.id === metric);
  const category = categories.find((c) => c.id === metric);
  const unit = cropMetric ? t(cropMetric.unitKey) : category?.unit ?? '';
  const color = category?.color ?? CROP_METRIC_COLOR;
  const formatValue = (v: number) => (isCropMetric(metric) ? formatQuantity(v) : formatImpactValue(v, '0'));

  // De la más antigua a la más reciente
  const data: Point[] = [...cultivos].reverse().map((c) => ({
    fecha: c.fechaInicioCampania,
    tipo: c.tipo,
    value: isCropMetric(metric) ? cropMetricValue(c, metric) : c.impactoTotal?.[metric] ?? null,
  }));

  return (
    <section className="card bg-base-100 shadow-sm" aria-labelledby="evolucion-title">
      <div className="card-body gap-3 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="evolucion-title" className="card-title">{t('parcelas.detail.evolution')}</h2>
          <select
            className="select select-sm w-full sm:w-auto"
            aria-label={t('parcelas.detail.metric')}
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
          >
            <optgroup label={t('parcelas.detail.cropData')}>
              {CROP_METRICS.map((m) => <option key={m.id} value={m.id}>{t(m.labelKey)}</option>)}
            </optgroup>
            {categories.length > 0 && (
              <optgroup label={t('parcelas.detail.impactTotal')}>
                {categories.map((c) => <option key={c.id} value={c.id}>{getCategoryLabel(c.id)}</option>)}
              </optgroup>
            )}
          </select>
        </header>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="fecha" tick={CHART_TICK} tickFormatter={formatCampaignMonth} />
            <YAxis
              tick={CHART_TICK}
              width={72}
              tickFormatter={formatAxisValue}
              label={{ value: unit, angle: -90, position: 'insideLeft', style: CHART_TICK }}
            />
            <Tooltip
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as Point | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-lg">
                    <p className="font-bold">{formatCampaignDate(point.fecha)}</p>
                    <p className="text-base-content/70">{getCropTypeLabel(point.tipo)}</p>
                    <p style={{ color }}>
                      <span className="font-mono font-semibold">
                        {point.value === null ? '—' : formatValue(point.value)}
                      </span>{' '}
                      {unit}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 4, fill: color }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
