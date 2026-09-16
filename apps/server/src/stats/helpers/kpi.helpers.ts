import {
  meanCategories,
  round,
  type CategoryAmountRecord,
} from '../stats-aggregation.helpers';
import type { KpiDto } from '../dto/global-stats.dto';
import type { CultivoWithGeo } from './stats.types';

export type KpiSummary = Pick<
  KpiDto,
  'totalParcelas' | 'totalCultivos' | 'superficieTotal' | 'impactosPorCategoria'
>;

export function computeKpiSummary(
  cultivos: CultivoWithGeo[],
  categoryMap: Map<string, CategoryAmountRecord>,
): KpiSummary {
  const totalCultivos = cultivos.length;
  const parcelaIds = [...new Set(cultivos.map((c) => c.idParcela))];
  const totalParcelas = parcelaIds.length;

  const superficieTotal = cultivos.reduce(
    (sum, c) => sum + (c.superficieCultivada ?? 0),
    0,
  );

  const categoryRecords: CategoryAmountRecord[] = [];
  for (const c of cultivos) {
    if (c.idResultadoImpacto && categoryMap.has(c.idResultadoImpacto)) {
      categoryRecords.push(categoryMap.get(c.idResultadoImpacto)!);
    }
  }

  const impactosPorCategoria = meanCategories(categoryRecords);

  return {
    totalParcelas,
    totalCultivos,
    superficieTotal: round(superficieTotal),
    impactosPorCategoria,
  };
}
