import { EF_CATEGORIES, type EfCategoryId } from 'common/impact';
import type { CategoryValues, KpiDto } from 'common/stats';
import { meanCategories, round } from './stats-aggregation.helpers';
import { collectCategorias, type StatsRow } from './stats-rows.helpers';

/**
 * `previousRows` son los cultivos del año anterior con los mismos filtros, o
 * `null` si no hay año seleccionado.
 */
export function computeKpis(
  rows: StatsRow[],
  previousRows: StatsRow[] | null,
): KpiDto {
  const categorias = collectCategorias(rows);
  const impactosPorCategoria = meanCategories(categorias);

  return {
    totalParcelas: new Set(rows.map((r) => r.idParcela)).size,
    totalCultivos: rows.length,
    cultivosConImpacto: categorias.length,
    superficieTotal: round(rows.reduce((sum, r) => sum + r.superficie, 0)),
    impactosPorCategoria,
    variacionInteranual:
      previousRows && categorias.length > 0
        ? computeVariacionInteranual(impactosPorCategoria, previousRows)
        : null,
  };
}

function computeVariacionInteranual(
  current: CategoryValues,
  previousRows: StatsRow[],
): Record<EfCategoryId, number | null> | null {
  const previousCategorias = collectCategorias(previousRows);
  if (previousCategorias.length === 0) return null;

  const previous = meanCategories(previousCategorias);
  const variacion = {} as Record<EfCategoryId, number | null>;
  for (const cat of EF_CATEGORIES) {
    const prev = previous[cat.id];
    variacion[cat.id] =
      prev === 0
        ? null
        : round(((current[cat.id] - prev) / Math.abs(prev)) * 100, 1);
  }
  return variacion;
}
