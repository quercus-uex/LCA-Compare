import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Text,
  Tooltip,
} from 'recharts';
import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { formatImpactValue, formatNumber } from '../common/format.ts';
import { ColorDot, EmptyState, TabPanel, Tabs } from '../components/ui/index.ts';
import { ChartTooltip } from './chart-tooltip.component.tsx';
import { SearchableLocationSelect } from './searchable-location-select.component.tsx';
import {
  CHART_GRID_STROKE,
  CHART_SMALL_TICK,
  PROFILE_COLORS,
} from './stats-chart-theme.ts';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

export type ProfileMode = 'province' | 'town';

export type ProfileEntity = {
  id: string;
  nombre: string;
  impactosPorCategoria: Record<EfCategoryId, number>;
};

type Props = {
  mode: ProfileMode;
  entities: ProfileEntity[];
  primary: ProfileEntity | null;
  secondary: ProfileEntity | null;
  onModeChange: (mode: ProfileMode) => void;
  onPrimaryChange: (entity: ProfileEntity | null) => void;
  onSecondaryChange: (entity: ProfileEntity | null) => void;
};

const MODES: ProfileMode[] = ['province', 'town'];

// En móvil el radar se encoge y las etiquetas se parten en líneas más cortas: si no,
// las de los lados se salen de la tarjeta. Los móviles más estrechos necesitan un
// radio aún menor, porque palabras como «Eutrofización» no se pueden partir
const radarRadius = (width: number) => (width < 340 ? '44%' : width < 480 ? '52%' : '72%');
const COMPACT_WIDTH = 480;

type ChartRow = {
  category: string;
  unit: string;
  primary: number;
  primaryRaw: number;
  secondary?: number;
  secondaryRaw?: number;
};

export const StatsSpiderChart = ({
  mode,
  entities,
  primary,
  secondary,
  onModeChange,
  onPrimaryChange,
  onSecondaryChange,
}: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const entityLabel = t(`stats.chart.${mode}`).toLowerCase();
  const tabsId = useId();
  const [chartWidth, setChartWidth] = useState(COMPACT_WIDTH);
  const compact = chartWidth < COMPACT_WIDTH;

  // Cada eje se normaliza respecto a la zona con mayor impacto en esa categoría
  const maxByCategory = Object.fromEntries(
    EF_CATEGORIES.map((cat) => [
      cat.id,
      Math.max(...entities.map((e) => e.impactosPorCategoria[cat.id] ?? 0), 0),
    ]),
  ) as Record<EfCategoryId, number>;
  const normalize = (catId: EfCategoryId, value: number) => {
    const max = maxByCategory[catId];
    return max > 0 ? Math.max(value / max, 0) : 0;
  };

  const chartData: ChartRow[] = primary
    ? EF_CATEGORIES.map((cat) => {
        const primaryRaw = primary.impactosPorCategoria[cat.id] ?? 0;
        const secondaryRaw = secondary?.impactosPorCategoria[cat.id];
        return {
          category: getCategoryLabel(cat.id),
          unit: cat.unit,
          primary: normalize(cat.id, primaryRaw),
          primaryRaw,
          ...(secondaryRaw !== undefined && {
            secondary: normalize(cat.id, secondaryRaw),
            secondaryRaw,
          }),
        };
      })
    : [];

  return (
    <div className="space-y-3">
      <Tabs
        id={tabsId}
        label={t('stats.sections.impactProfile')}
        size="sm"
        items={MODES.map((m) => ({ id: m, label: t(`stats.chart.${m}`) }))}
        value={mode}
        onChange={onModeChange}
      />

      <TabPanel tabsId={tabsId} value={mode} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2">
            <ColorDot color={PROFILE_COLORS[0]} />
            <SearchableLocationSelect<ProfileEntity>
              items={entities}
              value={primary}
              onChange={onPrimaryChange}
              getLabel={(e) => e.nombre}
              getId={(e) => e.id}
              placeholder={t('stats.chart.searchEntity', { entity: entityLabel })}
              emptyMessage={t('common.empty.noResults')}
            />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <ColorDot color={PROFILE_COLORS[1]} />
            <SearchableLocationSelect<ProfileEntity>
              items={entities.filter((e) => e.id !== primary?.id)}
              value={secondary}
              onChange={onSecondaryChange}
              getLabel={(e) => e.nombre}
              getId={(e) => e.id}
              placeholder={t('stats.chart.compareWith')}
              emptyMessage={t('common.empty.noResults')}
            />
          </div>
        </div>

        {entities.length === 0 ? (
          <EmptyState variant="inset" icon={false} description={t('stats.chart.noImpactData')} className="h-80" />
        ) : !primary ? (
          <EmptyState
            variant="inset"
            icon={false}
            description={t('stats.chart.selectEntity', { entity: entityLabel })}
            className="h-80"
          />
        ) : (
          <ResponsiveContainer width="100%" height={340} onResize={setChartWidth}>
            <RadarChart cx="50%" cy="50%" outerRadius={radarRadius(chartWidth)} data={chartData}>
              <PolarGrid stroke={CHART_GRID_STROKE} />
              <PolarAngleAxis
                dataKey="category"
                // `Text` parte la etiqueta en líneas que no pasan de `width`
                tick={(props: { payload: { value: string } }) => (
                  <Text {...props} {...CHART_SMALL_TICK} width={compact ? 76 : 130}>
                    {props.payload.value}
                  </Text>
                )}
              />
              <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} tickCount={5} />
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as ChartRow | undefined;
                  if (!active || !row) return null;
                  const lines = [
                    { entity: primary, raw: row.primaryRaw, ratio: row.primary, color: PROFILE_COLORS[0] },
                    ...(secondary && row.secondaryRaw !== undefined
                      ? [{ entity: secondary, raw: row.secondaryRaw, ratio: row.secondary ?? 0, color: PROFILE_COLORS[1] }]
                      : []),
                  ];
                  return (
                    <ChartTooltip title={row.category}>
                      {lines.map((line) => (
                        <p key={line.entity.id} className="flex items-center gap-1.5">
                          <ColorDot color={line.color} />
                          <span>
                            {line.entity.nombre}:{' '}
                            <span className="font-mono font-semibold">
                              {formatImpactValue(line.raw, '0')}
                            </span>{' '}
                            {row.unit}{' '}
                            <span className="text-muted">
                              ({t('stats.chart.percentOfMax', { value: formatNumber(line.ratio * 100) })})
                            </span>
                          </span>
                        </p>
                      ))}
                    </ChartTooltip>
                  );
                }}
              />
              <Radar
                name={primary.nombre}
                dataKey="primary"
                stroke={PROFILE_COLORS[0]}
                fill={PROFILE_COLORS[0]}
                fillOpacity={0.25}
                strokeWidth={2}
              />
              {secondary && (
                <Radar
                  name={secondary.nombre}
                  dataKey="secondary"
                  stroke={PROFILE_COLORS[1]}
                  fill={PROFILE_COLORS[1]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              )}
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </TabPanel>
    </div>
  );
};
