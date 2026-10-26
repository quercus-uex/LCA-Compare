import { PoblacionService } from './poblacion.service';

describe('PoblacionService', () => {
  let prisma: {
    poblacion: {
      findMany: jest.Mock;
    };
  };
  let service: PoblacionService;

  beforeEach(() => {
    prisma = {
      poblacion: {
        findMany: jest.fn(),
      },
    };
    service = new PoblacionService(prisma as never);
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
});
