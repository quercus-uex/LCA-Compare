import { STATS_DATASET_TTL_MS, StatsService } from './stats.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { StatsCultivo } from './helpers/stats-rows.helpers';

const BADAJOZ = { id: 'prov-ba', nombre: 'Badajoz' };
const CACERES = { id: 'prov-cc', nombre: 'Cáceres' };

function makeCultivo(
  overrides: Partial<{
    idParcela: string;
    tipo: string;
    anio: number;
    climateChange: number | null;
    poblacion: { id: string; nombre: string };
    provincia: { id: string; nombre: string };
  }> = {},
): StatsCultivo {
  const climateChange =
    overrides.climateChange === undefined ? 10 : overrides.climateChange;
  return {
    idParcela: overrides.idParcela ?? 'par-1',
    tipo: overrides.tipo ?? 'trigo',
    fechaInicioCampania: new Date(Date.UTC(overrides.anio ?? 2024, 2, 1)),
    superficieCultivada: 10,
    produccion: 1000,
    consumoAgua: 500,
    resultadoImpacto:
      climateChange === null
        ? null
        : {
            datos: {
              impacto_total: [
                { category: 'Climate change', amount: climateChange },
              ],
            },
          },
    parcela: {
      poblacion: {
        ...(overrides.poblacion ?? { id: 'pob-db', nombre: 'Don Benito' }),
        provincia: overrides.provincia ?? BADAJOZ,
      },
    },
  };
}

/** Tres parcelas con impacto: lo justo para aparecer en los rankings */
function zona(
  prefix: string,
  overrides: Parameters<typeof makeCultivo>[0] = {},
): StatsCultivo[] {
  return [0, 1, 2].map((i) =>
    makeCultivo({ ...overrides, idParcela: `${prefix}-${i}` }),
  );
}

