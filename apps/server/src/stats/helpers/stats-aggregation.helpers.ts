import {
  DEFAULT_EF_CATEGORY,
  EF_CATEGORIES,
  getEfCategoryId,
  type EfCategoryId,
} from 'common/impact';
import type { CategoryValues } from 'common/stats';

export type CategoryAmountRecord = CategoryValues;

/** Importes de un resultado; solo tiene las categorías que trae el resultado */
export type PartialCategoryAmounts = Partial<CategoryValues>;

export type ImpactoDatos =
  | Record<string, Array<{ category: string; amount: number; unit?: string }>>
  | null
  | undefined;

type RankedByImpact = {
  impactosPorCategoria: CategoryAmountRecord;
};

export const EMPTY_CATEGORY_RECORD = EF_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = 0;
  return acc;
}, {} as CategoryAmountRecord);

/**
 * Importes de `impacto_total` por categoría EF. Una categoría que no aparece
 * en el resultado se omite en lugar de valer 0, para que no rebaje las medias.
 */
export function getCategoryAmounts(
  datos: ImpactoDatos,
): PartialCategoryAmounts {
  const result: PartialCategoryAmounts = {};
  for (const item of datos?.impacto_total ?? []) {
    const categoryId = getEfCategoryId(item.category ?? '');
    if (categoryId && Number.isFinite(item.amount)) {
      result[categoryId] = (result[categoryId] ?? 0) + item.amount;
    }
  }
  return result;
}

/**
 * Media de cada categoría entre los registros que la tienen. Una categoría sin
 * ningún valor vale 0.
 */
export function meanCategories(
  records: PartialCategoryAmounts[],
): CategoryAmountRecord {
  const means = { ...EMPTY_CATEGORY_RECORD };
  for (const cat of EF_CATEGORIES) {
    let sum = 0;
    let count = 0;
    for (const record of records) {
      const value = record[cat.id];
      if (value !== undefined) {
        sum += value;
        count += 1;
      }
    }
    means[cat.id] = count > 0 ? sum / count : 0;
  }
  return means;
}

export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Ordena de menor a mayor impacto en una única categoría (por defecto, cambio
 * climático). No existe ordenación por impacto total: sumar categorías con
 * unidades distintas no tiene sentido.
 */
export function sortByImpact<T extends RankedByImpact>(
  items: T[],
  categoria: EfCategoryId = DEFAULT_EF_CATEGORY,
): T[] {
  return [...items].sort(
    (a, b) =>
      (a.impactosPorCategoria[categoria] ?? 0) -
      (b.impactosPorCategoria[categoria] ?? 0),
  );
}
