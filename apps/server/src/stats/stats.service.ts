import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type EfCategoryId } from '../compare/compare.types';
import {
  buildCampaignYearFilter,
  buildEfCategoryLookup,
  collectImpactoIds,
  getCategoryAmounts,
  meanCategories,
  sortByImpact,
  totalImpact,
  type CategoryAmountRecord,
  type ImpactoDatos,
} from './stats-aggregation.helpers';
import {
  EvolucionTemporalItemDto,
  GlobalStatsDto,
  KpiDto,
  PoblacionRankingItemDto,
  ProvinciaRankingItemDto,
  DistribucionCultivoItemDto,
} from './dto/global-stats.dto';

type CultivoWithGeo = {
  id: string;
  superficieCultivada: number;
  produccion: number;
  consumoAgua: number;
  ciclo: number;
  tipo: string;
  idParcela: string;
  idResultadoImpacto: string | null;
  fechaInicioCampania: Date;
  parcela: {
    id: string;
    idPoblacion: string | null;
    poblacion: {
      id: string;
      nombre: string;
      provincia: {
        id: string;
        nombre: string;
      };
    } | null;
  };
};

type ImpactoRecord = {
  id: string;
  datos: ImpactoDatos;
};

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

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

    const mainWhere: Record<string, unknown> = { ...yearFilter };
    if (tipoCultivo) {
      mainWhere.tipo = tipoCultivo;
    }

    const [cultivos, aniosDisponibles] = await Promise.all([
      this.prisma.cultivo.findMany({
        where: mainWhere,
        include: {
          parcela: {
            include: {
              poblacion: {
                include: {
                  provincia: true,
                },
              },
            },
          },
        },
      }) as Promise<CultivoWithGeo[]>,
      this.getAniosDisponibles(tipoCultivo),
    ]);

    const impactoIds = collectImpactoIds(cultivos);

    const impactos =
      impactoIds.length > 0
        ? ((await this.prisma.resultadoImpacto.findMany({
            where: { id: { in: impactoIds } },
          })) as unknown as ImpactoRecord[])
        : [];

    const categoryLookup = buildEfCategoryLookup();
    const impactoCategoryMap = new Map<string, CategoryAmountRecord>();
    for (const imp of impactos) {
      impactoCategoryMap.set(
        imp.id,
        getCategoryAmounts(imp.datos, categoryLookup),
      );
    }

    const rankingProvincias = this.computeRankingProvincias(
      cultivos,
      impactoCategoryMap,
      categoria,
    );
    const rankingPoblaciones = this.computeRankingPoblaciones(
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
  ): Promise<KpiDto> {
    const totalCultivos = cultivos.length;
    const parcelaIds = [...new Set(cultivos.map((c) => c.idParcela))];
    const totalParcelas = parcelaIds.length;

    const superficieTotal = cultivos.reduce(
      (sum, c) => sum + (c.superficieCultivada ?? 0),
      0,
    );

    const categoryRecords: CategoryAmountRecord[] = [];
    for (const c of cultivos) {
      if (c.idResultadoImpacto && categoryMap.has(c.idResultadoImpacto)) {
        categoryRecords.push(categoryMap.get(c.idResultadoImpacto)!);
      }
    }

    const impactosPorCategoria = meanCategories(categoryRecords);

    let variacionInteranual: number | null = null;
    if (anio && categoryRecords.length > 0) {
      variacionInteranual = await this.computeInterannualVariation(
        anio,
        impactosPorCategoria.climate_change,
        tipoCultivo,
      );
    }

    return {
      totalParcelas,
      totalCultivos,
      superficieTotal: round(superficieTotal),
      impactosPorCategoria,
      variacionInteranual,
    };
  }

  private async computeInterannualVariation(
    anio: number,
    currentImpact: number,
    tipoCultivo?: string,
  ): Promise<number | null> {
    const prevFilter = buildCampaignYearFilter(anio - 1);
    if (tipoCultivo) {
      prevFilter.tipo = tipoCultivo;
    }

    const prevCultivos = (await this.prisma.cultivo.findMany({
      where: prevFilter,
    })) as { idResultadoImpacto: string | null }[];

    const prevImpactoIds = collectImpactoIds(prevCultivos);

    if (prevImpactoIds.length === 0) return null;

    const prevImpactos = (await this.prisma.resultadoImpacto.findMany({
      where: { id: { in: prevImpactoIds } },
    })) as unknown as ImpactoRecord[];

    const categoryLookup = buildEfCategoryLookup();
    const prevRecords: CategoryAmountRecord[] = [];
    for (const imp of prevImpactos) {
      prevRecords.push(getCategoryAmounts(imp.datos, categoryLookup));
    }

    const prevMeans = meanCategories(prevRecords);
    const prevImpact = prevMeans['climate_change'] ?? 0;

    if (prevImpact > 0) {
      return round(((currentImpact - prevImpact) / prevImpact) * 100);
    }
    return null;
  }

  private computeRankingProvincias(
    cultivos: CultivoWithGeo[],
    categoryMap: Map<string, CategoryAmountRecord>,
    categoria?: EfCategoryId,
  ): ProvinciaRankingItemDto[] {
    const grouped = new Map<
      string,
      {
        nombreProvincia: string;
        parcelaIds: Set<string>;
        cultivos: CultivoWithGeo[];
        categoryRecords: CategoryAmountRecord[];
      }
    >();

    for (const c of cultivos) {
      const provincia = c.parcela?.poblacion?.provincia;
      if (!provincia) continue;

      let entry = grouped.get(provincia.id);
      if (!entry) {
        entry = {
          nombreProvincia: provincia.nombre,
          parcelaIds: new Set(),
          cultivos: [],
          categoryRecords: [],
        };
        grouped.set(provincia.id, entry);
      }

      entry.parcelaIds.add(c.idParcela);
      entry.cultivos.push(c);

      if (c.idResultadoImpacto && categoryMap.has(c.idResultadoImpacto)) {
        entry.categoryRecords.push(categoryMap.get(c.idResultadoImpacto)!);
      }
    }

    const result: ProvinciaRankingItemDto[] = [];

    for (const [idProvincia, entry] of grouped) {
      const numCultivos = entry.cultivos.length;
      const superficieTotal = entry.cultivos.reduce(
        (sum, c) => sum + (c.superficieCultivada ?? 0),
        0,
      );
      const produccionMedia =
        numCultivos > 0
          ? entry.cultivos.reduce((sum, c) => sum + (c.produccion ?? 0), 0) /
            numCultivos
          : 0;
      const consumoAguaMedio =
        numCultivos > 0
          ? entry.cultivos.reduce((sum, c) => sum + (c.consumoAgua ?? 0), 0) /
            numCultivos
          : 0;

      const impactosPorCategoria = meanCategories(entry.categoryRecords);

      const impactoTotalMedio = round(totalImpact(impactosPorCategoria));

      const eficiencia =
        consumoAguaMedio > 0 ? produccionMedia / consumoAguaMedio : 0;

      result.push({
        idProvincia,
        nombreProvincia: entry.nombreProvincia,
        numParcelas: entry.parcelaIds.size,
        numCultivos,
        superficieTotal: round(superficieTotal),
        produccionMedia: round(produccionMedia),
        consumoAguaMedio: round(consumoAguaMedio),
        impactoTotalMedio,
        impactosPorCategoria,
        eficiencia: round(eficiencia * 100) / 100,
      });
    }

    return sortByImpact(result, categoria);
  }

  private computeRankingPoblaciones(
    cultivos: CultivoWithGeo[],
    categoryMap: Map<string, CategoryAmountRecord>,
    categoria?: EfCategoryId,
    idProvinciaPoblacion?: string,
  ): PoblacionRankingItemDto[] {
    const grouped = new Map<
      string,
      {
        nombrePoblacion: string;
        nombreProvincia: string;
        parcelaIds: Set<string>;
        categoryRecords: CategoryAmountRecord[];
      }
    >();

    for (const c of cultivos) {
      const poblacion = c.parcela?.poblacion;
      if (!poblacion) continue;

      if (
        idProvinciaPoblacion &&
        poblacion.provincia?.id !== idProvinciaPoblacion
      ) {
        continue;
      }

      let entry = grouped.get(poblacion.id);
      if (!entry) {
        entry = {
          nombrePoblacion: poblacion.nombre,
          nombreProvincia: poblacion.provincia?.nombre ?? '',
          parcelaIds: new Set(),
          categoryRecords: [],
        };
        grouped.set(poblacion.id, entry);
      }

      entry.parcelaIds.add(c.idParcela);

      if (c.idResultadoImpacto && categoryMap.has(c.idResultadoImpacto)) {
        entry.categoryRecords.push(categoryMap.get(c.idResultadoImpacto)!);
      }
    }

    const result: PoblacionRankingItemDto[] = [];

    for (const [idPoblacion, entry] of grouped) {
      const impactosPorCategoria = meanCategories(entry.categoryRecords);

      const impactoTotalMedio = round(totalImpact(impactosPorCategoria));

      result.push({
        idPoblacion,
        nombrePoblacion: entry.nombrePoblacion,
        nombreProvincia: entry.nombreProvincia,
        numParcelas: entry.parcelaIds.size,
        impactoTotalMedio,
        impactosPorCategoria,
      });
    }

    return sortByImpact(result, categoria);
  }

  private async computeEvolucionTemporal(): Promise<
    EvolucionTemporalItemDto[]
  > {
    const allCultivos = (await this.prisma.cultivo.findMany({})) as {
      idResultadoImpacto: string | null;
      fechaInicioCampania: Date;
    }[];

    const allImpactoIds = collectImpactoIds(allCultivos);

    const allImpactos =
      allImpactoIds.length > 0
        ? ((await this.prisma.resultadoImpacto.findMany({
            where: { id: { in: allImpactoIds } },
          })) as unknown as ImpactoRecord[])
        : [];

    const impactoMap = new Map<string, ImpactoDatos>();
    for (const imp of allImpactos) {
      impactoMap.set(imp.id, imp.datos);
    }

    const cultivosByYear = new Map<number, number>();
    const categoriesByYear = new Map<number, CategoryAmountRecord[]>();
    const categoryLookup = buildEfCategoryLookup();

    for (const c of allCultivos) {
      const year = c.fechaInicioCampania.getFullYear();
      cultivosByYear.set(year, (cultivosByYear.get(year) ?? 0) + 1);

      if (c.idResultadoImpacto && impactoMap.has(c.idResultadoImpacto)) {
        const catAmounts = getCategoryAmounts(
          impactoMap.get(c.idResultadoImpacto),
          categoryLookup,
        );
        if (!categoriesByYear.has(year)) {
          categoriesByYear.set(year, []);
        }
        categoriesByYear.get(year)!.push(catAmounts);
      }
    }

    const result: EvolucionTemporalItemDto[] = [];

    for (const [year, records] of categoriesByYear) {
      const categorias = meanCategories(records);
      const totalImpacto = round(totalImpact(categorias));

      result.push({
        anio: year,
        numCultivos: cultivosByYear.get(year) ?? 0,
        categorias,
        totalImpacto,
      });
    }

    return result.sort((a, b) => a.anio - b.anio);
  }

  private async computeDistribucionCultivos(
    yearFilter: Record<string, unknown>,
  ): Promise<DistribucionCultivoItemDto[]> {
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