describe('StatsService', () => {
  let service: StatsService;
  let findMany: jest.Mock<Promise<StatsCultivo[]>, [Record<string, unknown>]>;

  const mockDataset = (cultivos: StatsCultivo[]) =>
    findMany.mockResolvedValue(cultivos);

  beforeEach(() => {
    findMany = jest.fn<Promise<StatsCultivo[]>, [Record<string, unknown>]>();
    findMany.mockResolvedValue([]);
    service = new StatsService({
      cultivo: { findMany },
    } as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getGlobalStats', () => {
    it('returns an empty response when there is no data', async () => {
      const result = await service.getGlobalStats();

      expect(result).toMatchObject({
        kpis: {
          totalParcelas: 0,
          totalCultivos: 0,
          cultivosConImpacto: 0,
          superficieTotal: 0,
          variacionInteranual: null,
        },
        rankingProvincias: [],
        rankingPoblaciones: [],
        zonasOcultas: { provincias: 0, poblaciones: 0 },
        evolucionTemporal: [],
        distribucionCultivos: [],
        aniosDisponibles: [],
        tiposCultivoDisponibles: [],
      });
    });

    it('loads the dataset with a single select query', async () => {
      await service.getGlobalStats();

      expect(findMany).toHaveBeenCalledTimes(1);
      const [args] = findMany.mock.calls[0];
      expect(args).not.toHaveProperty('where');
      expect(args).not.toHaveProperty('include');
      expect(args).toHaveProperty('select.resultadoImpacto');
      expect(args).toHaveProperty('select.parcela.select.poblacion');
    });

    it('applies year and crop filters to KPIs and rankings', async () => {
      mockDataset([
        ...zona('a', { anio: 2024, tipo: 'trigo' }),
        ...zona('b', { anio: 2023, tipo: 'trigo' }),
        ...zona('c', { anio: 2024, tipo: 'maiz' }),
      ]);

      const result = await service.getGlobalStats({
        anio: 2024,
        tipoCultivo: 'trigo',
      });

      expect(result.kpis.totalCultivos).toBe(3);
      expect(result.rankingProvincias[0].numCultivos).toBe(3);
      expect(result.rankingPoblaciones[0].numCultivos).toBe(3);
    });

    it('applies only the crop filter to the timeline', async () => {
      mockDataset([
        ...zona('a', { anio: 2023, tipo: 'trigo' }),
        ...zona('b', { anio: 2024, tipo: 'trigo' }),
        ...zona('c', { anio: 2024, tipo: 'maiz' }),
      ]);

      const { evolucionTemporal } = await service.getGlobalStats({
        anio: 2024,
        tipoCultivo: 'trigo',
      });

      expect(evolucionTemporal.map((e) => [e.anio, e.numCultivos])).toEqual([
        [2023, 3],
        [2024, 3],
      ]);
    });

    it('applies only the year filter to the crop distribution', async () => {
      mockDataset([
        ...zona('a', { anio: 2024, tipo: 'trigo' }),
        ...zona('b', { anio: 2023, tipo: 'trigo' }),
        makeCultivo({ idParcela: 'c', anio: 2024, tipo: 'maiz' }),
      ]);

      const { distribucionCultivos } = await service.getGlobalStats({
        anio: 2024,
        tipoCultivo: 'trigo',
      });

      expect(distribucionCultivos).toEqual([
        { tipo: 'trigo', count: 3, superficieTotal: 30 },
        { tipo: 'maiz', count: 1, superficieTotal: 10 },
      ]);
    });

    it('lists available years and crop types from the whole dataset', async () => {
      mockDataset([
        makeCultivo({ anio: 2024, tipo: 'trigo' }),
        makeCultivo({ anio: 2022, tipo: 'maiz' }),
        makeCultivo({ anio: 2024, tipo: 'olivo' }),
      ]);

      const result = await service.getGlobalStats({
        anio: 2022,
        tipoCultivo: 'maiz',
      });

      expect(result.aniosDisponibles).toEqual([2022, 2024]);
      expect(result.tiposCultivoDisponibles).toEqual([
        'maiz',
        'olivo',
        'trigo',
      ]);
    });

    it('hides zones below the plot minimum and reports how many', async () => {
      mockDataset([
        ...zona('a'),
        makeCultivo({
          idParcela: 'solitaria',
          poblacion: { id: 'pob-co', nombre: 'Coria' },
          provincia: CACERES,
        }),
      ]);

      const result = await service.getGlobalStats();

      expect(result.rankingProvincias.map((r) => r.idProvincia)).toEqual([
        'prov-ba',
      ]);
      expect(result.rankingPoblaciones.map((r) => r.idPoblacion)).toEqual([
        'pob-db',
      ]);
      expect(result.zonasOcultas).toEqual({ provincias: 1, poblaciones: 1 });
      // Los KPIs sí incluyen las zonas ocultas
      expect(result.kpis.totalParcelas).toBe(4);
    });

    it('compares against the previous year with the same crop filter', async () => {
      mockDataset([
        ...zona('a', { anio: 2024, climateChange: 90 }),
        ...zona('a', { anio: 2023, climateChange: 100 }),
        // Mismas parcelas con otro cultivo: el filtro las deja fuera
        ...zona('a', { anio: 2023, tipo: 'maiz', climateChange: 1 }),
      ]);

      const { kpis } = await service.getGlobalStats({
        anio: 2024,
        tipoCultivo: 'trigo',
      });

      expect(kpis.parcelasComparables).toBe(3);
      expect(kpis.variacionInteranual?.climate_change).toBe(-10);
      expect(kpis.variacionInteranual?.acidification).toBeNull();
    });

    it('returns a null year-on-year change without a selected year', async () => {
      mockDataset([...zona('a', { anio: 2024 }), ...zona('b', { anio: 2023 })]);

      const { kpis } = await service.getGlobalStats();

      expect(kpis.variacionInteranual).toBeNull();
    });
  });

  describe('dataset cache', () => {
    it('reuses the dataset within the TTL and reloads after it', async () => {
      jest.useFakeTimers();

      await service.getGlobalStats();
      await service.getGlobalStats({ anio: 2024 });
      expect(findMany).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(STATS_DATASET_TTL_MS);
      await service.getGlobalStats();
      expect(findMany).toHaveBeenCalledTimes(2);
    });

    it('shares a single load between concurrent requests', async () => {
      await Promise.all([
        service.getGlobalStats(),
        service.getGlobalStats({ anio: 2024 }),
        service.getGlobalStats({ tipoCultivo: 'trigo' }),
      ]);

      expect(findMany).toHaveBeenCalledTimes(1);
    });

    it('does not cache a failed load', async () => {
      findMany.mockRejectedValueOnce(new Error('db down'));

      await expect(service.getGlobalStats()).rejects.toThrow('db down');
      await expect(service.getGlobalStats()).resolves.toBeDefined();
      expect(findMany).toHaveBeenCalledTimes(2);
    });

    it('reloads after invalidateCache', async () => {
      await service.getGlobalStats();
      service.invalidateCache();
      await service.getGlobalStats();

      expect(findMany).toHaveBeenCalledTimes(2);
    });

    it('does not store a load that was in flight when the cache was invalidated', async () => {
      let resolveStale: (value: StatsCultivo[]) => void = () => undefined;
      findMany.mockReturnValueOnce(
        new Promise<StatsCultivo[]>((resolve) => {
          resolveStale = resolve;
        }),
      );

      const stale = service.getGlobalStats();
      service.invalidateCache();
      mockDataset(zona('nuevo'));
      const fresh = await service.getGlobalStats();
      resolveStale([]);
      await stale;

      expect(fresh.kpis.totalCultivos).toBe(3);
      expect((await service.getGlobalStats()).kpis.totalCultivos).toBe(3);
      expect(findMany).toHaveBeenCalledTimes(2);
    });
  });
});
