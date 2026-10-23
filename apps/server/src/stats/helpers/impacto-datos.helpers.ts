import type { ImpactoDatos } from './stats-aggregation.helpers';

type ImpactoItem = { category: string; amount: number; unit?: string };

function isImpactoItem(value: unknown): value is ImpactoItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['category'] === 'string' && typeof v['amount'] === 'number';
}

function isImpactoDatos(value: unknown): value is ImpactoDatos {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const total = v['impacto_total'];
  if (total === undefined) return true;
  return Array.isArray(total) && total.every(isImpactoItem);
}

/** Valida el JSON de `ResultadoImpacto.datos`; si no tiene la forma esperada devuelve `null` */
export function parseImpactoDatos(value: unknown): ImpactoDatos {
  return isImpactoDatos(value) ? value : null;
}
