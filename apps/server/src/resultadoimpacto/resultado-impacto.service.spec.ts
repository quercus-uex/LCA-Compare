import { ResultadoImpactoService } from './resultado-impacto.service';

describe('ResultadoImpactoService', () => {
  let prisma: {
    resultadoImpacto: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let parcelaService: {
    findManyByPointRange: jest.Mock;
  };
  let cultivoService: {
    findMostRecentByParcelaIdBulk: jest.Mock;
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
      },
    };
    parcelaService = {
      findManyByPointRange: jest.fn(),
    };
    cultivoService = {
      findMostRecentByParcelaIdBulk: jest.fn(),
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
        {},
      );
      expect(prisma.resultadoImpacto.findMany).toHaveBeenCalledWith({
        where: { cultivo: { id: { in: ['c1'] } } },
        include: locationInclude,
      });
      expect(result).toBe(ris);
    });

    it('passes the campaign filter so the most recent campaign is chosen among matching ones', async () => {
      parcelaService.findManyByPointRange.mockResolvedValue([
        { id: 'par1' },
      ] as never);
      cultivoService.findMostRecentByParcelaIdBulk.mockResolvedValue([]);
      prisma.resultadoImpacto.findMany.mockResolvedValue([]);

      await service.findManyAroundPoint(40.0, -3.0, 5000, { tipo: 'Tomate' });

      expect(cultivoService.findMostRecentByParcelaIdBulk).toHaveBeenCalledWith(
        ['par1'],
        { tipo: 'Tomate' },
      );
    });
  });
});
