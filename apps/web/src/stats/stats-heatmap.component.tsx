import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { formatImpactValue } from './stats-formatters.ts';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  ranking: ProvinciaRankingItemDto[];
  onProvinceClick?: (provinceId: string) => void;
};

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const cellColor = (value: number, max: number, hex: string) => {
  if (max === 0) return undefined;
  const ratio = value / max;
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.max(0.06, ratio * 0.75)})`;
};

export const StatsHeatmap = ({ ranking, onProvinceClick }: Props) => {
  const [sortCategory, setSortCategory] = useState<string | null>(null);
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();

  if (ranking.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-base-content/50">
        {t('stats.noData')}
      </div>
    );
  }

  const top15 = [...ranking]
    .sort((a, b) => b.impactoTotalMedio - a.impactoTotalMedio)
    .slice(0, 15);

  const sorted = sortCategory
    ? [...top15].sort(
        (a, b) =>
          (b.impactosPorCategoria[sortCategory as EfCategoryId] ?? 0) -
          (a.impactosPorCategoria[sortCategory as EfCategoryId] ?? 0),
      )
    : top15;

  const colMax: Record<string, number> = {};
  for (const cat of EF_CATEGORIES) {
    colMax[cat.id] = Math.max(
      ...sorted.map((p) => p.impactosPorCategoria[cat.id] ?? 0),
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div
        className="grid w-full min-w-0"
        style={{
          gridTemplateColumns: `72px repeat(${EF_CATEGORIES.length}, minmax(0, 1fr))`,
        }}
      >
          <div className="font-semibold text-xs px-1 py-2 bg-base-200 flex items-end">
            {t('stats.chart.province')}
          </div>
          {EF_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer min-w-0 px-1 py-2 bg-base-200 text-center flex items-end justify-center"
              style={{ color: cat.color }}
              onClick={() =>
                setSortCategory(sortCategory === cat.id ? null : cat.id)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSortCategory(sortCategory === cat.id ? null : cat.id);
                }
              }}
              title={`${getCategoryLabel(cat.id)} (${cat.unit})`}
            >
              <div
                className="text-[10px] xl:text-xs font-semibold leading-tight w-full overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {getCategoryLabel(cat.id)}
                {sortCategory === cat.id ? ' ▾' : ''}
              </div>
            </div>
          ))}

          {sorted.map((prov) => (
            <Fragment key={prov.idProvincia}>
              <div
                role={onProvinceClick ? 'button' : undefined}
                tabIndex={onProvinceClick ? 0 : undefined}
                className="text-xs font-medium px-1 py-2 truncate cursor-pointer hover:underline bg-base-100 border-t border-base-200 flex items-center"
                onClick={() => onProvinceClick?.(prov.idProvincia)}
                onKeyDown={onProvinceClick ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onProvinceClick(prov.idProvincia);
                  }
                } : undefined}
              >
                {prov.nombreProvincia}
              </div>
              {EF_CATEGORIES.map((cat) => {
                const value = prov.impactosPorCategoria[cat.id] ?? 0;
                const bg = cellColor(value, colMax[cat.id] ?? 0, cat.color);
                return (
                  <div
                    key={`${prov.idProvincia}-${cat.id}`}
                    className="min-w-0 text-center px-1 py-2 text-[10px] xl:text-xs font-mono border-t border-base-200 flex items-center justify-center truncate"
                    style={{ backgroundColor: bg }}
                    title={`${prov.nombreProvincia} - ${getCategoryLabel(cat.id)}: ${formatImpactValue(value)} ${cat.unit}`}
                  >
                    <span className="truncate">{formatImpactValue(value)}</span>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
    </div>
  );
};
