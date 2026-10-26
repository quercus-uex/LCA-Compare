import { ParcelaService } from './parcela.service';

describe('ParcelaService', () => {
  let prisma: {
    parcela: {
      findUnique: jest.Mock;
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
