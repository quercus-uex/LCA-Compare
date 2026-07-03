import { Prisma } from '../../generated/prisma/client';

function dateAtStartOfYear(year: number): Date {
  return new Date(`${year}-01-01T00:00:00.000Z`);
}

/**
 * Builds a Prisma where-condition filter for `Cultivo.fechaInicioCampania`
 * that matches a single campaign year exactly.
 *
 * Returns an empty object when no year is provided.
 */
export function buildCampaignYearFilter(
  anio?: number,
): Prisma.CultivoWhereInput {
  if (!anio) {
    return {};
  }

  return {
    fechaInicioCampania: {
      gte: dateAtStartOfYear(anio),
      lt: dateAtStartOfYear(anio + 1),
    },
  };
}

/**
 * Builds a Prisma where-condition filter for `Cultivo.fechaInicioCampania`
 * based on an optional start and/or end campaign year.
 *
 * - If only `anioInicio` is provided, the filter matches dates from
 *   January 1st of that year onwards.
 * - If only `anioFin` is provided, the filter matches dates before
 *   January 1st of the following year.
 * - If both are provided, the result is a closed range.
 * - If neither is provided, an empty object is returned.
 */
export function buildCampaignYearRangeFilter(
  anioInicio?: number,
  anioFin?: number,
): Prisma.CultivoWhereInput {
  if (!anioInicio && !anioFin) {
    return {};
  }

  const fechaInicioCampania: { gte?: Date; lt?: Date } = {};

  if (anioInicio) {
    fechaInicioCampania.gte = dateAtStartOfYear(anioInicio);
  }

  if (anioFin) {
    fechaInicioCampania.lt = dateAtStartOfYear(anioFin + 1);
  }

  return { fechaInicioCampania };
}
