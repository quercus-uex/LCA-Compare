import { EF_CATEGORIES, type EfCategoryId } from 'common/impact';

export type CategoryAmountRecord = Record<EfCategoryId, number>;

export type ImpactoDatos =
  | Record<string, Array<{ category: string; amount: number; unit?: string }>>
  | null
  | undefined;

type CultivoWithImpactId = {
  idResultadoImpacto: string | null;
};

type RankedByImpact = {
  impactoTotalMedio: number;
  impactosPorCategoria: CategoryAmountRecord;
};

const EMPTY_CATEGORY_RECORD = EF_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = 0;
  return acc;
}, {} as CategoryAmountRecord);

export function collectImpactoIds(cultivos: CultivoWithImpactId[]): string[] {
  return [
    ...new Set(
      cultivos
        .map((cultivo) => cultivo.idResultadoImpacto)
        .filter((id): id is string => id !== null),
    ),
  ];
}

export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export function buildEfCategoryLookup(): Map<string, EfCategoryId> {
  const lookup = new Map<string, EfCategoryId>();
  for (const cat of EF_CATEGORIES) {
    for (const name of cat.englishNames) {
      lookup.set(normalizeCategoryName(name), cat.id);
    }
  }
  return lookup;
}

export function getCategoryAmounts(
  datos: ImpactoDatos,
  lookup = buildEfCategoryLookup(),
): CategoryAmountRecord {
  const result = { ...EMPTY_CATEGORY_RECORD };
  const items = datos?.impacto_total ?? [];

  for (const item of items) {
    const categoryId = lookup.get(normalizeCategoryName(item.category ?? ''));
    if (categoryId) {
      result[categoryId] += item.amount ?? 0;
    }
  }

  return result;
}

export function sumCategories(
  records: CategoryAmountRecord[],
): CategoryAmountRecord {
  const sums = { ...EMPTY_CATEGORY_RECORD };
  for (const record of records) {
    for (const cat of EF_CATEGORIES) {
      sums[cat.id] += record[cat.id] ?? 0;
    }
  }
  return sums;
}

export function meanCategories(
  records: CategoryAmountRecord[],
): CategoryAmountRecord {
  if (records.length === 0) {
    return { ...EMPTY_CATEGORY_RECORD };
  }

  const sums = sumCategories(records);
  const means = { ...EMPTY_CATEGORY_RECORD };
  for (const cat of EF_CATEGORIES) {
    means[cat.id] = sums[cat.id] / records.length;
  }
  return means;
}

export function totalImpact(record: CategoryAmountRecord): number {
  return EF_CATEGORIES.reduce((sum, cat) => sum + (record[cat.id] ?? 0), 0);
}

export function sortByImpact<T extends RankedByImpact>(
  items: T[],
  categoria?: EfCategoryId,
): T[] {
  return [...items].sort((a, b) => {
    const aValue = categoria
      ? (a.impactosPorCategoria[categoria] ?? 0)
      : a.impactoTotalMedio;
    const bValue = categoria
      ? (b.impactosPorCategoria[categoria] ?? 0)
      : b.impactoTotalMedio;
    return aValue - bValue;
  });
}
