import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { SearchableLocationSelect } from './searchable-location-select.component.tsx';
import { CHART_TOOLTIP_STYLE } from './stats-colors.ts';
import { formatImpactValue } from './stats-formatters.ts';
import type {
  ProvinciaRankingItemDto,
  PoblacionRankingItemDto,
} from './stats.hook.tsx';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  ranking: ProvinciaRankingItemDto[];
  poblacionRanking: PoblacionRankingItemDto[];
};

type UnifiedEntity = {
  id: string;
  nombre: string;
  impactoTotalMedio: number;
  impactosPorCategoria: Record<EfCategoryId, number>;
};

const COLORS = ['#ef4444', '#3b82f6'];
const MODE_LABELS = ['province', 'town'] as const;
type Mode = (typeof MODE_LABELS)[number];

const toUnified = (
  p: ProvinciaRankingItemDto | PoblacionRankingItemDto,
  mode: Mode,
): UnifiedEntity => {
  if (mode === 'province') {
    const prov = p as ProvinciaRankingItemDto;
    return {
      id: prov.idProvincia,
      nombre: prov.nombreProvincia,
      impactoTotalMedio: prov.impactoTotalMedio,
      impactosPorCategoria: prov.impactosPorCategoria,
    };
  }
  const pobl = p as PoblacionRankingItemDto;
  return {
    id: pobl.idPoblacion,
    nombre: pobl.nombrePoblacion,
    impactoTotalMedio: pobl.impactoTotalMedio,
    impactosPorCategoria: pobl.impactosPorCategoria,
  };
};

export const StatsSpiderChart = ({ ranking, poblacionRanking }: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const [mode, setMode] = useState<Mode>('province');
  const [selected1, setSelected1] = useState<UnifiedEntity | null>(null);
  const [selected2, setSelected2] = useState<UnifiedEntity | null>(null);
  const [hasUserSelected, setHasUserSelected] = useState(false);

  const entities = useMemo(() => {
    const raw = mode === 'province' ? ranking : poblacionRanking;
    return raw
      .map((r) => toUnified(r, mode))
      .sort((a, b) => b.impactoTotalMedio - a.impactoTotalMedio);
  }, [ranking, poblacionRanking, mode]);

  const entity1 = useMemo(() => {
    if (hasUserSelected) {
      return (
        (selected1 && entities.some((e) => e.id === selected1.id)
          ? selected1
          : null)
      );
    }
    return entities[0] ?? null;
  }, [selected1, entities, hasUserSelected]);

  const entity2 = useMemo(() => {
    return (
      (selected2 && entities.some((e) => e.id === selected2.id)
        ? selected2
        : null)
    );
  }, [selected2, entities]);

  const handleSelect1 = (item: UnifiedEntity | null) => {
    setSelected1(item);
    setHasUserSelected(true);
  };

  const handleSelect2 = (item: UnifiedEntity | null) => {
    setSelected2(item);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSelected1(null);
    setSelected2(null);
    setHasUserSelected(false);
  };

  const maxByCategory = useMemo(() => {
    const maxes: Record<string, number> = {};
    for (const cat of EF_CATEGORIES) {
      maxes[cat.id] = Math.max(
        ...entities.map((p) => p.impactosPorCategoria[cat.id] ?? 0),
      );
    }
    return maxes;
  }, [entities]);

  const normalize = (catId: string, value: number) => {
    const max = maxByCategory[catId] ?? 0;
    return max > 0 ? value / max : 0;
  };

  if (entities.length === 0) {
    return (
        <div className="flex items-center justify-center h-80 text-base-content/50">
        {t('stats.chart.noImpactData')}
      </div>
    );
  }

  if (!entity1) {
    return (
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="join">
            {MODE_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                className={`btn btn-xs join-item ${
                  mode === label ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() => handleModeChange(label)}
              >
                {t(`stats.chart.${label}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-start">
          <SearchableLocationSelect<UnifiedEntity>
            items={entities}
            value={null}
            onChange={handleSelect1}
            getLabel={(e) => e.nombre}
            getId={(e) => e.id}
            placeholder={t('stats.chart.searchEntity', { entity: t(`stats.chart.${mode}`).toLowerCase() })}
            emptyMessage={t('common.empty.noResults')}
          />
        </div>
        <div className="flex items-center justify-center h-60 text-base-content/50">
          {t('stats.chart.selectEntity', { entity: t(`stats.chart.${mode}`).toLowerCase() })}
        </div>
      </div>
    );
  }

  const chartData = EF_CATEGORIES.map((cat) => {
    const raw1 = entity1.impactosPorCategoria[cat.id] ?? 0;
    const entry: Record<string, unknown> = {
      category: getCategoryLabel(cat.id),
      prov1: normalize(cat.id, raw1),
      prov1_raw: raw1,
    };
    if (entity2) {
      const raw2 = entity2.impactosPorCategoria[cat.id] ?? 0;
      entry.prov2 = normalize(cat.id, raw2);
      entry.prov2_raw = raw2;
    }
    return entry;
  });

  const comparisonItems = entities.filter((e) => e.id !== entity1.id);

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div className="join">
          {MODE_LABELS.map((label) => (
            <button
              key={label}
              type="button"
              className={`btn btn-xs join-item ${
                mode === label ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => handleModeChange(label)}
            >
              {t(`stats.chart.${label}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 items-start">
        <SearchableLocationSelect<UnifiedEntity>
          items={entities}
          value={entity1}
          onChange={handleSelect1}
          getLabel={(e) => e.nombre}
          getId={(e) => e.id}
          placeholder={t('stats.chart.searchEntity', { entity: t(`stats.chart.${mode}`).toLowerCase() })}
          emptyMessage={t('common.empty.noResults')}
        />
        <SearchableLocationSelect<UnifiedEntity>
          items={comparisonItems}
          value={entity2}
          onChange={handleSelect2}
          getLabel={(e) => e.nombre}
          getId={(e) => e.id}
          placeholder={t('stats.chart.compareWith')}
          emptyMessage={t('common.empty.noResults')}
        />
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="75%"
          data={chartData}
        >
          <PolarGrid stroke="hsl(var(--bc) / 0.2)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 10, fill: 'hsl(var(--bc))' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: 'hsl(var(--bc) / 0.5)' }}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(_value, _name, entry) => {
              const dk = entry?.dataKey as string | undefined;
              const rawKey = dk === 'prov1' ? 'prov1_raw' : 'prov2_raw';
              const payload = entry?.payload as Record<string, unknown> | undefined;
              const rawVal = payload?.[rawKey] as number | undefined;
              return [
                rawVal !== undefined ? formatImpactValue(rawVal, '0') : '—',
                dk === 'prov1'
                  ? entity1.nombre
                  : entity2?.nombre ?? '',
              ];
            }}
          />
          <Radar
            name={entity1.nombre}
            dataKey="prov1"
            stroke={COLORS[0]}
            fill={COLORS[0]}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          {entity2 && (
            <Radar
              key={`comp-${entity2.id}`}
              name={entity2.nombre}
              dataKey="prov2"
              stroke={COLORS[1]}
              fill={COLORS[1]}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          )}
          <Legend wrapperStyle={{ fontSize: '12px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
