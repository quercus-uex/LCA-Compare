import { Prisma } from '../generated/prisma/client';
import { buildCampaignYearRangeFilter } from '../common/helpers/campaign-year.helper';
import { CompareQueryItemDto } from './dto/compare-query.dto';

/**
 * Builds the Prisma `where` clause for a comparison query.
 *
 * Returns `null` when no filters are provided, so callers can skip the DB call.
 */
export class CompareQueryBuilder {
  /**
   * Filtros a nivel de campaña (tipo de cultivo y años). Se usan también para
   * elegir la campaña más reciente de cada parcela en el filtro por radio.
   */
  static buildCultivoFilter(
    filters: CompareQueryItemDto,
  ): Prisma.CultivoWhereInput {
    return {
      ...(filters.tipoCultivo ? { tipo: filters.tipoCultivo } : {}),
      ...buildCampaignYearRangeFilter(
        filters.anioCampaniaInicio,
        filters.anioCampaniaFin,
      ),
    };
  }

  /**
   * `locationIds` es `undefined` si no hay filtro por radio. Si lo hay pero no
   * encontró parcelas (array vacío), la condición se mantiene y no coincide con
   * ningún resultado, en lugar de descartarse en silencio.
   */
  static build(
    filters: CompareQueryItemDto,
    locationIds?: string[],
  ): Prisma.ResultadoImpactoWhereInput | null {
    const orConditions: Prisma.ResultadoImpactoWhereInput[] = [];

    if (filters.idsPoblacion && filters.idsPoblacion.length > 0) {
      orConditions.push({
        cultivo: {
          parcela: { poblacion: { id: { in: filters.idsPoblacion } } },
        },
      });
    }

    if (filters.idsProvincia && filters.idsProvincia.length > 0) {
      orConditions.push({
        cultivo: {
          parcela: {
            poblacion: {
              provincia: { id: { in: filters.idsProvincia } },
            },
          },
        },
      });
    }

    if (filters.idsParcela && filters.idsParcela.length > 0) {
      orConditions.push({
        cultivo: { parcela: { id: { in: filters.idsParcela } } },
      });
    }

    if (locationIds !== undefined) {
      orConditions.push({ id: { in: locationIds } });
    }

    if (filters.idPais) {
      orConditions.push({
        cultivo: {
          parcela: {
            poblacion: { provincia: { idPais: filters.idPais } },
          },
        },
      });
    }

    const andConditions: Prisma.ResultadoImpactoWhereInput[] = [];

    if (orConditions.length > 0) {
      andConditions.push({ OR: orConditions });
    }

    if (filters.tipoCultivo) {
      andConditions.push({ cultivo: { tipo: filters.tipoCultivo } });
    }

    if (filters.soloParcelasReferencia) {
      andConditions.push({
        cultivo: { parcela: { esParcelaReferencia: true } },
      });
    }

    const yearFilter = buildCampaignYearRangeFilter(
      filters.anioCampaniaInicio,
      filters.anioCampaniaFin,
    );

    if (yearFilter.fechaInicioCampania) {
      andConditions.push({ cultivo: yearFilter });
    }

    if (andConditions.length === 0) {
      return null;
    }

    return { AND: andConditions };
  }
}
