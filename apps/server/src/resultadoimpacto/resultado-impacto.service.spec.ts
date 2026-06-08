import { ResultadoImpactoService } from './resultado-impacto.service';

describe('ResultadoImpactoService', () => {
  let prisma: {
    resultadoImpacto: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };
  let parcelaService: {
    findManyByRange: jest.Mock;
    findManyByPointRange: jest.Mock;
  };
  let cultivoService: {
    findMostRecentByParcelaIdBulk: jest.Mock;
    findMany: jest.Mock;
  };
  let service: ResultadoImpactoService;

  const locationInclude = {
    cultivo: {
      include: {
        parcela: {
          include: { poblacion: { include: { provincia: true } } },
        },
      },
    },
  };

  beforeEach(() => {
    prisma = {
      resultadoImpacto: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    parcelaService = {
      findManyByRange: jest.fn(),
      findManyByPointRange: jest.fn(),
    };
    cultivoService = {
      findMostRecentByParcelaIdBulk: jest.fn(),
      findMany: jest.fn(),
    };
    service = new ResultadoImpactoService(
      prisma as never,
      parcelaService as never,
      cultivoService as never,
    );
  });

  describe('findOne', () => {
    it('calls prisma.resultadoImpacto.findUnique with impacto and cultivo.parcela include', async () => {
      const ri = { id: 'ri1' } as never;
      prisma.resultadoImpacto.findUnique.mockResolvedValue(ri);

      const result = await service.findOne({ id: 'ri1' });

      expect(prisma.resultadoImpacto.findUnique).toHaveBeenCalledWith({
        where: { id: 'ri1' },
        include: {
          impacto: true,
          cultivo: {
            include: { parcela: true },
          },
        },
      });
      expect(result).toBe(ri);
    });
  });

  describe('findMany', () => {
    it('forwards parameters with cultivo.parcela.poblacion.provincia include', async () => {
      const ris = [{ id: 'ri1' }] as never;
      prisma.resultadoImpacto.findMany.mockResolvedValue(ris);

      const params = {
        skip: 0,
        take: 10,
        cursor: { id: 'ri1' },
        where: {},
        orderBy: { id: 'asc' as const },
      };
      const result = await service.findMany(params);

      expect(prisma.resultadoImpacto.findMany).toHaveBeenCalledWith({
        ...params,
        include: locationInclude,
      });
      expect(result).toBe(ris);
    });
  });

  describe('findManyAroundParcela', () => {
    it('queries nearby parcels, recent crops, and fetches impact results for those crop ids', async () => {
      const parcelas = [{ id: 'par1' }, { id: 'par2' }] as never;
      const cultivos = [{ id: 'c1' }, { id: 'c2' }] as never;
      const ris = [{ id: 'ri1' }] as never;

      parcelaService.findManyByRange.mockResolvedValue(parcelas);
      cultivoService.findMostRecentByParcelaIdBulk.mockResolvedValue(cultivos);
      prisma.resultadoImpacto.findMany.mockResolvedValue(ris);

      const result = await service.findManyAroundParcela('par1', 5000);

      expect(parcelaService.findManyByRange).toHaveBeenCalledWith('par1', 5000);
      expect(cultivoService.findMostRecentByParcelaIdBulk).toHaveBeenCalledWith(
        ['par1', 'par2'],
      );
      expect(prisma.resultadoImpacto.findMany).toHaveBeenCalledWith({
        where: { cultivo: { id: { in: ['c1', 'c2'] } } },
        include: locationInclude,
      });
      expect(result).toBe(ris);
    });
  });

  describe('findManyAroundPoint', () => {
    it('queries nearby parcels by point, recent crops, and fetches impact results', async () => {
      const parcelas = [{ id: 'par1' }] as never;
      const cultivos = [{ id: 'c1' }] as never;
      const ris = [{ id: 'ri1' }] as never;

      parcelaService.findManyByPointRange.mockResolvedValue(parcelas);
      cultivoService.findMostRecentByParcelaIdBulk.mockResolvedValue(cultivos);
      prisma.resultadoImpacto.findMany.mockResolvedValue(ris);

      const result = await service.findManyAroundPoint(40.0, -3.0, 5000);

      expect(parcelaService.findManyByPointRange).toHaveBeenCalledWith(
        40.0,
        -3.0,
        5000,
      );
      expect(cultivoService.findMostRecentByParcelaIdBulk).toHaveBeenCalledWith(
        ['par1'],
      );
      expect(prisma.resultadoImpacto.findMany).toHaveBeenCalledWith({
        where: { cultivo: { id: { in: ['c1'] } } },
        include: locationInclude,
      });
      expect(result).toBe(ris);
    });
  });

  describe('findManyByTipoCultivo', () => {
    it('queries cultivos by tipo and fetches impact results for those crop ids', async () => {
      const cultivos = [{ id: 'c1' }, { id: 'c2' }] as never;
      const ris = [{ id: 'ri1' }] as never;

      cultivoService.findMany.mockResolvedValue(cultivos);
      prisma.resultadoImpacto.findMany.mockResolvedValue(ris);

      const result = await service.findManyByTipoCultivo('trigo');

      expect(cultivoService.findMany).toHaveBeenCalledWith({
        where: { tipo: 'trigo' },
      });
      expect(prisma.resultadoImpacto.findMany).toHaveBeenCalledWith({
        where: { cultivo: { id: { in: ['c1', 'c2'] } } },
      });
      expect(result).toBe(ris);
    });
  });

  describe('create', () => {
    it('calls prisma.resultadoImpacto.create with the given data', async () => {
      const data = { valor: 42 } as never;
      const ri = { id: 'ri1', valor: 42 } as never;
      prisma.resultadoImpacto.create.mockResolvedValue(ri);

      const result = await service.create(data);

      expect(prisma.resultadoImpacto.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(ri);
    });
  });

  describe('delete', () => {
    it('calls prisma.resultadoImpacto.delete with the given where', async () => {
      const ri = { id: 'ri1' } as never;
      prisma.resultadoImpacto.delete.mockResolvedValue(ri);

      const result = await service.delete({ id: 'ri1' });

      expect(prisma.resultadoImpacto.delete).toHaveBeenCalledWith({
        where: { id: 'ri1' },
      });
      expect(result).toBe(ri);
    });
  });
});
