import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { formatImpactValue } from '../common/format.ts';
import { ColorDot, EmptyState } from '../components/ui/index.ts';
import { PROFILE_COLORS } from './stats-chart-theme.ts';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

const MAX_ROWS = 15;

type Props = {
  ranking: ProvinciaRankingItemDto[];
  selectedCategory: EfCategoryId;
  highlightedIds: (string | undefined)[];
  onProvinceClick: (idProvincia: string) => void;
};

type Range = { min: number; max: number };

// Intensidad según la posición entre el mínimo y el máximo de la columna: con
// la escala desde 0, provincias con valores parecidos salían todas del mismo
// color. Se limita al 60 % para que el texto siga leyéndose
const cellColor = (value: number, { min, max }: Range, color: string) => {
  const ratio = max > min ? (value - min) / (max - min) : 0.5;
  const percent = Math.round((0.08 + ratio * 0.52) * 100);
  return `color-mix(in oklab, ${color} ${percent}%, transparent)`;
};

export const StatsHeatmap = ({
  ranking,
  selectedCategory,
  highlightedIds,
  onProvinceClick,
}: Props) => {
  const { t, i18n } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const [sortCategory, setSortCategory] = useState<EfCategoryId | null>(null);

  if (ranking.length === 0) {
    return <EmptyState variant="inset" icon={false} description={t('stats.chart.noImpactData')} className="h-72" />;
  }

  const byCategory = (categoria: EfCategoryId) =>
    (a: ProvinciaRankingItemDto, b: ProvinciaRankingItemDto) =>
      (b.impactosPorCategoria[categoria] ?? 0) - (a.impactosPorCategoria[categoria] ?? 0);

  // Las provincias con mayor impacto en la categoría seleccionada; la cabecera
  // de cada columna reordena solo esas filas
  const rows = [...ranking].sort(byCategory(selectedCategory)).slice(0, MAX_ROWS);
  if (sortCategory) rows.sort(byCategory(sortCategory));

  const colRange = Object.fromEntries(
    EF_CATEGORIES.map((cat) => {
      const values = rows.map((p) => p.impactosPorCategoria[cat.id] ?? 0);
      return [cat.id, { min: Math.min(...values), max: Math.max(...values) }];
    }),
  ) as Record<EfCategoryId, Range>;

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <table lang={i18n.language} className="w-full min-w-[56rem] table-fixed border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-28 bg-base-200 px-2 py-2 text-left font-semibold rounded-tl-field">
              {t('stats.chart.province')}
            </th>
            {EF_CATEGORIES.map((cat, index) => {
              const isSorted = sortCategory === cat.id;
              return (
                <th
                  key={cat.id}
                  scope="col"
                  aria-sort={isSorted ? 'descending' : 'none'}
                  className={`bg-base-200 p-0 align-bottom ${
                    index === EF_CATEGORIES.length - 1 ? 'rounded-tr-field' : ''
                  }`}
                >
                  <button
                    type="button"
                    title={`${getCategoryLabel(cat.id)} (${cat.unit})`}
                    className="flex h-full w-full items-end justify-center border-b-4 px-1 py-2 font-semibold leading-tight hover:underline"
                    style={{ borderBottomColor: cat.color }}
                    onClick={() => setSortCategory(isSorted ? null : cat.id)}
                  >
                    <span className="line-clamp-3 hyphens-auto break-words">
                      {getCategoryLabel(cat.id)}
                      {isSorted ? ' ▾' : ''}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((prov) => {
            const highlight = highlightedIds.indexOf(prov.idProvincia);
            return (
              <tr key={prov.idProvincia} className="group">
                <th scope="row" className="sticky left-0 z-10 border-t border-base-200 bg-base-100 p-0 text-left font-medium">
                  <button
                    type="button"
                    className="flex w-full items-center gap-1.5 truncate px-2 py-2 text-left group-hover:underline"
                    onClick={() => onProvinceClick(prov.idProvincia)}
                  >
                    {/* Sin resaltar, el hueco se mantiene para que los nombres queden alineados */}
                    <ColorDot size="sm" color={PROFILE_COLORS[highlight] ?? 'transparent'} />
                    <span className="truncate">{prov.nombreProvincia}</span>
                  </button>
                </th>
                {EF_CATEGORIES.map((cat) => {
                  const value = prov.impactosPorCategoria[cat.id] ?? 0;
                  return (
                    <td
                      key={cat.id}
                      className="truncate border-t border-base-200 px-1 py-2 text-center font-mono"
                      style={{ backgroundColor: cellColor(value, colRange[cat.id], cat.color) }}
                      title={`${prov.nombreProvincia} · ${getCategoryLabel(cat.id)}: ${formatImpactValue(value)} ${cat.unit}`}
                    >
                      {formatImpactValue(value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
