import type { Prisma } from '../../generated/prisma/client';
import type { ImpactoDatos } from '../stats-aggregation.helpers';

export type ImpactoRecord = {
  id: string;
  datos: ImpactoDatos;
};

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

type ResultadoImpactoRow = Prisma.ResultadoImpactoGetPayload<true>;

export function parseImpactoRecord(r: ResultadoImpactoRow): ImpactoRecord {
  return {
    id: r.id,
    datos: isImpactoDatos(r.datos) ? r.datos : null,
  };
}

export function parseImpactoRecords(
  rs: ResultadoImpactoRow[],
): ImpactoRecord[] {
  return rs.map(parseImpactoRecord);
}
