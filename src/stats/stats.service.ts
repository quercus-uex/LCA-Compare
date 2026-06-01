import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getGlobalStats(anio?: number): Promise<GlobalStatsDto> {
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

    const impactoMap = new Map<string, number>();
    for (const imp of impactos) {
      const total = (imp.datos?.impacto_total ?? []).reduce(
        (sum, item) => sum + (item.amount ?? 0),
        0,
      );
      impactoMap.set(imp.id, total);
    }

    const [
      kpis,
      rankingProvincias,
      rankingPoblaciones,
      evolucionTemporal,
      distribucionCultivos,
    ] = await Promise.all([
      this.computeKPIs(cultivos, impactoMap, anio),
      this.computeRankingProvincias(cultivos, impactoMap),
      this.computeRankingPoblaciones(cultivos, impactoMap),
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
    impactoMap: Map<string, number>,
    anio?: number,
  ): Promise<KpiDto> {
    const totalCultivos = cultivos.length;
    const parcelaIds = [...new Set(cultivos.map((c) => c.idParcela))];
    const totalParcelas = parcelaIds.length;

    const superficieTotal = cultivos.reduce(
      (sum, c) => sum + (c.superficieCultivada ?? 0),
      0,
    );
    const consumoAguaMedio =
      totalCultivos > 0
        ? cultivos.reduce((sum, c) => sum + (c.consumoAgua ?? 0), 0) /
          totalCultivos
        : 0;
    const produccionMedia =
      totalCultivos > 0
        ? cultivos.reduce((sum, c) => sum + (c.produccion ?? 0), 0) /
          totalCultivos
        : 0;

    const impactValues = cultivos
      .filter(
        (c) => c.idResultadoImpacto && impactoMap.has(c.idResultadoImpacto),
      )
      .map((c) => impactoMap.get(c.idResultadoImpacto!)!);

    const impactoTotalMedio =
      impactValues.length > 0
        ? impactValues.reduce((a, b) => a + b, 0) / impactValues.length
        : 0;

    let variacionInteranual: number | null = null;
    if (anio && impactoTotalMedio > 0) {
      const prevFilter = {
        fechaInicioCampania: {
          gte: new Date(`${anio - 1}-01-01T00:00:00.000Z`),
          lt: new Date(`${anio}-01-01T00:00:00.000Z`),
        },
      };
      const prevCultivos = (await this.prisma.cultivo.findMany({
        where: prevFilter,
        include: {
          parcela: {
            include: {
              poblacion: { include: { provincia: true } },
            },
          },
        },
      })) as CultivoWithGeo[];

      const prevImpactoIds = [
        ...new Set(
          prevCultivos
            .filter((c) => c.idResultadoImpacto)
            .map((c) => c.idResultadoImpacto!),
        ),
      ];
      const prevImpactos =
        prevImpactoIds.length > 0
          ? ((await this.prisma.resultadoImpacto.findMany({
              where: { id: { in: prevImpactoIds } },
            })) as unknown as ImpactoRecord[])
          : [];

      const prevImpactoMap = new Map<string, number>();
      for (const imp of prevImpactos) {
        const total = (imp.datos?.impacto_total ?? []).reduce(
          (sum, item) => sum + (item.amount ?? 0),
          0,
        );
        prevImpactoMap.set(imp.id, total);
      }

      const prevValues = prevCultivos
        .filter(
          (c) =>
            c.idResultadoImpacto && prevImpactoMap.has(c.idResultadoImpacto),
        )
        .map((c) => prevImpactoMap.get(c.idResultadoImpacto!)!);

      const prevImpactoMedio =
        prevValues.length > 0
          ? prevValues.reduce((a, b) => a + b, 0) / prevValues.length
          : 0;

      if (prevImpactoMedio > 0) {
        variacionInteranual =
          ((impactoTotalMedio - prevImpactoMedio) / prevImpactoMedio) * 100;
      }
    }

    return {
      totalParcelas,
      totalCultivos,
      superficieTotal: Math.round(superficieTotal * 100) / 100,
      consumoAguaMedio: Math.round(consumoAguaMedio * 100) / 100,
      produccionMedia: Math.round(produccionMedia * 100) / 100,
      impactoTotalMedio: Math.round(impactoTotalMedio * 100) / 100,
      variacionInteranual:
        variacionInteranual !== null
          ? Math.round(variacionInteranual * 100) / 100
          : null,
    };
  }

  private computeRankingProvincias(
    cultivos: CultivoWithGeo[],
    impactoMap: Map<string, number>,
  ): ProvinciaRankingItemDto[] {
    const grouped = new Map<
      string,
      {
        nombreProvincia: string;
        parcelaIds: Set<string>;
        cultivos: CultivoWithGeo[];
        impactValues: number[];
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
          impactValues: [],
        };
        grouped.set(provincia.id, entry);
      }

      entry.parcelaIds.add(c.idParcela);
      entry.cultivos.push(c);

      if (c.idResultadoImpacto && impactoMap.has(c.idResultadoImpacto)) {
        entry.impactValues.push(impactoMap.get(c.idResultadoImpacto)!);
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
      const impactoTotalMedio =
        entry.impactValues.length > 0
          ? entry.impactValues.reduce((a, b) => a + b, 0) /
            entry.impactValues.length
          : 0;
      const eficiencia =
        consumoAguaMedio > 0 ? produccionMedia / consumoAguaMedio : 0;

      result.push({
        idProvincia,
        nombreProvincia: entry.nombreProvincia,
        numParcelas: entry.parcelaIds.size,
        numCultivos,
        superficieTotal: Math.round(superficieTotal * 100) / 100,
        produccionMedia: Math.round(produccionMedia * 100) / 100,
        consumoAguaMedio: Math.round(consumoAguaMedio * 100) / 100,
        impactoTotalMedio: Math.round(impactoTotalMedio * 100) / 100,
        eficiencia: Math.round(eficiencia * 10000) / 10000,
      });
    }

    return result.sort((a, b) => a.impactoTotalMedio - b.impactoTotalMedio);
  }

  private computeRankingPoblaciones(
    cultivos: CultivoWithGeo[],
    impactoMap: Map<string, number>,
  ): PoblacionRankingItemDto[] {
    const grouped = new Map<
      string,
      {
        nombrePoblacion: string;
        nombreProvincia: string;
        parcelaIds: Set<string>;
        impactValues: number[];
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
          impactValues: [],
        };
        grouped.set(poblacion.id, entry);
      }

      entry.parcelaIds.add(c.idParcela);

      if (c.idResultadoImpacto && impactoMap.has(c.idResultadoImpacto)) {
        entry.impactValues.push(impactoMap.get(c.idResultadoImpacto)!);
      }
    }

    const result: PoblacionRankingItemDto[] = [];

    for (const [idPoblacion, entry] of grouped) {
      const impactoTotalMedio =
        entry.impactValues.length > 0
          ? entry.impactValues.reduce((a, b) => a + b, 0) /
            entry.impactValues.length
          : 0;

      result.push({
        idPoblacion,
        nombrePoblacion: entry.nombrePoblacion,
        nombreProvincia: entry.nombreProvincia,
        numParcelas: entry.parcelaIds.size,
        impactoTotalMedio: Math.round(impactoTotalMedio * 100) / 100,
      });
    }

    return result.sort((a, b) => a.impactoTotalMedio - b.impactoTotalMedio);
  }

  private async computeEvolucionTemporal(): Promise<
    EvolucionTemporalItemDto[]
  > {
    const allCultivos = (await this.prisma.cultivo.findMany({
      include: {
        parcela: {
          include: {
            poblacion: { include: { provincia: true } },
          },
        },
      },
    })) as CultivoWithGeo[];

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

    const impactoMap = new Map<
      string,
      Record<
        string,
        Array<{ category: string; amount: number; unit: string }>
      >[]
    >();

    for (const c of allCultivos) {
      if (!c.idResultadoImpacto) continue;
      const imp = allImpactos.find((i) => i.id === c.idResultadoImpacto);
      if (!imp) continue;

      const year = c.fechaInicioCampania.getFullYear();
      const key = year.toString();
      if (!impactoMap.has(key)) {
        impactoMap.set(key, []);
      }
      impactoMap.get(key)!.push(imp.datos);
    }

    const cultivosByYear = new Map<number, number>();
    for (const c of allCultivos) {
      const year = c.fechaInicioCampania.getFullYear();
      cultivosByYear.set(year, (cultivosByYear.get(year) ?? 0) + 1);
    }

    const result: EvolucionTemporalItemDto[] = [];

    for (const [yearStr, impactos] of impactoMap) {
      const anio = parseInt(yearStr);

      const meanForKey = (key: string): number => {
        const allValues: number[] = [];
        for (const datos of impactos) {
          const items = datos?.[key];
          if (!items) continue;
          for (const item of items) {
            allValues.push(item.amount ?? 0);
          }
        }
        if (allValues.length === 0) return 0;
        const sum = allValues.reduce((a, b) => a + b, 0);
        return sum / allValues.length;
      };

      result.push({
        anio,
        impactoFertilizantes:
          Math.round(meanForKey('impacto_fertilizantes') * 100) / 100,
        impactoManejoCultivo:
          Math.round(meanForKey('impacto_manejo_cultivo') * 100) / 100,
        impactoPesticidas:
          Math.round(meanForKey('impacto_pesticidas') * 100) / 100,
        impactoSistemaRiego:
          Math.round(meanForKey('impacto_sistema_riego') * 100) / 100,
        impactoTotal: Math.round(meanForKey('impacto_total') * 100) / 100,
        numCultivos: cultivosByYear.get(anio) ?? 0,
      });
    }

    return result.sort((a, b) => a.anio - b.anio);
  }

  private async computeDistribucionCultivos(
    yearFilter: Record<string, unknown>,
  ): Promise<DistribucionCultivoItemDto[]> {
    const result = await this.prisma.cultivo.groupBy({
      by: ['tipo'],
      where: Object.keys(yearFilter).length > 0 ? yearFilter : undefined,
      _count: { id: true },
      _sum: { superficieCultivada: true },
    });

    return result.map((r) => ({
      tipo: r.tipo,
      count: r._count.id,
      superficieTotal:
        Math.round((r._sum.superficieCultivada ?? 0) * 100) / 100,
    }));
  }
}
