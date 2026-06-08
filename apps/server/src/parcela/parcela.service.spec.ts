import { ParcelaService } from './parcela.service';

describe('ParcelaService', () => {
  let prisma: {
    parcela: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
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
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
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

  describe('findMany', () => {
    it('forwards all parameters to prisma.parcela.findMany', async () => {
      const parcelas = [{ id: 'par1' }] as never;
      prisma.parcela.findMany.mockResolvedValue(parcelas);

      const params = {
        skip: 0,
        take: 20,
        cursor: { id: 'par1' },
        where: { nombre: 'Test' },
        orderBy: { nombre: 'asc' as const },
        include: { cultivos: true },
      };
      const result = await service.findMany(params);

      expect(prisma.parcela.findMany).toHaveBeenCalledWith(params);
      expect(result).toBe(parcelas);
    });
  });

  describe('create', () => {
    it('calls prisma.parcela.create with the given data', async () => {
      const data = { nombre: 'Parcel A' } as never;
      const parcela = { id: 'par1', nombre: 'Parcel A' } as never;
      prisma.parcela.create.mockResolvedValue(parcela);

      const result = await service.create(data);

      expect(prisma.parcela.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(parcela);
    });
  });

  describe('createWithGeom', () => {
    it('creates the parcel in a transaction and executes geometry update', async () => {
      const data = { nombre: 'Parcel A' } as never;
      const createdParcela = { id: 'par1', nombre: 'Parcel A' } as never;
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
      };

      const tx = {
        parcela: { create: jest.fn().mockResolvedValue(createdParcela) },
        $executeRaw: jest.fn().mockResolvedValue(undefined),
      };
      prisma.$transaction.mockImplementation(
        (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx),
      );

      const result = await service.createWithGeom(data, geoJson);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(tx.parcela.create).toHaveBeenCalledWith({ data });
      expect(tx.$executeRaw).toHaveBeenCalled();
      expect(result).toBe(createdParcela);
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

  describe('findManyByRange', () => {
    it('delegates to prisma.$queryRaw and returns the result rows', async () => {
      const rows = [{ id: 'par2' }, { id: 'par3' }] as never;
      prisma.$queryRaw.mockResolvedValue(rows);

      const result = await service.findManyByRange('par1', 5000);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toBe(rows);
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

  describe('update', () => {
    it('calls prisma.parcela.update with the given where and data', async () => {
      const parcela = { id: 'par1', nombre: 'Updated' } as never;
      prisma.parcela.update.mockResolvedValue(parcela);

      const result = await service.update({
        where: { id: 'par1' },
        data: { nombre: 'Updated' },
      });

      expect(prisma.parcela.update).toHaveBeenCalledWith({
        data: { nombre: 'Updated' },
        where: { id: 'par1' },
      });
      expect(result).toBe(parcela);
    });
  });

  describe('delete', () => {
    it('calls prisma.parcela.delete with the given where', async () => {
      const parcela = { id: 'par1' } as never;
      prisma.parcela.delete.mockResolvedValue(parcela);

      const result = await service.delete({ id: 'par1' });

      expect(prisma.parcela.delete).toHaveBeenCalledWith({
        where: { id: 'par1' },
      });
      expect(result).toBe(parcela);
    });
  });

  describe('count', () => {
    it('calls prisma.parcela.count with the given where filter', async () => {
      prisma.parcela.count.mockResolvedValue(15);

      const result = await service.count({ nombre: 'Test' });

      expect(prisma.parcela.count).toHaveBeenCalledWith({
        where: { nombre: 'Test' },
      });
      expect(result).toBe(15);
    });

    it('calls prisma.parcela.count without where when omitted', async () => {
      prisma.parcela.count.mockResolvedValue(100);

      const result = await service.count();

      expect(prisma.parcela.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(100);
    });
  });
});
