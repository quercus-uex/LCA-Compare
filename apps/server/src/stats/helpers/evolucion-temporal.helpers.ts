import type { CategoryValues, EvolucionTemporalItemDto } from 'common/stats';
import { meanCategories } from './stats-aggregation.helpers';
import type { StatsRow } from './stats-rows.helpers';

export function aggregateEvolucionByYear(
  rows: StatsRow[],
): EvolucionTemporalItemDto[] {
  const byYear = new Map<
    number,
    { numCultivos: number; categorias: CategoryValues[] }
  >();

  for (const r of rows) {
    const entry = byYear.get(r.anio) ?? { numCultivos: 0, categorias: [] };
    entry.numCultivos += 1;
    if (r.categorias) entry.categorias.push(r.categorias);
    byYear.set(r.anio, entry);
  }

  // Los años sin ningún resultado de impacto no aportan punto a la serie
  return [...byYear]
    .filter(([, entry]) => entry.categorias.length > 0)
    .map(([anio, entry]) => ({
      anio,
      numCultivos: entry.numCultivos,
      categorias: meanCategories(entry.categorias),
    }))
    .sort((a, b) => a.anio - b.anio);
}
