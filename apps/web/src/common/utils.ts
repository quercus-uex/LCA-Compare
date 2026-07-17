import { i18n } from '../i18n/index.ts';

export function omitNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== null && value !== undefined && (Array.isArray(value) ? value.length !== 0 : true),
    ),
  ) as Partial<T>;
}

export function formatDate(value: Date | string): string | null {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(i18n.language ?? 'es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function exportJSON(input: object) {
  const json = JSON.stringify(input, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const SEP = ';';
  const body = rows.map(r => r.map(escape).join(SEP)).join('\r\n');
  const csv = '\ufeff' + body;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}