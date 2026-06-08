import { MetodoImpactoService } from './metodoimpacto.service';

describe('MetodoImpactoService', () => {
  let prisma: {
    metodoImpacto: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };
  let service: MetodoImpactoService;

  beforeEach(() => {
    prisma = {
      metodoImpacto: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new MetodoImpactoService(prisma as never);
  });

  describe('findOne', () => {
    it('calls prisma.metodoImpacto.findUnique with the given where filter', async () => {
      const metodo = { id: 'm1' } as never;
      prisma.metodoImpacto.findUnique.mockResolvedValue(metodo);

      const result = await service.findOne({ id: 'm1' });

      expect(prisma.metodoImpacto.findUnique).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
      expect(result).toBe(metodo);
    });
  });

  describe('findAll', () => {
    it('calls prisma.metodoImpacto.findMany without filters', async () => {
      const metodos = [{ id: 'm1' }] as never;
      prisma.metodoImpacto.findMany.mockResolvedValue(metodos);

      const result = await service.findAll();

      expect(prisma.metodoImpacto.findMany).toHaveBeenCalledWith();
      expect(result).toBe(metodos);
    });
  });

  describe('findMany', () => {
    it('forwards pagination, filtering, cursor, and ordering parameters', async () => {
      const metodos = [{ id: 'm1' }] as never;
      prisma.metodoImpacto.findMany.mockResolvedValue(metodos);

      const params = {
        skip: 5,
        take: 10,
        cursor: { id: 'm1' },
        where: { nombre: 'ACV' },
        orderBy: { nombre: 'asc' as const },
      };
      const result = await service.findMany(params);

      expect(prisma.metodoImpacto.findMany).toHaveBeenCalledWith(params);
      expect(result).toBe(metodos);
    });
  });

  describe('create', () => {
    it('calls prisma.metodoImpacto.create with the given data', async () => {
      const data = { nombre: 'ACV' } as never;
      const metodo = { id: 'm1', nombre: 'ACV' } as never;
      prisma.metodoImpacto.create.mockResolvedValue(metodo);

      const result = await service.create(data);

      expect(prisma.metodoImpacto.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(metodo);
    });
  });

  describe('update', () => {
    it('calls prisma.metodoImpacto.update with the given where and data', async () => {
      const metodo = { id: 'm1', nombre: 'ACV Updated' } as never;
      prisma.metodoImpacto.update.mockResolvedValue(metodo);

      const result = await service.update({
        where: { id: 'm1' },
        data: { nombre: 'ACV Updated' },
      });

      expect(prisma.metodoImpacto.update).toHaveBeenCalledWith({
        data: { nombre: 'ACV Updated' },
        where: { id: 'm1' },
      });
      expect(result).toBe(metodo);
    });
  });

  describe('delete', () => {
    it('calls prisma.metodoImpacto.delete with the given where', async () => {
      const metodo = { id: 'm1' } as never;
      prisma.metodoImpacto.delete.mockResolvedValue(metodo);

      const result = await service.delete({ id: 'm1' });

      expect(prisma.metodoImpacto.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
      expect(result).toBe(metodo);
    });
  });

  describe('count', () => {
    it('calls prisma.metodoImpacto.count with the given where filter', async () => {
      prisma.metodoImpacto.count.mockResolvedValue(5);

      const result = await service.count({ nombre: 'ACV' });

      expect(prisma.metodoImpacto.count).toHaveBeenCalledWith({
        where: { nombre: 'ACV' },
      });
      expect(result).toBe(5);
    });

    it('calls prisma.metodoImpacto.count without where when omitted', async () => {
      prisma.metodoImpacto.count.mockResolvedValue(10);

      const result = await service.count();

      expect(prisma.metodoImpacto.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(10);
    });
  });
});
