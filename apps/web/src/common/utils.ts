import type { CompareResultDto } from 'common/compare';
import { i18n } from '../i18n/index.ts';
import { getEfCategoryId } from './constants.ts';

export function omitNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== null && value !== undefined && (Array.isArray(value) ? value.length !== 0 : true),
    ),
  ) as Partial<T>;
}

// Category names arrive from openLCA in English; unknown ones are shown as is
export function translateEfCategory(name: string): string {
  const id = getEfCategoryId(name);
  return id ? i18n.t(`impactCategories.${id}`) : name;
}

// `diff` existe (aunque sea null) en cuanto hay conjunto objetivo; `tarAmount`
// falta en las categorías que el objetivo no tiene, así que no sirve para esto
export function hasTargetSet(result: CompareResultDto): boolean {
  return result.impacto_total.some((i) => i.diff !== undefined);
}

export function safeString(value: unknown): string | null {
  if (value === null || value === undefined || typeof value === 'object') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  return null;
}

/** Texto sin tildes ni mayúsculas, para que «caceres» encuentre «Cáceres» */
export const normalizeSearch = (value: string) =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** `true` si `text` contiene `query` sin distinguir tildes ni mayúsculas */
export const matchesSearch = (text: string, query: string) =>
  normalizeSearch(text).includes(normalizeSearch(query));

export function toggleInArray<T extends { id: string }>(arr: T[], item: T): T[] {
  return arr.some((i) => i.id === item.id)
    ? arr.filter((i) => i.id !== item.id)
    : [...arr, item];
}

/** Descarga un blob como fichero; el enlace se añade al DOM porque Firefox lo necesita */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportJSON(input: object) {
  const json = JSON.stringify(input, null, 2);
  downloadBlob(new Blob([json], { type: 'application/json' }), 'export.json');
}

export function exportCSV(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const SEP = ';';
  const body = rows.map(r => r.map(escape).join(SEP)).join('\r\n');
  const csv = '\ufeff' + body;

  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}
