import { useState } from 'react';
import { EF_CATEGORIES } from '../common/constants.ts';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';

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

const cellFmt = (v: number) => {
  if (v === 0) return '—';
  if (v < 0.001) return v.toExponential(2);
  if (v < 10) return v.toFixed(4);
  return v.toFixed(2);
};

export const StatsHeatmap = ({ ranking, onProvinceClick }: Props) => {
  const [sortCategory, setSortCategory] = useState<string | null>(null);

  if (ranking.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-base-content/50">
        No hay datos disponibles
      </div>
    );
  }

  const top15 = [...ranking]
    .sort((a, b) => b.impactoTotalMedio - a.impactoTotalMedio)
    .slice(0, 15);

  const sorted = sortCategory
    ? [...top15].sort(
        (a, b) =>
          (b.impactosPorCategoria[sortCategory] ?? 0) -
          (a.impactosPorCategoria[sortCategory] ?? 0),
      )
    : top15;

  const colMax: Record<string, number> = {};
  for (const cat of EF_CATEGORIES) {
    colMax[cat.id] = Math.max(
      ...sorted.map((p) => p.impactosPorCategoria[cat.id] ?? 0),
    );
  }

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: `72px repeat(${EF_CATEGORIES.length}, 1fr)` }}>
          <div className="font-semibold text-xs px-1 py-2 bg-base-200 flex items-end">
            Provincia
          </div>
          {EF_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="cursor-pointer px-1 py-2 bg-base-200 text-center flex items-end justify-center"
              style={{ color: cat.color }}
              onClick={() =>
                setSortCategory(sortCategory === cat.id ? null : cat.id)
              }
              title={`${cat.spanishName} (${cat.unit})`}
            >
              <div className="text-xs font-semibold leading-tight whitespace-normal">
                {cat.spanishName}
                {sortCategory === cat.id ? ' ▾' : ''}
              </div>
            </div>
          ))}

          {sorted.map((prov) => (
            <>
              <div
                key={`label-${prov.idProvincia}`}
                className="text-xs font-medium px-1 py-2 truncate cursor-pointer hover:underline bg-base-100 border-t border-base-200 flex items-center"
                onClick={() => onProvinceClick?.(prov.idProvincia)}
              >
                {prov.nombreProvincia}
              </div>
              {EF_CATEGORIES.map((cat) => {
                const value = prov.impactosPorCategoria[cat.id] ?? 0;
                const bg = cellColor(value, colMax[cat.id], cat.color);
                return (
                  <div
                    key={`${prov.idProvincia}-${cat.id}`}
                    className="text-center px-1 py-2 text-xs font-mono border-t border-base-200 flex items-center justify-center"
                    style={{ backgroundColor: bg }}
                    title={`${prov.nombreProvincia} · ${cat.spanishName}: ${cellFmt(value)} ${cat.unit}`}
                  >
                    {cellFmt(value)}
                  </div>
                );
              })}
            </>
          ))}
        </div>
    </div>
  );
};
