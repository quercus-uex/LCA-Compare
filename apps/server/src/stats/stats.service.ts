import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { type EfCategoryId } from '../compare/compare.types';
import { buildCampaignYearFilter } from '../common/helpers/campaign-year.helper';
import {
  buildEfCategoryLookup,
  collectImpactoIds,
  getCategoryAmounts,
  meanCategories,
  round,
  type CategoryAmountRecord,
  type ImpactoDatos,
} from './stats-aggregation.helpers';
import {
  parseImpactoRecords,
  type ImpactoRecord,
} from './helpers/impacto-record.helpers';
import type { CultivoWithGeo, CultivoWithFecha } from './helpers/stats.types';
import {
  rankPoblaciones,
  rankProvincias,
} from './helpers/rank-by-location.helpers';
import { computeKpiSummary } from './helpers/kpi.helpers';
import { aggregateEvolucionByYear } from './helpers/evolucion-temporal.helpers';
import type { GlobalStatsDto } from './dto/global-stats.dto';

const CULTIVO_WITH_GEO_INCLUDE = {
  parcela: {
    include: {
      poblacion: {
        include: {
          provincia: true,
        },
      },
    },
  },
} satisfies Prisma.CultivoInclude;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalStats(
    anio?: number,
    categoria?: EfCategoryId,
    tipoCultivo?: string,
    idProvinciaPoblacion?: string,
  ): Promise<GlobalStatsDto> {
    const yearFilter = buildCampaignYearFilter(anio);

    const mainWhere: Prisma.CultivoWhereInput = { ...yearFilter };
    if (tipoCultivo) {
      mainWhere.tipo = tipoCultivo;
    }

    const [cultivos, aniosDisponibles] = await Promise.all([
      this.prisma.cultivo.findMany({
        where: mainWhere,
        include: CULTIVO_WITH_GEO_INCLUDE,
      }),
      this.getAniosDisponibles(tipoCultivo),
    ]);

    const impactoCategoryMap = await this.buildImpactoCategoryMap(cultivos);

    const rankingProvincias = rankProvincias(
      cultivos,
      impactoCategoryMap,
      categoria,
    );
    const rankingPoblaciones = rankPoblaciones(
      cultivos,
      impactoCategoryMap,
      categoria,
      idProvinciaPoblacion,
    );

    const [kpis, evolucionTemporal, distribucionCultivos] = await Promise.all([
      this.computeKPIs(cultivos, impactoCategoryMap, anio, tipoCultivo),
      this.computeEvolucionTemporal(),
      this.computeDistribucionCultivos(yearFilter),
    ]);

    return {
      kpis,
      rankingProvincias,
      rankingPoblaciones,
      evolucionTemporal,
      distribucionCultivos,
      aniosDisponibles,
    };
  }

  private async buildImpactoCategoryMap(
    cultivos: CultivoWithFecha[],
  ): Promise<Map<string, CategoryAmountRecord>> {
    const impactoIds = collectImpactoIds(cultivos);
    if (impactoIds.length === 0) return new Map();

    const impactos = parseImpactoRecords(
      await this.prisma.resultadoImpacto.findMany({
        where: { id: { in: impactoIds } },
      }),
    );

    const categoryLookup = buildEfCategoryLookup();
    const map = new Map<string, CategoryAmountRecord>();
    for (const imp of impactos) {
      map.set(imp.id, getCategoryAmounts(imp.datos, categoryLookup));
    }
    return map;
  }

  private async getAniosDisponibles(tipoCultivo?: string): Promise<number[]> {
    const cultivos = await this.prisma.cultivo.findMany({
      where: tipoCultivo ? { tipo: tipoCultivo } : undefined,
      select: { fechaInicioCampania: true },
      orderBy: { fechaInicioCampania: 'asc' },
    });

    return [
      ...new Set(
        cultivos.map((cultivo) => cultivo.fechaInicioCampania.getFullYear()),
      ),
    ];
  }

  private async computeKPIs(
    cultivos: CultivoWithGeo[],
    categoryMap: Map<string, CategoryAmountRecord>,
    anio?: number,
    tipoCultivo?: string,
  ) {
    const summary = computeKpiSummary(cultivos, categoryMap);

    let variacionInteranual: number | null = null;
    if (anio) {
      const currentImpact = summary.impactosPorCategoria['climate_change'] ?? 0;
      variacionInteranual = await this.computeInterannualVariation(
        anio,
        currentImpact,
        tipoCultivo,
      );
    }

    return {
      ...summary,
      variacionInteranual,
    };
  }

  private async computeInterannualVariation(
    anio: number,
    currentImpact: number,
    tipoCultivo?: string,
  ): Promise<number | null> {
    const prevFilter: Prisma.CultivoWhereInput = {
      ...buildCampaignYearFilter(anio - 1),
    };
    if (tipoCultivo) {
      prevFilter.tipo = tipoCultivo;
    }

    const prevCultivos = await this.prisma.cultivo.findMany({
      where: prevFilter,
      select: { idResultadoImpacto: true },
    });

    const prevImpactoIds = collectImpactoIds(prevCultivos);
    if (prevImpactoIds.length === 0) return null;

    const prevImpactos = parseImpactoRecords(
      await this.prisma.resultadoImpacto.findMany({
        where: { id: { in: prevImpactoIds } },
      }),
    );

    const categoryLookup = buildEfCategoryLookup();
    const prevRecords: CategoryAmountRecord[] = prevImpactos.map((imp) =>
      getCategoryAmounts(imp.datos, categoryLookup),
    );

    const prevMeans = meanCategories(prevRecords);
    const prevImpact = prevMeans['climate_change'] ?? 0;

    if (prevImpact > 0) {
      return round(((currentImpact - prevImpact) / prevImpact) * 100);
    }
    return null;
  }

  private async computeEvolucionTemporal() {
    const allCultivos = await this.prisma.cultivo.findMany({
      select: { idResultadoImpacto: true, fechaInicioCampania: true },
    });

    const allImpactoIds = collectImpactoIds(allCultivos);
    const allImpactos: ImpactoRecord[] =
      allImpactoIds.length > 0
        ? parseImpactoRecords(
            await this.prisma.resultadoImpacto.findMany({
              where: { id: { in: allImpactoIds } },
            }),
          )
        : [];

    const impactoMap = new Map<string, ImpactoDatos>();
    for (const imp of allImpactos) {
      impactoMap.set(imp.id, imp.datos);
    }

    const categoryLookup = buildEfCategoryLookup();
    return aggregateEvolucionByYear(allCultivos, impactoMap, categoryLookup);
  }

  private async computeDistribucionCultivos(
    yearFilter: Record<string, unknown>,
  ) {
    const queryResult = await this.prisma.cultivo.groupBy({
      by: ['tipo'],
      where: Object.keys(yearFilter).length > 0 ? yearFilter : undefined,
      _count: { id: true },
      _sum: { superficieCultivada: true },
    });

    return queryResult.map((r) => ({
      tipo: r.tipo,
      count: r._count.id,
      superficieTotal: round(r._sum.superficieCultivada ?? 0),
    }));
  }
}
