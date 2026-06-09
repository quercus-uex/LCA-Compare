import { StatsService } from './stats.service';
import type { PrismaService } from '../prisma/prisma.service';

type FindManyArgs = {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
};

function makeCultivo(
  overrides?: Partial<{
    id: string;
    superficieCultivada: number;
    produccion: number;
    consumoAgua: number;
    tipo: string;
    idParcela: string;
    idResultadoImpacto: string | null;
    fechaInicioCampania: Date;
    parcela: any;
  }>,
): any {
  return {
    id: overrides?.id ?? 'cult-1',
    superficieCultivada: overrides?.superficieCultivada ?? 10,
    produccion: overrides?.produccion ?? 100,
    consumoAgua: overrides?.consumoAgua ?? 50,
    ciclo: 1,
    tipo: overrides?.tipo ?? 'trigo',
    idParcela: overrides?.idParcela ?? 'par-1',
    idResultadoImpacto: overrides?.idResultadoImpacto ?? 'ri-1',
    fechaInicioCampania:
      overrides?.fechaInicioCampania ?? new Date('2024-01-01'),
    parcela: overrides?.parcela ?? {
      id: 'par-1',
      idPoblacion: 'pop-1',
      poblacion: {
        id: 'pop-1',
        nombre: 'Madrid',
        provincia: { id: 'prov-1', nombre: 'Madrid' },
      },
    },
  };
}

function makeImpactRecord(
  id: string,
  climateChangeAmount: number,
): { id: string; datos: Record<string, unknown> } {
  return {
    id,
    datos: {
      impacto_total: [
        {
          category: 'Climate change',
          amount: climateChangeAmount,
          unit: 'kg CO2 eq',
        },
      ],
    },
  };
}

