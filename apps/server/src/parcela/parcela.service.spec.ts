import { ParcelaService } from './parcela.service';

describe('ParcelaService', () => {
  let prisma: {
    parcela: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
    $queryRaw: jest.Mock;
    $executeRaw: jest.Mock;
  };
  let service: ParcelaService;

  beforeEach(() => {
    prisma = {
      parcela: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    };
    service = new ParcelaService(prisma as never);
  });

  describe('findOne', () => {
    it('calls prisma.parcela.findUnique with where and ordered cultivos include', async () => {
      const parcela = { id: 'par1', cultivos: [] } as never;
      prisma.parcela.findUnique.mockResolvedValue(parcela);

      const result = await service.findOne({ id: 'par1' });

      expect(prisma.parcela.findUnique).toHaveBeenCalledWith({
        where: { id: 'par1' },
        include: {
          cultivos: {
            orderBy: { fechaInicioCampania: 'desc' },
          },
        },
      });
      expect(result).toBe(parcela);
    });
  });

  describe('findResumenByPropietario', () => {
    it('flattens the latest crop and the crop count of each parcel', async () => {
      const ultimo = { id: 'c2', tipo: 'Olivo' };
      prisma.parcela.findMany.mockResolvedValue([
        { id: 'par1', cultivos: [ultimo], _count: { cultivos: 3 } },
        { id: 'par2', cultivos: [], _count: { cultivos: 0 } },
      ]);

      const result = await service.findResumenByPropietario('u1');

      expect(prisma.parcela.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idPropietario: 'u1' },
          orderBy: { nombre: 'asc' },
        }),
      );
      expect(result).toEqual([
        { id: 'par1', ultimoCultivo: ultimo, numCultivos: 3 },
        { id: 'par2', ultimoCultivo: null, numCultivos: 0 },
      ]);
    });
  });

  describe('getGeomsByPropietario', () => {
    it('maps each parcel id to its geometry', async () => {
      const geojson = { type: 'Polygon', coordinates: [] };
      prisma.$queryRaw.mockResolvedValue([{ id: 'par1', geojson }]);

      const result = await service.getGeomsByPropietario('u1');

      expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.anything(), 'u1');
      expect(result).toEqual(new Map([['par1', geojson]]));
    });
  });

  describe('findDetalle', () => {
    it('returns null when the parcel does not exist', async () => {
      prisma.parcela.findUnique.mockResolvedValue(null);

      await expect(service.findDetalle('par1')).resolves.toBeNull();
    });

    it('replaces each crop result with its total impact per EF category', async () => {
      prisma.parcela.findUnique.mockResolvedValue({
        id: 'par1',
        cultivos: [
          {
            id: 'c1',
            resultadoImpacto: {
              datos: {
                impacto_total: [
                  { category: 'Climate change', amount: 2, unit: 'kg CO2 eq' },
                  { category: 'Unknown', amount: 5, unit: 'x' },
                ],
              },
            },
          },
          { id: 'c2', resultadoImpacto: null },
        ],
      });

      const result = await service.findDetalle('par1');

      expect(prisma.parcela.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'par1' } }),
      );
      expect(result).toEqual({
        id: 'par1',
        cultivos: [
          { id: 'c1', impactoTotal: { climate_change: 2 } },
          { id: 'c2', impactoTotal: null },
        ],
      });
    });
  });

  describe('setGeom', () => {
    it('executes the geometry update for the given parcel', async () => {
      const geoJson = {
        type: 'Polygon',
        coordinates: [
          [
            [-3.0, 40.0],
            [-3.1, 40.1],
            [-3.2, 40.2],
            [-3.0, 40.0],
          ],
        ],
      } as const;
      prisma.$executeRaw.mockResolvedValue(1);

      await service.setGeom('par1', geoJson as never);

      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(prisma.$executeRaw).toHaveBeenCalledWith(
        expect.anything(),
        JSON.stringify(geoJson),
        'par1',
      );
    });
  });

  describe('getGeom', () => {
    it('returns the geojson value from the first row when found', async () => {
      const geojson = {
        type: 'Polygon',
        coordinates: [
          [
            [-3.0, 40.0],
            [-3.1, 40.1],
            [-3.2, 40.2],
            [-3.0, 40.0],
          ],
        ],
      };
      prisma.$queryRaw.mockResolvedValue([{ geojson }]);

      const result = await service.getGeom('par1');

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(geojson);
    });

    it('returns null when no rows are found', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getGeom('par1');

      expect(result).toBeNull();
    });

    it('returns null when rows exist but geojson is null', async () => {
      prisma.$queryRaw.mockResolvedValue([{ geojson: null }]);

      const result = await service.getGeom('par1');

      expect(result).toBeNull();
    });
  });

  describe('findManyByPointRange', () => {
    it('delegates to prisma.$queryRaw with lat, long, and range', async () => {
      const rows = [{ id: 'par2' }] as never;
      prisma.$queryRaw.mockResolvedValue(rows);

      const result = await service.findManyByPointRange(40.0, -3.0, 5000);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toBe(rows);
    });
  });

  describe('deleteWithCultivos', () => {
    it('deletes the cultivos, their results and the parcel in one transaction', async () => {
      const parcela = { id: 'par1' } as never;
      const tx = {
        cultivo: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { idResultadoImpacto: 'r1' },
              { idResultadoImpacto: null },
            ]),
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        resultadoImpacto: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        parcela: { delete: jest.fn().mockResolvedValue(parcela) },
      };
      prisma.$transaction.mockImplementation(
        (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
      );

      const result = await service.deleteWithCultivos('par1');

      expect(tx.cultivo.deleteMany).toHaveBeenCalledWith({
        where: { idParcela: 'par1' },
      });
      expect(tx.resultadoImpacto.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['r1'] } },
      });
      expect(tx.parcela.delete).toHaveBeenCalledWith({ where: { id: 'par1' } });
      expect(result).toBe(parcela);
    });
  });
});
