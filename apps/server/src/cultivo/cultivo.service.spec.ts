import { CultivoService } from './cultivo.service';

describe('CultivoService', () => {
  let prisma: {
    cultivo: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };
  let service: CultivoService;

  beforeEach(() => {
    prisma = {
      cultivo: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new CultivoService(prisma as never);
  });

  describe('findOne', () => {
    it('calls prisma.cultivo.findUnique with the given where filter', async () => {
      const cultivo = { id: 'c1' } as never;
      prisma.cultivo.findUnique.mockResolvedValue(cultivo);

      const result = await service.findOne({ id: 'c1' });

      expect(prisma.cultivo.findUnique).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(result).toBe(cultivo);
    });
  });

  describe('findMostRecentByParcelaId', () => {
    it('calls prisma.cultivo.findFirst filtered by idParcela ordered by fechaInicioCampania desc', async () => {
      const cultivo = { id: 'c1' } as never;
      prisma.cultivo.findFirst.mockResolvedValue(cultivo);

      const result = await service.findMostRecentByParcelaId('p1');

      expect(prisma.cultivo.findFirst).toHaveBeenCalledWith({
        where: { idParcela: 'p1' },
        orderBy: { fechaInicioCampania: 'desc' },
      });
      expect(result).toBe(cultivo);
    });
  });

  describe('findMostRecentByParcelaIdBulk', () => {
    it('calls prisma.cultivo.findMany with idParcela in the provided ids', async () => {
      const cultivos = [{ id: 'c1' }] as never;
      prisma.cultivo.findMany.mockResolvedValue(cultivos);

      const result = await service.findMostRecentByParcelaIdBulk(['p1', 'p2']);

      expect(prisma.cultivo.findMany).toHaveBeenCalledWith({
        where: { idParcela: { in: ['p1', 'p2'] } },
        orderBy: { fechaInicioCampania: 'desc' },
      });
      expect(result).toBe(cultivos);
    });
  });

  describe('findMany', () => {
    it('forwards pagination, filtering, cursor, and ordering parameters', async () => {
      const cultivos = [{ id: 'c1' }] as never;
      prisma.cultivo.findMany.mockResolvedValue(cultivos);

      const params = {
        skip: 5,
        take: 10,
        cursor: { id: 'c1' },
        where: { tipo: 'trigo' },
        orderBy: { fechaInicioCampania: 'desc' as const },
      };
      const result = await service.findMany(params);

      expect(prisma.cultivo.findMany).toHaveBeenCalledWith(params);
      expect(result).toBe(cultivos);
    });
  });

  describe('create', () => {
    it('calls prisma.cultivo.create with the given data', async () => {
      const data = { tipo: 'trigo' } as never;
      const cultivo = { id: 'c1', tipo: 'trigo' } as never;
      prisma.cultivo.create.mockResolvedValue(cultivo);

      const result = await service.create(data);

      expect(prisma.cultivo.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(cultivo);
    });
  });

  describe('update', () => {
    it('calls prisma.cultivo.update with the given where and data', async () => {
      const cultivo = { id: 'c1', tipo: 'cebada' } as never;
      prisma.cultivo.update.mockResolvedValue(cultivo);

      const result = await service.update({
        where: { id: 'c1' },
        data: { tipo: 'cebada' },
      });

      expect(prisma.cultivo.update).toHaveBeenCalledWith({
        data: { tipo: 'cebada' },
        where: { id: 'c1' },
      });
      expect(result).toBe(cultivo);
    });
  });

  describe('delete', () => {
    it('calls prisma.cultivo.delete with the given where', async () => {
      const cultivo = { id: 'c1' } as never;
      prisma.cultivo.delete.mockResolvedValue(cultivo);

      const result = await service.delete({ id: 'c1' });

      expect(prisma.cultivo.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(result).toBe(cultivo);
    });
  });

  describe('count', () => {
    it('calls prisma.cultivo.count with the given where filter', async () => {
      prisma.cultivo.count.mockResolvedValue(42);

      const result = await service.count({ tipo: 'trigo' });

      expect(prisma.cultivo.count).toHaveBeenCalledWith({
        where: { tipo: 'trigo' },
      });
      expect(result).toBe(42);
    });

    it('calls prisma.cultivo.count without where when omitted', async () => {
      prisma.cultivo.count.mockResolvedValue(10);

      const result = await service.count();

      expect(prisma.cultivo.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(10);
    });
  });
});
