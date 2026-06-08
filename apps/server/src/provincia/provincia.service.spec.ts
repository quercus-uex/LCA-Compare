import { ProvinciaService } from './provincia.service';

describe('ProvinciaService', () => {
  let prisma: {
    provincia: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };
  let service: ProvinciaService;

  beforeEach(() => {
    prisma = {
      provincia: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new ProvinciaService(prisma as never);
  });

  describe('findOne', () => {
    it('calls prisma.provincia.findUnique with the given where filter', async () => {
      const provincia = { id: 'prov1' } as never;
      prisma.provincia.findUnique.mockResolvedValue(provincia);

      const result = await service.findOne({ id: 'prov1' });

      expect(prisma.provincia.findUnique).toHaveBeenCalledWith({
        where: { id: 'prov1' },
      });
      expect(result).toBe(provincia);
    });
  });

  describe('findAll', () => {
    it('calls prisma.provincia.findMany with pais include', async () => {
      const provincias = [{ id: 'prov1' }] as never;
      prisma.provincia.findMany.mockResolvedValue(provincias);

      const result = await service.findAll();

      expect(prisma.provincia.findMany).toHaveBeenCalledWith({
        include: { pais: true },
      });
      expect(result).toBe(provincias);
    });
  });

  describe('findMany', () => {
    it('forwards pagination, filtering, cursor, and ordering parameters', async () => {
      const provincias = [{ id: 'prov1' }] as never;
      prisma.provincia.findMany.mockResolvedValue(provincias);

      const params = {
        skip: 5,
        take: 10,
        cursor: { id: 'prov1' },
        where: { nombre: 'Faro' },
        orderBy: { nombre: 'asc' as const },
      };
      const result = await service.findMany(params);

      expect(prisma.provincia.findMany).toHaveBeenCalledWith(params);
      expect(result).toBe(provincias);
    });
  });

  describe('create', () => {
    it('calls prisma.provincia.create with the given data', async () => {
      const data = { nombre: 'Faro' } as never;
      const provincia = { id: 'prov1', nombre: 'Faro' } as never;
      prisma.provincia.create.mockResolvedValue(provincia);

      const result = await service.create(data);

      expect(prisma.provincia.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(provincia);
    });
  });

  describe('update', () => {
    it('calls prisma.provincia.update with the given where and data', async () => {
      const provincia = { id: 'prov1', nombre: 'Lisboa' } as never;
      prisma.provincia.update.mockResolvedValue(provincia);

      const result = await service.update({
        where: { id: 'prov1' },
        data: { nombre: 'Lisboa' },
      });

      expect(prisma.provincia.update).toHaveBeenCalledWith({
        data: { nombre: 'Lisboa' },
        where: { id: 'prov1' },
      });
      expect(result).toBe(provincia);
    });
  });

  describe('delete', () => {
    it('calls prisma.provincia.delete with the given where', async () => {
      const provincia = { id: 'prov1' } as never;
      prisma.provincia.delete.mockResolvedValue(provincia);

      const result = await service.delete({ id: 'prov1' });

      expect(prisma.provincia.delete).toHaveBeenCalledWith({
        where: { id: 'prov1' },
      });
      expect(result).toBe(provincia);
    });
  });

  describe('count', () => {
    it('calls prisma.provincia.count with the given where filter', async () => {
      prisma.provincia.count.mockResolvedValue(3);

      const result = await service.count({ nombre: 'Faro' });

      expect(prisma.provincia.count).toHaveBeenCalledWith({
        where: { nombre: 'Faro' },
      });
      expect(result).toBe(3);
    });

    it('calls prisma.provincia.count without where when omitted', async () => {
      prisma.provincia.count.mockResolvedValue(18);

      const result = await service.count();

      expect(prisma.provincia.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(18);
    });
  });
});
