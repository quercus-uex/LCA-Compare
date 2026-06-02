import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service';
import { EF_CATEGORIES } from '../compare/compare.types';

describe('StatsService', () => {
  let service: StatsService;

  const mockPrisma = {
    cultivo: {
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    resultadoImpacto: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    mockPrisma.cultivo.findMany.mockReset().mockResolvedValue([]);
    mockPrisma.cultivo.groupBy.mockReset().mockResolvedValue([]);
    mockPrisma.resultadoImpacto.findMany.mockReset().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  const makeImpacto = (overrides?: Record<string, number>) => {
    const datos: Record<
      string,
      Array<{ category: string; amount: number; unit: string }>
    > = {};
    const totalItems = EF_CATEGORIES.map((cat) => ({
      category: cat.englishNames[0],
      amount: overrides?.[cat.id] ?? 10,
      unit: cat.unit,
    }));
    datos['impacto_total'] = totalItems;
    return { id: `impacto-${Math.random()}`, datos };
  };

  const makeCultivo = (
    overrides?: Partial<{
      id: string;
      idParcela: string;
      idResultadoImpacto: string | null;
      superficieCultivada: number;
      produccion: number;
      consumoAgua: number;
      fecha: Date;
      provinciaNombre: string;
      provinciaId: string;
      poblacionId: string;
    }>,
  ) => ({
    id: overrides?.id ?? `cultivo-${Math.random()}`,
    idParcela: overrides?.idParcela ?? 'parcela-1',
    idResultadoImpacto: overrides?.idResultadoImpacto ?? null,
    superficieCultivada: overrides?.superficieCultivada ?? 100,
    produccion: overrides?.produccion ?? 50,
    consumoAgua: overrides?.consumoAgua ?? 200,
    ciclo: 1,
    tipo: 'trigo',
    fechaInicioCampania:
      overrides?.fecha ?? new Date('2024-01-15T00:00:00.000Z'),
    parcela: {
      id: overrides?.idParcela ?? 'parcela-1',
      idPoblacion: overrides?.poblacionId ?? 'poblacion-1',
      poblacion: {
        id: overrides?.poblacionId ?? 'poblacion-1',
        nombre: 'Poblacion Test',
        provincia: {
          id: overrides?.provinciaId ?? 'provincia-1',
          nombre: overrides?.provinciaNombre ?? 'Provincia Test',
        },
      },
    },
  });

  describe('getGlobalStats', () => {
    it('should return zero KPIs when no data exists', async () => {
      mockPrisma.cultivo.findMany.mockResolvedValue([]);

      const result = await service.getGlobalStats();
      expect(result.kpis.totalCultivos).toBe(0);
      expect(result.kpis.totalParcelas).toBe(0);
      for (const cat of EF_CATEGORIES) {
        expect(result.kpis.impactosPorCategoria[cat.id]).toBe(0);
      }
      expect(result.rankingProvincias).toEqual([]);
      expect(result.rankingPoblaciones).toEqual([]);
      expect(result.evolucionTemporal).toEqual([]);
    });

    it('should compute per-category impact means from impacto_total', async () => {
      const impacto = makeImpacto({ climate_change: 100, water_use: 50 });
      const cultivo = makeCultivo({ idResultadoImpacto: impacto.id });

      mockPrisma.cultivo.findMany.mockResolvedValue([cultivo]);
      mockPrisma.resultadoImpacto.findMany.mockResolvedValue([impacto]);

      const result = await service.getGlobalStats(2024);
      expect(result.kpis.impactosPorCategoria.climate_change).toBe(100);
      expect(result.kpis.impactosPorCategoria.water_use).toBe(50);
      expect(result.kpis.impactosPorCategoria.eutrophication).toBe(10);
    });

    it('should compute per-category means across multiple impactos', async () => {
      const imp1 = makeImpacto({ climate_change: 100 });
      const imp2 = makeImpacto({ climate_change: 200 });
      const c1 = makeCultivo({ id: 'c1', idResultadoImpacto: imp1.id });
      const c2 = makeCultivo({ id: 'c2', idResultadoImpacto: imp2.id });

      mockPrisma.cultivo.findMany.mockResolvedValue([c1, c2]);
      mockPrisma.resultadoImpacto.findMany.mockResolvedValue([imp1, imp2]);

      const result = await service.getGlobalStats(2024);
      expect(result.kpis.impactosPorCategoria.climate_change).toBe(150);
    });

    it('should rank provincias by total impact when no category filter', async () => {
      const imp1 = makeImpacto({ climate_change: 100, water_use: 10 });
      const imp2 = makeImpacto({ climate_change: 200, water_use: 20 });

      const c1 = makeCultivo({
        id: 'c1',
        idResultadoImpacto: imp1.id,
        provinciaNombre: 'Provincia Baja',
      });
      const c2 = makeCultivo({
        id: 'c2',
        idParcela: 'parcela-2',
        idResultadoImpacto: imp2.id,
        provinciaNombre: 'Provincia Alta',
        provinciaId: 'provincia-2',
        poblacionId: 'poblacion-2',
      });

      mockPrisma.cultivo.findMany.mockResolvedValue([c1, c2]);
      mockPrisma.resultadoImpacto.findMany.mockResolvedValue([imp1, imp2]);

      const result = await service.getGlobalStats(2024);
      expect(result.rankingProvincias).toHaveLength(2);
      expect(result.rankingProvincias[0].nombreProvincia).toBe(
        'Provincia Baja',
      );
      expect(result.rankingProvincias[1].nombreProvincia).toBe(
        'Provincia Alta',
      );
    });

    it('should rank provincias by selected EF category', async () => {
      const imp1 = makeImpacto({ climate_change: 100, water_use: 500 });
      const imp2 = makeImpacto({ climate_change: 200, water_use: 10 });

      const c1 = makeCultivo({
        id: 'c1',
        idResultadoImpacto: imp1.id,
        provinciaNombre: 'Provincia A',
      });
      const c2 = makeCultivo({
        id: 'c2',
        idParcela: 'parcela-2',
        idResultadoImpacto: imp2.id,
        provinciaNombre: 'Provincia B',
        provinciaId: 'provincia-2',
        poblacionId: 'poblacion-2',
      });

      mockPrisma.cultivo.findMany.mockResolvedValue([c1, c2]);
      mockPrisma.resultadoImpacto.findMany.mockResolvedValue([imp1, imp2]);

      const result = await service.getGlobalStats(2024, 'water_use');
      expect(result.rankingProvincias[0].nombreProvincia).toBe('Provincia B');
      expect(result.rankingProvincias[1].nombreProvincia).toBe('Provincia A');
    });

    it('should compute evolucionTemporal with category data per year', async () => {
      const imp2023 = makeImpacto({ climate_change: 50 });
      const imp2024 = makeImpacto({ climate_change: 100 });

      const c2023 = makeCultivo({
        id: 'c2023',
        idResultadoImpacto: imp2023.id,
        fecha: new Date('2023-06-01T00:00:00.000Z'),
      });
      const c2024 = makeCultivo({
        id: 'c2024',
        idResultadoImpacto: imp2024.id,
        fecha: new Date('2024-06-01T00:00:00.000Z'),
      });

      mockPrisma.cultivo.findMany
        .mockResolvedValueOnce([]) // main query — empty for KPIs
        .mockResolvedValueOnce([]) // available years
        .mockResolvedValueOnce([c2023, c2024]); // evolucionTemporal loads all

      mockPrisma.resultadoImpacto.findMany.mockResolvedValueOnce([
        imp2023,
        imp2024,
      ]);

      const result = await service.getGlobalStats();
      expect(result.evolucionTemporal).toHaveLength(2);
      expect(result.evolucionTemporal[0].anio).toBe(2023);
      expect(result.evolucionTemporal[0].categorias.climate_change).toBe(50);
      expect(result.evolucionTemporal[1].anio).toBe(2024);
      expect(result.evolucionTemporal[1].categorias.climate_change).toBe(100);
    });

    it('should handle unknown category names gracefully (treat as 0)', async () => {
      const impacto = {
        id: 'imp-1',
        datos: {
          impacto_total: [
            { category: 'Some unknown EF category', amount: 999, unit: 'x' },
          ],
        },
      };
      const cultivo = makeCultivo({ idResultadoImpacto: impacto.id });

      mockPrisma.cultivo.findMany.mockResolvedValue([cultivo]);
      mockPrisma.resultadoImpacto.findMany.mockResolvedValue([impacto]);

      const result = await service.getGlobalStats(2024);
      expect(result.kpis.impactosPorCategoria.climate_change).toBe(0);
    });

    it('should handle datos being null/undefined gracefully', async () => {
      const impacto = { id: 'imp-null', datos: null as unknown as undefined };
      const cultivo = makeCultivo({ idResultadoImpacto: impacto.id });

      mockPrisma.cultivo.findMany.mockResolvedValue([cultivo]);
      mockPrisma.resultadoImpacto.findMany.mockResolvedValue([impacto]);

      const result = await service.getGlobalStats(2024);
      for (const cat of EF_CATEGORIES) {
        expect(result.kpis.impactosPorCategoria[cat.id]).toBe(0);
      }
    });

    it('should compute available years with Prisma findMany', async () => {
      mockPrisma.cultivo.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { fechaInicioCampania: new Date('2023-01-01T00:00:00.000Z') },
          { fechaInicioCampania: new Date('2024-01-01T00:00:00.000Z') },
          { fechaInicioCampania: new Date('2024-06-01T00:00:00.000Z') },
        ]);

      const result = await service.getGlobalStats(
        undefined,
        undefined,
        'tomate',
      );

      expect(result.aniosDisponibles).toEqual([2023, 2024]);
      expect(mockPrisma.cultivo.findMany).toHaveBeenNthCalledWith(2, {
        where: { tipo: 'tomate' },
        select: { fechaInicioCampania: true },
        orderBy: { fechaInicioCampania: 'asc' },
      });
    });

    it('should treat quote-containing crop types as Prisma filter values', async () => {
      const tipoCultivo = "tomate 'raf'";
      mockPrisma.cultivo.findMany.mockResolvedValue([]);

      await service.getGlobalStats(undefined, undefined, tipoCultivo);

      expect(mockPrisma.cultivo.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ where: { tipo: tipoCultivo } }),
      );
      expect(mockPrisma.cultivo.findMany).toHaveBeenNthCalledWith(2, {
        where: { tipo: tipoCultivo },
        select: { fechaInicioCampania: true },
        orderBy: { fechaInicioCampania: 'asc' },
      });
    });
  });
});
