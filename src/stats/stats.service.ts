import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EF_CATEGORIES, type EfCategoryId } from '../compare/compare.types';
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
  datos: Record<
    string,
    Array<{ category: string; amount: number; unit: string }>
  >;
};

function getCategoryAmounts(
  datos: ImpactoRecord['datos'],
): Record<string, number> {
  const result: Record<string, number> = {};
  const items = datos?.impacto_total ?? [];
  for (const cat of EF_CATEGORIES) {
    let amount = 0;
    for (const name of cat.englishNames) {
      const match = items.find(
        (item) =>
          item.category?.trim().toLowerCase() === name.toLowerCase(),
      );
      if (match) {
        amount += match.amount ?? 0;
      }
    }
    result[cat.id] = amount;
  }
  return result;
}

function sumCategories(
  records: Record<string, number>[],
): Record<string, number> {
  const sums: Record<string, number> = {};
  for (const rec of records) {
    for (const [key, val] of Object.entries(rec)) {
      sums[key] = (sums[key] ?? 0) + val;
    }
  }
  return sums;
}

function meanCategories(
  records: Record<string, number>[],
): Record<string, number> {
  if (records.length === 0) {
    const zero: Record<string, number> = {};
    for (const cat of EF_CATEGORIES) zero[cat.id] = 0;
    return zero;
  }
  const sums = sumCategories(records);
  const means: Record<string, number> = {};
  for (const [key, val] of Object.entries(sums)) {
    means[key] = val / records.length;
  }
  return means;
}

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getGlobalStats(
    anio?: number,
    categoria?: EfCategoryId,
  ): Promise<GlobalStatsDto> {
    const yearFilter = anio
      ? {
          fechaInicioCampania: {
            gte: new Date(`${anio}-01-01T00:00:00.000Z`),
            lt: new Date(`${anio + 1}-01-01T00:00:00.000Z`),
          },
        }
      : {};

    const [cultivos, aniosDisponibles] = await Promise.all([
      this.prisma.cultivo.findMany({
        where: yearFilter,
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
      this.getAniosDisponibles(),
    ]);

    const impactoIds = [
      ...new Set(
        cultivos
          .filter((c) => c.idResultadoImpacto)
          .map((c) => c.idResultadoImpacto!),
      ),
    ];

    const impactos =
      impactoIds.length > 0
        ? ((await this.prisma.resultadoImpacto.findMany({
            where: { id: { in: impactoIds } },
          })) as unknown as ImpactoRecord[])
        : [];

    const impactoCategoryMap = new Map<string, Record<string, number>>();
    for (const imp of impactos) {
      impactoCategoryMap.set(imp.id, getCategoryAmounts(imp.datos));
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
    );

    const [kpis, evolucionTemporal, distribucionCultivos] = await Promise.all([
      this.computeKPIs(cultivos, impactoCategoryMap, anio),
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

  private async getAniosDisponibles(): Promise<number[]> {
    const result = await this.prisma.$queryRawUnsafe<Array<{ anio: number }>>(
      'SELECT DISTINCT EXTRACT(YEAR FROM "fechaInicioCampania")::int AS "anio" FROM "Cultivo" ORDER BY "anio"',
    );
    return result.map((r) => r.anio);
  }

  private async computeKPIs(
    cultivos: CultivoWithGeo[],
    categoryMap: Map<string, Record<string, number>>,
    anio?: number,
  ): Promise<KpiDto> {
    const totalCultivos = cultivos.length;
    const parcelaIds = [...new Set(cultivos.map((c) => c.idParcela))];
    const totalParcelas = parcelaIds.length;

    const superficieTotal = cultivos.reduce(
      (sum, c) => sum + (c.superficieCultivada ?? 0),
      0,
    );

    const categoryRecords: Record<string, number>[] = [];
    for (const c of cultivos) {
      if (c.idResultadoImpacto && categoryMap.has(c.idResultadoImpacto)) {
        categoryRecords.push(categoryMap.get(c.idResultadoImpacto)!);
      }
    }

    const impactosPorCategoria = meanCategories(categoryRecords) as Record<
      EfCategoryId,
      number
    >;

    let variacionInteranual: number | null = null;
    if (anio && categoryRecords.length > 0) {
      variacionInteranual = await this.computeInterannualVariation(
        anio,
        impactosPorCategoria.climate_change,
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
  ): Promise<number | null> {
    const prevFilter = {
      fechaInicioCampania: {
        gte: new Date(`${anio - 1}-01-01T00:00:00.000Z`),
        lt: new Date(`${anio}-01-01T00:00:00.000Z`),
      },
    };

    const prevCultivos = (await this.prisma.cultivo.findMany({
      where: prevFilter,
    })) as { idResultadoImpacto: string | null }[];

    const prevImpactoIds = [
      ...new Set(
        prevCultivos
          .filter((c) => c.idResultadoImpacto)
          .map((c) => c.idResultadoImpacto!),
      ),
    ];

    if (prevImpactoIds.length === 0) return null;

    const prevImpactos = (await this.prisma.resultadoImpacto.findMany({
      where: { id: { in: prevImpactoIds } },
    })) as unknown as ImpactoRecord[];

    const prevRecords: Record<string, number>[] = [];
    for (const imp of prevImpactos) {
      prevRecords.push(getCategoryAmounts(imp.datos));
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
    categoryMap: Map<string, Record<string, number>>,
    categoria?: EfCategoryId,
  ): ProvinciaRankingItemDto[] {
    const grouped = new Map<
      string,
      {
        nombreProvincia: string;
        parcelaIds: Set<string>;
        cultivos: CultivoWithGeo[];
        categoryRecords: Record<string, number>[];
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

      const impactosPorCategoria = meanCategories(
        entry.categoryRecords,
      ) as Record<EfCategoryId, number>;

      const impactoTotalMedio = round(
        Object.values(impactosPorCategoria).reduce((a, b) => a + b, 0),
      );

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

    if (categoria) {
      return result.sort(
        (a, b) =>
          (a.impactosPorCategoria[categoria] ?? 0) -
          (b.impactosPorCategoria[categoria] ?? 0),
      );
    }
    return result.sort((a, b) => a.impactoTotalMedio - b.impactoTotalMedio);
  }

  private computeRankingPoblaciones(
    cultivos: CultivoWithGeo[],
    categoryMap: Map<string, Record<string, number>>,
    categoria?: EfCategoryId,
  ): PoblacionRankingItemDto[] {
    const grouped = new Map<
      string,
      {
        nombrePoblacion: string;
        nombreProvincia: string;
        parcelaIds: Set<string>;
        categoryRecords: Record<string, number>[];
      }
    >();

    for (const c of cultivos) {
      const poblacion = c.parcela?.poblacion;
      if (!poblacion) continue;

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
      const impactosPorCategoria = meanCategories(
        entry.categoryRecords,
      ) as Record<EfCategoryId, number>;

      const impactoTotalMedio = round(
        Object.values(impactosPorCategoria).reduce((a, b) => a + b, 0),
      );

      result.push({
        idPoblacion,
        nombrePoblacion: entry.nombrePoblacion,
        nombreProvincia: entry.nombreProvincia,
        numParcelas: entry.parcelaIds.size,
        impactoTotalMedio,
        impactosPorCategoria,
      });
    }

    if (categoria) {
      return result.sort(
        (a, b) =>
          (a.impactosPorCategoria[categoria] ?? 0) -
          (b.impactosPorCategoria[categoria] ?? 0),
      );
    }
    return result.sort((a, b) => a.impactoTotalMedio - b.impactoTotalMedio);
  }

  private async computeEvolucionTemporal(): Promise<
    EvolucionTemporalItemDto[]
  > {
    const allCultivos = (await this.prisma.cultivo.findMany({})) as {
      idResultadoImpacto: string | null;
      fechaInicioCampania: Date;
    }[];

    const allImpactoIds = [
      ...new Set(
        allCultivos
          .filter((c) => c.idResultadoImpacto)
          .map((c) => c.idResultadoImpacto!),
      ),
    ];

    const allImpactos =
      allImpactoIds.length > 0
        ? ((await this.prisma.resultadoImpacto.findMany({
            where: { id: { in: allImpactoIds } },
          })) as unknown as ImpactoRecord[])
        : [];

    const impactoMap = new Map<string, ImpactoRecord['datos']>();
    for (const imp of allImpactos) {
      impactoMap.set(imp.id, imp.datos);
    }

    const cultivosByYear = new Map<number, number>();
    const categoriesByYear = new Map<number, Record<string, number>[]>();

    for (const c of allCultivos) {
      const year = c.fechaInicioCampania.getFullYear();
      cultivosByYear.set(year, (cultivosByYear.get(year) ?? 0) + 1);

      if (c.idResultadoImpacto && impactoMap.has(c.idResultadoImpacto)) {
        const catAmounts = getCategoryAmounts(
          impactoMap.get(c.idResultadoImpacto)!,
        );
        if (!categoriesByYear.has(year)) {
          categoriesByYear.set(year, []);
        }
        categoriesByYear.get(year)!.push(catAmounts);
      }
    }

    const result: EvolucionTemporalItemDto[] = [];

    for (const [year, records] of categoriesByYear) {
      const categorias = meanCategories(records) as Record<
        EfCategoryId,
        number
      >;
      const totalImpacto = round(
        Object.values(categorias).reduce((a, b) => a + b, 0),
      );

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
