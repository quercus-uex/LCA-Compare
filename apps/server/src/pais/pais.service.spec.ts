import { PaisService } from './pais.service';

describe('PaisService', () => {
  let prisma: {
    pais: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };
  let service: PaisService;

  beforeEach(() => {
    prisma = {
      pais: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new PaisService(prisma as never);
  });

  describe('findOne', () => {
    it('calls prisma.pais.findUnique with the given where filter', async () => {
      const pais = { id: 'p1' } as never;
      prisma.pais.findUnique.mockResolvedValue(pais);

      const result = await service.findOne({ id: 'p1' });

      expect(prisma.pais.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
      expect(result).toBe(pais);
    });
  });

  describe('findAll', () => {
    it('calls prisma.pais.findMany without filters', async () => {
      const paises = [{ id: 'p1' }] as never;
      prisma.pais.findMany.mockResolvedValue(paises);

      const result = await service.findAll();

      expect(prisma.pais.findMany).toHaveBeenCalledWith();
      expect(result).toBe(paises);
    });
  });

  describe('findMany', () => {
    it('forwards pagination, filtering, cursor, and ordering parameters', async () => {
      const paises = [{ id: 'p1' }] as never;
      prisma.pais.findMany.mockResolvedValue(paises);

      const params = {
        skip: 5,
        take: 10,
        cursor: { id: 'p1' },
        where: { nombre: 'Portugal' },
        orderBy: { nombre: 'asc' as const },
      };
      const result = await service.findMany(params);

      expect(prisma.pais.findMany).toHaveBeenCalledWith(params);
      expect(result).toBe(paises);
    });
  });

  describe('create', () => {
    it('calls prisma.pais.create with the given data', async () => {
      const data = { nombre: 'Portugal' } as never;
      const pais = { id: 'p1', nombre: 'Portugal' } as never;
      prisma.pais.create.mockResolvedValue(pais);

      const result = await service.create(data);

      expect(prisma.pais.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(pais);
    });
  });

  describe('update', () => {
    it('calls prisma.pais.update with the given where and data', async () => {
      const pais = { id: 'p1', nombre: 'España' } as never;
      prisma.pais.update.mockResolvedValue(pais);

      const result = await service.update({
        where: { id: 'p1' },
        data: { nombre: 'España' },
      });

      expect(prisma.pais.update).toHaveBeenCalledWith({
        data: { nombre: 'España' },
        where: { id: 'p1' },
      });
      expect(result).toBe(pais);
    });
  });

  describe('delete', () => {
    it('calls prisma.pais.delete with the given where', async () => {
      const pais = { id: 'p1' } as never;
      prisma.pais.delete.mockResolvedValue(pais);

      const result = await service.delete({ id: 'p1' });

      expect(prisma.pais.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
      expect(result).toBe(pais);
    });
  });

  describe('count', () => {
    it('calls prisma.pais.count with the given where filter', async () => {
      prisma.pais.count.mockResolvedValue(5);

      const result = await service.count({ nombre: 'Portugal' });

      expect(prisma.pais.count).toHaveBeenCalledWith({
        where: { nombre: 'Portugal' },
      });
      expect(result).toBe(5);
    });

    it('calls prisma.pais.count without where when omitted', async () => {
      prisma.pais.count.mockResolvedValue(10);

      const result = await service.count();

      expect(prisma.pais.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(10);
    });
  });
});
