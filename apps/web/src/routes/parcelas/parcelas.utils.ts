import type { TFunction } from 'i18next';
import { normalizeSearch } from '../../common/utils.ts';
import type { Parcela, ParcelaPoblacion, ParcelaResumen } from '../../hooks/parcela.hook.tsx';

export const PARCELAS_SORTS = ['nombre', 'campania', 'superficie'] as const;
export type ParcelasSort = (typeof PARCELAS_SORTS)[number];

export const PARCELAS_VIEWS = ['tarjetas', 'tabla', 'mapa'] as const;
export type ParcelasView = (typeof PARCELAS_VIEWS)[number];

/** Estado del listado; vive en la URL para conservarse al volver del detalle */
export type ParcelasQuery = {
  q: string;
  tipo: string;
  poblacion: string;
  soloReferencia: boolean;
  orden: ParcelasSort;
  vista: ParcelasView;
};

const pick = <T extends string>(value: string | null, options: readonly T[], fallback: T): T =>
  options.find((o) => o === value) ?? fallback;

export const parseParcelasQuery = (params: URLSearchParams): ParcelasQuery => ({
  q: params.get('q') ?? '',
  tipo: params.get('tipo') ?? '',
  poblacion: params.get('poblacion') ?? '',
  soloReferencia: params.get('ref') === '1',
  orden: pick(params.get('orden'), PARCELAS_SORTS, 'nombre'),
  vista: pick(params.get('vista'), PARCELAS_VIEWS, 'tarjetas'),
});

/** Solo escribe en la URL lo que difiere del valor por defecto */
export const toSearchParams = (query: ParcelasQuery): URLSearchParams => {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.tipo) params.set('tipo', query.tipo);
  if (query.poblacion) params.set('poblacion', query.poblacion);
  if (query.soloReferencia) params.set('ref', '1');
  if (query.orden !== 'nombre') params.set('orden', query.orden);
  if (query.vista !== 'tarjetas') params.set('vista', query.vista);
  return params;
};

export const hasActiveFilters = (query: ParcelasQuery) =>
  !!query.q || !!query.tipo || !!query.poblacion || query.soloReferencia;

const searchableText = (p: ParcelaResumen) =>
  normalizeSearch([
    p.nombre,
    p.sigpac,
    p.refCat,
    p.ptIdParcela,
    p.poblacion?.nombre,
    p.poblacion?.provincia.nombre,
  ].filter(Boolean).join(' '));

const compareBy: Record<ParcelasSort, (a: ParcelaResumen, b: ParcelaResumen) => number> = {
  nombre: () => 0,
  // Más recientes primero; las parcelas sin cultivos, al final
  campania: (a, b) =>
    (b.ultimoCultivo?.fechaInicioCampania ?? '').localeCompare(a.ultimoCultivo?.fechaInicioCampania ?? ''),
  superficie: (a, b) =>
    (b.ultimoCultivo?.superficieCultivada ?? -1) - (a.ultimoCultivo?.superficieCultivada ?? -1),
};

export const filterAndSortParcelas = (parcelas: ParcelaResumen[], query: ParcelasQuery, locale: string) => {
  const terms = normalizeSearch(query.q).split(/\s+/).filter(Boolean);
  const byName = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });

  return parcelas
    .filter((p) => {
      if (query.tipo && p.ultimoCultivo?.tipo !== query.tipo) return false;
      if (query.poblacion && p.poblacion?.id !== query.poblacion) return false;
      if (query.soloReferencia && !p.esParcelaReferencia) return false;
      if (terms.length === 0) return true;
      const text = searchableText(p);
      return terms.every((term) => text.includes(term));
    })
    .sort((a, b) => compareBy[query.orden](a, b) || byName.compare(a.nombre, b.nombre));
};

/** Tipos de cultivo actuales y municipios presentes en las parcelas, para los filtros */
export const getFilterOptions = (parcelas: ParcelaResumen[]) => {
  const tipos = new Set<string>();
  const poblaciones = new Map<string, ParcelaPoblacion>();
  for (const p of parcelas) {
    if (p.ultimoCultivo) tipos.add(p.ultimoCultivo.tipo);
    if (p.poblacion) poblaciones.set(p.poblacion.id, p.poblacion);
  }
  return {
    tipos: [...tipos].sort(),
    poblaciones: [...poblaciones.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
  };
};

export const formatPoblacion = (poblacion: ParcelaPoblacion | null, t: TFunction) =>
  poblacion ? `${poblacion.nombre}, ${poblacion.provincia.nombre}` : t('parcelas.noPoblacion');

/** Identificadores que tiene la parcela; casi siempre solo uno según el país */
export const getIdentificadores = (p: Parcela, t: TFunction) =>
  [
    { key: 'sigpac', label: 'SIGPAC', value: p.sigpac },
    { key: 'refCat', label: t('common.fields.cadastralReference'), value: p.refCat },
    { key: 'ptIdParcela', label: t('common.fields.portugalId'), value: p.ptIdParcela },
  ].filter((i): i is { key: string; label: string; value: string } => !!i.value);

/** Estado de navegación que lleva al detalle la URL del listado, para volver a ella */
export type ParcelaLinkState = {
  listSearch?: string;
  /** Al llegar desde las parcelas de un miembro: organización por la que se accede y búsqueda de esa lista */
  organizacion?: { id: string; search: string };
};
