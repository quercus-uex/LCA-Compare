import type { Prisma } from '../../generated/prisma/client';
import type {
  CategoryValues,
  DistribucionCultivoItemDto,
  GlobalStatsQuery,
} from 'common/stats';
import { parseImpactoDatos } from './impacto-datos.helpers';
import {
  buildEfCategoryLookup,
  getCategoryAmounts,
  round,
} from './stats-aggregation.helpers';

export const STATS_CULTIVO_SELECT = {
  idParcela: true,
  tipo: true,
  fechaInicioCampania: true,
  superficieCultivada: true,
  produccion: true,
  consumoAgua: true,
  resultadoImpacto: { select: { datos: true } },
  parcela: {
    select: {
      poblacion: {
        select: {
          id: true,
          nombre: true,
          provincia: { select: { id: true, nombre: true } },
        },
      },
    },
  },
} satisfies Prisma.CultivoSelect;

export type StatsCultivo = Prisma.CultivoGetPayload<{
  select: typeof STATS_CULTIVO_SELECT;
}>;

type Zona = { id: string; nombre: string };

/** Un cultivo ya reducido a lo que necesitan las agregaciones */
export type StatsRow = {
  idParcela: string;
  tipo: string;
  anio: number;
  /** ha */
  superficie: number;
  /** kg */
  produccion: number;
  /** m³ */
  consumoAgua: number;
  /** `null` si el cultivo no tiene resultado de impacto */
  categorias: CategoryValues | null;
  poblacion: Zona | null;
  provincia: Zona | null;
};

export function toStatsRows(cultivos: StatsCultivo[]): StatsRow[] {
  const lookup = buildEfCategoryLookup();

  return cultivos.map((c) => {
    const poblacion = c.parcela.poblacion;
    return {
      idParcela: c.idParcela,
      tipo: c.tipo,
      // Los filtros de año trabajan en UTC
      anio: c.fechaInicioCampania.getUTCFullYear(),
      superficie: c.superficieCultivada,
      produccion: c.produccion,
      consumoAgua: c.consumoAgua,
      categorias: c.resultadoImpacto
        ? getCategoryAmounts(
            parseImpactoDatos(c.resultadoImpacto.datos),
            lookup,
          )
        : null,
      poblacion: poblacion
        ? { id: poblacion.id, nombre: poblacion.nombre }
        : null,
      provincia: poblacion
        ? { id: poblacion.provincia.id, nombre: poblacion.provincia.nombre }
        : null,
    };
  });
}

export function filterRows(
  rows: StatsRow[],
  { anio, tipoCultivo }: GlobalStatsQuery,
): StatsRow[] {
  return rows.filter(
    (r) =>
      (anio === undefined || r.anio === anio) &&
      (tipoCultivo === undefined || r.tipo === tipoCultivo),
  );
}

export function collectCategorias(rows: StatsRow[]): CategoryValues[] {
  return rows.flatMap((r) => (r.categorias ? [r.categorias] : []));
}

export function uniqueSorted<T extends string | number>(values: T[]): T[] {
  return [...new Set(values)].sort((a, b) =>
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b)),
  );
}

export function computeDistribucionCultivos(
  rows: StatsRow[],
): DistribucionCultivoItemDto[] {
  const grouped = new Map<string, { count: number; superficie: number }>();
  for (const r of rows) {
    const entry = grouped.get(r.tipo) ?? { count: 0, superficie: 0 };
    entry.count += 1;
    entry.superficie += r.superficie;
    grouped.set(r.tipo, entry);
  }

  return [...grouped]
    .map(([tipo, { count, superficie }]) => ({
      tipo,
      count,
      superficieTotal: round(superficie),
    }))
    .sort((a, b) => b.count - a.count || a.tipo.localeCompare(b.tipo));
}