describe('StatsService', () => {
  let service: StatsService;
  let prisma: jest.Mocked<{
    cultivo: {
      findMany: jest.Mock;
      groupBy: jest.Mock;
    };
    resultadoImpacto: {
      findMany: jest.Mock;
    };
  }>;

  beforeEach(() => {
    prisma = {
      cultivo: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      resultadoImpacto: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new StatsService(prisma as unknown as PrismaService);
  });

  describe('getGlobalStats', () => {
    it('returns zero KPIs, empty rankings, temporal evolution, crop distribution, and available years for empty data', async () => {
      const result = await service.getGlobalStats();

      expect(result.kpis).toEqual({
        totalParcelas: 0,
        totalCultivos: 0,
        superficieTotal: 0,
        impactosPorCategoria: expect.objectContaining({
          climate_change: 0,
          acidification: 0,
        }),
        variacionInteranual: null,
      });
      expect(result.rankingProvincias).toEqual([]);
      expect(result.rankingPoblaciones).toEqual([]);
      expect(result.evolucionTemporal).toEqual([]);
      expect(result.distribucionCultivos).toEqual([]);
      expect(result.aniosDisponibles).toEqual([]);
    });

    it('queries cultivations using campaign-year range and crop type filter', async () => {
      await service.getGlobalStats(2024, undefined, 'trigo');

      expect(prisma.cultivo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo: 'trigo',
            fechaInicioCampania: expect.objectContaining({
              gte: new Date('2024-01-01T00:00:00.000Z'),
              lt: new Date('2025-01-01T00:00:00.000Z'),
            }),
          }),
        }),
      );
    });

    it('computes KPIs, rankings, crop distribution, and available years from mocked data', async () => {
      const cultivo = makeCultivo();
      prisma.cultivo.findMany.mockImplementation((args: FindManyArgs) => {
        if (args?.where?.fechaInicioCampania) return Promise.resolve([cultivo]);
        return Promise.resolve([
          { fechaInicioCampania: new Date('2024-06-01') },
        ]);
      });
      prisma.resultadoImpacto.findMany.mockResolvedValue([
        makeImpactRecord('ri-1', 50),
      ]);
      prisma.cultivo.groupBy.mockResolvedValue([
        { tipo: 'trigo', _count: { id: 1 }, _sum: { superficieCultivada: 10 } },
      ]);

      const result = await service.getGlobalStats(2024);

      expect(result.kpis.totalCultivos).toBe(1);
      expect(result.kpis.totalParcelas).toBe(1);
      expect(result.kpis.superficieTotal).toBe(10);
      expect(result.rankingProvincias).toHaveLength(1);
      expect(result.rankingProvincias[0].nombreProvincia).toBe('Madrid');
      expect(result.distribucionCultivos).toHaveLength(1);
      expect(result.distribucionCultivos[0].tipo).toBe('trigo');
      expect(result.aniosDisponibles).toEqual([2024]);
    });

    it('skips current impact lookup when selected cultivations have no impact result ids', async () => {
      const cultivoSinImpacto = makeCultivo({ idResultadoImpacto: null });
      prisma.cultivo.findMany.mockImplementation((args: FindManyArgs) => {
        if (args?.where?.fechaInicioCampania)
          return Promise.resolve([cultivoSinImpacto]);
        return Promise.resolve([]);
      });

      const result = await service.getGlobalStats(2024);

      expect(result.kpis.totalCultivos).toBe(1);
      expect(result.kpis.impactosPorCategoria.climate_change).toBe(0);
    });

    it('aggregates province ranking with parcel count, crop count, surface, production, water, impacts, and efficiency', async () => {
      const cultivo1 = makeCultivo({
        id: 'c1',
        idParcela: 'par-1',
        superficieCultivada: 10,
        produccion: 100,
        consumoAgua: 50,
        idResultadoImpacto: 'ri-1',
        parcela: {
          id: 'par-1',
          idPoblacion: 'pop-1',
          poblacion: {
            id: 'pop-1',
            nombre: 'Madrid',
            provincia: { id: 'prov-1', nombre: 'Madrid' },
          },
        },
      });
      const cultivo2 = makeCultivo({
        id: 'c2',
        idParcela: 'par-2',
        superficieCultivada: 20,
        produccion: 200,
        consumoAgua: 100,
        idResultadoImpacto: 'ri-2',
        parcela: {
          id: 'par-2',
          idPoblacion: 'pop-2',
          poblacion: {
            id: 'pop-2',
            nombre: 'Barcelona',
            provincia: { id: 'prov-2', nombre: 'Cataluna' },
          },
        },
      });

      prisma.cultivo.findMany.mockResolvedValue([cultivo1, cultivo2]);
      prisma.resultadoImpacto.findMany.mockResolvedValue([
        makeImpactRecord('ri-1', 30),
        makeImpactRecord('ri-2', 60),
      ]);

      const result = await service.getGlobalStats();

      expect(result.rankingProvincias).toHaveLength(2);
      const sorted = result.rankingProvincias;
      expect(sorted[0].numParcelas).toBeGreaterThanOrEqual(1);
      expect(sorted[0].superficieTotal).toBeGreaterThan(0);
    });

    it('filters population ranking by idProvinciaPoblacion', async () => {
      const cultivoProv1 = makeCultivo({
        id: 'c1',
        idResultadoImpacto: 'ri-1',
        parcela: {
          id: 'par-1',
          idPoblacion: 'pop-1',
          poblacion: {
            id: 'pop-1',
            nombre: 'Madrid',
            provincia: { id: 'prov-1', nombre: 'Madrid' },
          },
        },
      });
      const cultivoProv2 = makeCultivo({
        id: 'c2',
        idResultadoImpacto: 'ri-2',
        parcela: {
          id: 'par-2',
          idPoblacion: 'pop-2',
          poblacion: {
            id: 'pop-2',
            nombre: 'Barcelona',
            provincia: { id: 'prov-2', nombre: 'Cataluna' },
          },
        },
      });

      prisma.cultivo.findMany.mockResolvedValue([cultivoProv1, cultivoProv2]);
      prisma.resultadoImpacto.findMany.mockResolvedValue([
        makeImpactRecord('ri-1', 30),
        makeImpactRecord('ri-2', 60),
      ]);

      const result = await service.getGlobalStats(
        undefined,
        undefined,
        undefined,
        'prov-1',
      );

      expect(result.rankingPoblaciones).toHaveLength(1);
      expect(result.rankingPoblaciones[0].nombreProvincia).toBe('Madrid');
    });

    it('sorts province ranking by specific EF category when categoria is provided', async () => {
      const cultivo1 = makeCultivo({
        id: 'c1',
        idResultadoImpacto: 'ri-1',
        parcela: {
          id: 'par-1',
          idPoblacion: 'pop-1',
          poblacion: {
            id: 'pop-1',
            nombre: 'A',
            provincia: { id: 'prov-1', nombre: 'ProvA' },
          },
        },
      });
      const cultivo2 = makeCultivo({
        id: 'c2',
        idResultadoImpacto: 'ri-2',
        parcela: {
          id: 'par-2',
          idPoblacion: 'pop-2',
          poblacion: {
            id: 'pop-2',
            nombre: 'B',
            provincia: { id: 'prov-2', nombre: 'ProvB' },
          },
        },
      });

      prisma.cultivo.findMany.mockResolvedValue([cultivo1, cultivo2]);
      prisma.resultadoImpacto.findMany.mockResolvedValue([
        makeImpactRecord('ri-1', 10),
        makeImpactRecord('ri-2', 50),
      ]);

      const result = await service.getGlobalStats(undefined, 'climate_change');

      expect(result.rankingProvincias[0].nombreProvincia).toBe('ProvA');
      expect(result.rankingProvincias[1].nombreProvincia).toBe('ProvB');
    });

    it('computes temporal evolution from all cultivations independently of selected-year filter', async () => {
      const cultivo2024 = makeCultivo({
        id: 'c1',
        idResultadoImpacto: 'ri-1',
        fechaInicioCampania: new Date('2024-01-01'),
      });
      const cultivo2023 = makeCultivo({
        id: 'c2',
        idResultadoImpacto: 'ri-2',
        fechaInicioCampania: new Date('2023-01-01'),
      });

      prisma.cultivo.findMany.mockImplementation((args: FindManyArgs) => {
        if (args?.where?.fechaInicioCampania)
          return Promise.resolve([cultivo2024]);
        return Promise.resolve([cultivo2024, cultivo2023]);
      });
      prisma.resultadoImpacto.findMany.mockResolvedValue([
        makeImpactRecord('ri-1', 50),
        makeImpactRecord('ri-2', 30),
      ]);

      const result = await service.getGlobalStats(2024);

      expect(result.evolucionTemporal).toHaveLength(2);
      const years = result.evolucionTemporal.map((e) => e.anio);
      expect(years).toContain(2023);
      expect(years).toContain(2024);
    });

    it('returns rounded interannual variation when previous-year impact data exists', async () => {
      const cultivoCurrent = makeCultivo({
        id: 'c1',
        idResultadoImpacto: 'ri-current',
        fechaInicioCampania: new Date('2024-06-01'),
      });
      const cultivoPrev = makeCultivo({
        id: 'c2',
        idResultadoImpacto: 'ri-prev',
        fechaInicioCampania: new Date('2023-06-01'),
      });

      prisma.cultivo.findMany.mockImplementation((args: FindManyArgs) => {
        if (args?.where?.fechaInicioCampania) {
          const gte = args.where.fechaInicioCampania.gte as Date;
          if (gte.getFullYear() === 2023) return Promise.resolve([cultivoPrev]);
          return Promise.resolve([cultivoCurrent]);
        }
        return Promise.resolve([cultivoCurrent, cultivoPrev]);
      });
      prisma.resultadoImpacto.findMany.mockImplementation(
        (args: FindManyArgs) => {
          const ids = (args?.where?.id as { in?: string[] })?.in ?? [];
          const result: Array<{ id: string; datos: Record<string, unknown> }> =
            [];
          if (ids.includes('ri-current'))
            result.push(makeImpactRecord('ri-current', 120));
          if (ids.includes('ri-prev'))
            result.push(makeImpactRecord('ri-prev', 100));
          return Promise.resolve(result);
        },
      );

      const result = await service.getGlobalStats(2024);

      expect(result.kpis.variacionInteranual).toBe(20);
    });

    it('returns null interannual variation when previous year has no impact data', async () => {
      const cultivoCurrent = makeCultivo({
        id: 'c1',
        idResultadoImpacto: 'ri-current',
        fechaInicioCampania: new Date('2024-06-01'),
      });

      prisma.cultivo.findMany.mockImplementation((args: FindManyArgs) => {
        if (args?.where?.fechaInicioCampania) {
          const gte = args.where.fechaInicioCampania.gte as Date;
          if (gte.getFullYear() === 2023) return Promise.resolve([]);
          return Promise.resolve([cultivoCurrent]);
        }
        return Promise.resolve([cultivoCurrent]);
      });
      prisma.resultadoImpacto.findMany.mockImplementation(
        (args: FindManyArgs) => {
          const ids = (args?.where?.id as { in?: string[] })?.in ?? [];
          if (ids.includes('ri-current'))
            return Promise.resolve([makeImpactRecord('ri-current', 50)]);
          return Promise.resolve([]);
        },
      );

      const result = await service.getGlobalStats(2024);

      expect(result.kpis.variacionInteranual).toBeNull();
    });

    it('applies crop filter to previous-year lookup and returns null when previous impact is zero', async () => {
      const cultivoCurrent = makeCultivo({
        id: 'c1',
        idResultadoImpacto: 'ri-current',
        fechaInicioCampania: new Date('2024-06-01'),
      });
      const cultivoPrev = makeCultivo({
        id: 'c2',
        idResultadoImpacto: 'ri-prev',
        fechaInicioCampania: new Date('2023-06-01'),
      });

      prisma.cultivo.findMany.mockImplementation((args: FindManyArgs) => {
        if (args?.where?.fechaInicioCampania) {
          const gte = args.where.fechaInicioCampania.gte as Date;
          if (gte.getFullYear() === 2023) return Promise.resolve([cultivoPrev]);
          return Promise.resolve([cultivoCurrent]);
        }
        return Promise.resolve([cultivoCurrent, cultivoPrev]);
      });
      prisma.resultadoImpacto.findMany.mockImplementation(
        (args: FindManyArgs) => {
          const ids = (args?.where?.id as { in?: string[] })?.in ?? [];
          if (ids.includes('ri-current')) {
            return Promise.resolve([makeImpactRecord('ri-current', 50)]);
          }
          if (ids.includes('ri-prev')) {
            return Promise.resolve([makeImpactRecord('ri-prev', 0)]);
          }
          return Promise.resolve([]);
        },
      );

      const result = await service.getGlobalStats(2024, undefined, 'trigo');

      expect(result.kpis.variacionInteranual).toBeNull();
      expect(prisma.cultivo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo: 'trigo',
            fechaInicioCampania: expect.objectContaining({
              gte: new Date('2023-01-01T00:00:00.000Z'),
              lt: new Date('2024-01-01T00:00:00.000Z'),
            }),
          }),
        }),
      );
    });

    it('skips records without population for rankings and preserves population entries without province names', async () => {
      const cultivoWithoutPopulation = makeCultivo({
        id: 'c1',
        idResultadoImpacto: 'ri-1',
        parcela: { id: 'par-1', idPoblacion: null, poblacion: null },
      });
      const cultivoWithoutProvince = makeCultivo({
        id: 'c2',
        idParcela: 'par-2',
        idResultadoImpacto: 'ri-2',
        parcela: {
          id: 'par-2',
          idPoblacion: 'pop-2',
          poblacion: { id: 'pop-2', nombre: 'Sin provincia', provincia: null },
        },
      });

      prisma.cultivo.findMany.mockResolvedValue([
        cultivoWithoutPopulation,
        cultivoWithoutProvince,
      ]);
      prisma.resultadoImpacto.findMany.mockResolvedValue([
        makeImpactRecord('ri-1', 10),
        makeImpactRecord('ri-2', 20),
      ]);

      const result = await service.getGlobalStats();

      expect(result.rankingProvincias).toEqual([]);
      expect(result.rankingPoblaciones).toEqual([
        expect.objectContaining({
          nombrePoblacion: 'Sin provincia',
          nombreProvincia: '',
          numParcelas: 1,
        }),
      ]);
    });
  });
});
