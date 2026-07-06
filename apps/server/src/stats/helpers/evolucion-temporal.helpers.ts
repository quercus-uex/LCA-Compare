import {
  buildEfCategoryLookup,
  getCategoryAmounts,
  meanCategories,
  round,
  totalImpact,
  type CategoryAmountRecord,
  type ImpactoDatos,
} from '../stats-aggregation.helpers';
import type { EvolucionTemporalItemDto } from '../dto/global-stats.dto';
import type { CultivoWithFecha } from './stats.types';

export function aggregateEvolucionByYear(
  cultivos: CultivoWithFecha[],
  impactoMap: Map<string, ImpactoDatos>,
  lookup: ReturnType<typeof buildEfCategoryLookup>,
): EvolucionTemporalItemDto[] {
  const cultivosByYear = new Map<number, number>();
  const categoriesByYear = new Map<number, CategoryAmountRecord[]>();

  for (const c of cultivos) {
    const year = c.fechaInicioCampania.getFullYear();
    cultivosByYear.set(year, (cultivosByYear.get(year) ?? 0) + 1);

    if (c.idResultadoImpacto && impactoMap.has(c.idResultadoImpacto)) {
      const catAmounts = getCategoryAmounts(
        impactoMap.get(c.idResultadoImpacto),
        lookup,
      );
      if (!categoriesByYear.has(year)) {
        categoriesByYear.set(year, []);
      }
      categoriesByYear.get(year)!.push(catAmounts);
    }
  }

  const result: EvolucionTemporalItemDto[] = [];

  for (const [year, records] of categoriesByYear) {
    const categorias = meanCategories(records);
    const totalImpacto = round(totalImpact(categorias));

    result.push({
      anio: year,
      numCultivos: cultivosByYear.get(year) ?? 0,
      categorias,
      totalImpacto,
    });
  }

  return result.sort((a, b) => a.anio - b.anio);
}
