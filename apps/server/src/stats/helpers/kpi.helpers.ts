import { EF_CATEGORIES, type EfCategoryId } from 'common/impact';
import { STATS_MIN_PARCELAS, type KpiDto } from 'common/stats';
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
  const interanual = previousRows
    ? computeVariacionInteranual(rows, previousRows)
    : { variacion: null, parcelasComparables: null };

  return {
    totalParcelas: new Set(rows.map((r) => r.idParcela)).size,
    totalCultivos: rows.length,
    cultivosConImpacto: categorias.length,
    superficieTotal: round(rows.reduce((sum, r) => sum + r.superficie, 0)),
    impactosPorCategoria: meanCategories(categorias),
    variacionInteranual: interanual.variacion,
    parcelasComparables: interanual.parcelasComparables,
  };
}

/**
 * Compara solo las parcelas con resultado en ambos años: si se comparasen
 * todas, la variación mezclaría cambios reales con altas y bajas de
 * explotaciones. Con menos de `STATS_MIN_PARCELAS` parcelas comparables no se
 * calcula, igual que en los rankings.
 */
function computeVariacionInteranual(
  rows: StatsRow[],
  previousRows: StatsRow[],
): {
  variacion: Record<EfCategoryId, number | null> | null;
  parcelasComparables: number;
} {
  const conImpacto = (rs: StatsRow[]) => rs.filter((r) => r.categorias);
  const current = conImpacto(rows);
  const previous = conImpacto(previousRows);

  const parcelasAnteriores = new Set(previous.map((r) => r.idParcela));
  const comunes = new Set(
    current.map((r) => r.idParcela).filter((id) => parcelasAnteriores.has(id)),
  );
  if (comunes.size < STATS_MIN_PARCELAS) {
    return { variacion: null, parcelasComparables: comunes.size };
  }

  const registrosActuales = collectCategorias(
    current.filter((r) => comunes.has(r.idParcela)),
  );
  const actual = meanCategories(registrosActuales);
  const anterior = meanCategories(
    collectCategorias(previous.filter((r) => comunes.has(r.idParcela))),
  );

  const variacion = {} as Record<EfCategoryId, number | null>;
  for (const cat of EF_CATEGORIES) {
    const prev = anterior[cat.id];
    // Sin valores este año la media es 0, que no es una bajada del 100 %
    const sinValores = registrosActuales.every((r) => r[cat.id] === undefined);
    variacion[cat.id] =
      prev === 0 || sinValores
        ? null
        : round(((actual[cat.id] - prev) / Math.abs(prev)) * 100, 1);
  }
  return { variacion, parcelasComparables: comunes.size };
}
