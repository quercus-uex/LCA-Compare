import { PoblacionService } from './poblacion.service';

describe('PoblacionService', () => {
  let prisma: {
    poblacion: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };
  let service: PoblacionService;

  beforeEach(() => {
    prisma = {
      poblacion: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new PoblacionService(prisma as never);
  });

  describe('findOne', () => {
    it('calls prisma.poblacion.findUnique with the given where filter', async () => {
      const poblacion = { id: 'pop1' } as never;
      prisma.poblacion.findUnique.mockResolvedValue(poblacion);

      const result = await service.findOne({ id: 'pop1' });

      expect(prisma.poblacion.findUnique).toHaveBeenCalledWith({
        where: { id: 'pop1' },
      });
      expect(result).toBe(poblacion);
    });
  });

  describe('findAll', () => {
    it('calls prisma.poblacion.findMany with provincia.pais include', async () => {
      const poblaciones = [{ id: 'pop1' }] as never;
      prisma.poblacion.findMany.mockResolvedValue(poblaciones);

      const result = await service.findAll();

      expect(prisma.poblacion.findMany).toHaveBeenCalledWith({
        include: { provincia: { include: { pais: true } } },
      });
      expect(result).toBe(poblaciones);
    });
  });

  describe('findMany', () => {
    it('forwards parameters with provincia.pais include', async () => {
      const poblaciones = [{ id: 'pop1' }] as never;
      prisma.poblacion.findMany.mockResolvedValue(poblaciones);

      const params = {
        skip: 5,
        take: 10,
        cursor: { id: 'pop1' },
        where: { nombre: 'Lagos' },
        orderBy: { nombre: 'asc' as const },
      };
      const result = await service.findMany(params);

      expect(prisma.poblacion.findMany).toHaveBeenCalledWith({
        ...params,
        include: { provincia: { include: { pais: true } } },
      });
      expect(result).toBe(poblaciones);
    });
  });

  describe('create', () => {
    it('calls prisma.poblacion.create with the given data', async () => {
      const data = { nombre: 'Lagos' } as never;
      const poblacion = { id: 'pop1', nombre: 'Lagos' } as never;
      prisma.poblacion.create.mockResolvedValue(poblacion);

      const result = await service.create(data);

      expect(prisma.poblacion.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(poblacion);
    });
  });

  describe('update', () => {
    it('calls prisma.poblacion.update with the given where and data', async () => {
      const poblacion = { id: 'pop1', nombre: 'Faro' } as never;
      prisma.poblacion.update.mockResolvedValue(poblacion);

      const result = await service.update({
        where: { id: 'pop1' },
        data: { nombre: 'Faro' },
      });

      expect(prisma.poblacion.update).toHaveBeenCalledWith({
        data: { nombre: 'Faro' },
        where: { id: 'pop1' },
      });
      expect(result).toBe(poblacion);
    });
  });

  describe('delete', () => {
    it('calls prisma.poblacion.delete with the given where', async () => {
      const poblacion = { id: 'pop1' } as never;
      prisma.poblacion.delete.mockResolvedValue(poblacion);

      const result = await service.delete({ id: 'pop1' });

      expect(prisma.poblacion.delete).toHaveBeenCalledWith({
        where: { id: 'pop1' },
      });
      expect(result).toBe(poblacion);
    });
  });

  describe('count', () => {
    it('calls prisma.poblacion.count with the given where filter', async () => {
      prisma.poblacion.count.mockResolvedValue(7);

      const result = await service.count({ nombre: 'Lagos' });

      expect(prisma.poblacion.count).toHaveBeenCalledWith({
        where: { nombre: 'Lagos' },
      });
      expect(result).toBe(7);
    });

    it('calls prisma.poblacion.count without where when omitted', async () => {
      prisma.poblacion.count.mockResolvedValue(50);

      const result = await service.count();

      expect(prisma.poblacion.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(50);
    });
  });
});
