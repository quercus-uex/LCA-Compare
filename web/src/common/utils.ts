export function omitNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== null && value !== undefined && (Array.isArray(value) ? value.length !== 0 : true),
    ),
  ) as Partial<T>;
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