import { STATS_MIN_PARCELAS } from 'common/stats';
import type {
  CategoryValues,
  PoblacionRankingItemDto,
  ProvinciaRankingItemDto,
} from 'common/stats';
import {
  meanCategories,
  round,
  sortByImpact,
} from './stats-aggregation.helpers';
import { collectCategorias, type StatsRow } from './stats-rows.helpers';

export type ZonaRanking<T> = {
  ranking: T[];
  /** Zonas con datos que no llegan al mínimo de parcelas */
  ocultas: number;
};

type ZonaGroup = {
  rows: StatsRow[];
  numParcelas: number;
  /** Media por cultivo */
  impactosPorCategoria: CategoryValues;
};

/**
 * Agrupa los cultivos por zona y descarta las que tienen menos de
 * `STATS_MIN_PARCELAS` parcelas con resultado de impacto: son las que aportan
 * las medias, así que el umbral protege a esas explotaciones y evita rankings
 * decididos por una o dos parcelas.
 */
function groupZonas(
  rows: StatsRow[],
  getZonaId: (row: StatsRow) => string | undefined,
): { visibles: Map<string, ZonaGroup>; ocultas: number } {
  const grouped = new Map<string, StatsRow[]>();
  for (const r of rows) {
    const id = getZonaId(r);
    if (id === undefined) continue;
    const zona = grouped.get(id);
    if (zona) zona.push(r);
    else grouped.set(id, [r]);
  }

  const visibles = new Map<string, ZonaGroup>();
  let ocultas = 0;
  for (const [id, zonaRows] of grouped) {
    const parcelasConImpacto = new Set(
      zonaRows.filter((r) => r.categorias).map((r) => r.idParcela),
    );
    if (parcelasConImpacto.size < STATS_MIN_PARCELAS) {
      ocultas += 1;
      continue;
    }
    visibles.set(id, {
      rows: zonaRows,
      numParcelas: new Set(zonaRows.map((r) => r.idParcela)).size,
      impactosPorCategoria: meanCategories(collectCategorias(zonaRows)),
    });
  }

  return { visibles, ocultas };
}

const sum = (rows: StatsRow[], get: (r: StatsRow) => number) =>
  rows.reduce((acc, r) => acc + get(r), 0);

const ratio = (numerator: number, denominator: number, decimals: number) =>
  denominator > 0 ? round(numerator / denominator, decimals) : null;

export function rankProvincias(
  rows: StatsRow[],
): ZonaRanking<ProvinciaRankingItemDto> {
  const { visibles, ocultas } = groupZonas(rows, (r) => r.provincia?.id);

  const ranking: ProvinciaRankingItemDto[] = [];
  for (const [idProvincia, zona] of visibles) {
    const superficie = sum(zona.rows, (r) => r.superficie);
    const produccion = sum(zona.rows, (r) => r.produccion);
    // Los indicadores de agua solo usan regadío: el secano (consumo 0) bajaría
    // la dotación y sumaría producción sin agua a la productividad
    const regadio = zona.rows.filter((r) => r.consumoAgua > 0);
    const consumoAgua = sum(regadio, (r) => r.consumoAgua);

    ranking.push({
      idProvincia,
      nombreProvincia: zona.rows[0]?.provincia?.nombre ?? '',
      numParcelas: zona.numParcelas,
      numCultivos: zona.rows.length,
      superficieTotal: round(superficie),
      impactosPorCategoria: zona.impactosPorCategoria,
      // Cocientes de totales: ponderan cada cultivo por su tamaño
      rendimiento: ratio(produccion, superficie, 1),
      dotacionAgua: ratio(
        consumoAgua,
        sum(regadio, (r) => r.superficie),
        1,
      ),
      productividadAgua: ratio(
        sum(regadio, (r) => r.produccion),
        consumoAgua,
        2,
      ),
    });
  }

  return { ranking: sortByImpact(ranking), ocultas };
}

export function rankPoblaciones(
  rows: StatsRow[],
): ZonaRanking<PoblacionRankingItemDto> {
  const { visibles, ocultas } = groupZonas(rows, (r) => r.poblacion?.id);

  const ranking: PoblacionRankingItemDto[] = [];
  for (const [idPoblacion, zona] of visibles) {
    const first = zona.rows[0];
    ranking.push({
      idPoblacion,
      nombrePoblacion: first?.poblacion?.nombre ?? '',
      idProvincia: first?.provincia?.id ?? '',
      nombreProvincia: first?.provincia?.nombre ?? '',
      numParcelas: zona.numParcelas,
      numCultivos: zona.rows.length,
      superficieTotal: round(sum(zona.rows, (r) => r.superficie)),
      impactosPorCategoria: zona.impactosPorCategoria,
    });
  }

  return { ranking: sortByImpact(ranking), ocultas };
}
