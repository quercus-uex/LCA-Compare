import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ResultadoImpactoController } from './resultado-impacto.controller';
import type { ResultadoImpactoService } from './resultado-impacto.service';
import type { ParcelaService } from '../parcela/parcela.service';
import type { CultivoService } from '../cultivo/cultivo.service';

describe('ResultadoImpactoController', () => {
  let resultadoImpactoService: jest.Mocked<
    Pick<ResultadoImpactoService, 'findOne' | 'findMany'>
  >;
  let parcelaService: jest.Mocked<Pick<ParcelaService, 'findManyByRange'>>;
  let cultivoService: jest.Mocked<
    Pick<CultivoService, 'findMostRecentByParcelaId'>
  >;
  let controller: ResultadoImpactoController;

  beforeEach(() => {
    resultadoImpactoService = {
      findOne: jest.fn(),
      findMany: jest.fn(),
    };
    parcelaService = {
      findManyByRange: jest.fn(),
    };
    cultivoService = {
      findMostRecentByParcelaId: jest.fn(),
    };
    controller = new ResultadoImpactoController(
      resultadoImpactoService as unknown as ResultadoImpactoService,
      parcelaService as unknown as ParcelaService,
      cultivoService as unknown as CultivoService,
    );
  });

  describe('getById', () => {
    it('returns result when owner matches', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const resultado = {
        id: 'r1',
        cultivo: { parcela: { idPropietario: 'u1' } },
      } as never;
      resultadoImpactoService.findOne.mockResolvedValue(resultado);

      const result = await controller.getById(user, 'r1');

      expect(resultadoImpactoService.findOne).toHaveBeenCalledWith({
        id: 'r1',
      });
      expect(result).toEqual({ data: resultado });
    });

    it('throws NotFoundException when result does not exist', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      resultadoImpactoService.findOne.mockResolvedValue(null);

      await expect(controller.getById(user, 'r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when owner does not match', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const resultado = {
        id: 'r1',
        cultivo: { parcela: { idPropietario: 'u2' } },
      } as never;
      resultadoImpactoService.findOne.mockResolvedValue(resultado);

      await expect(controller.getById(user, 'r1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.getById(user, 'r1')).rejects.toThrow(
        'No eres el propietario de esta parcela',
      );
    });
  });

  describe('meanOfImpacts', () => {
    it('groups by category and averages amounts', () => {
      const results = [
        { category: 'GWP', unit: 'kg CO2 eq', amount: 10 },
        { category: 'GWP', unit: 'kg CO2 eq', amount: 20 },
        { category: 'AP', unit: 'kg SO2 eq', amount: 5 },
      ];

      const mean = controller.meanOfImpacts(results);

      expect(mean).toEqual([
        { category: 'GWP', unit: 'kg CO2 eq', amount: 15 },
        { category: 'AP', unit: 'kg SO2 eq', amount: 5 },
      ]);
    });

    it('preserves units from first occurrence per category', () => {
      const results = [
        { category: 'GWP', unit: 'kg CO2 eq', amount: 10 },
        { category: 'GWP', unit: 'different', amount: 20 },
      ];

      const mean = controller.meanOfImpacts(results);

      expect(mean[0].unit).toBe('kg CO2 eq');
    });
  });

  describe('getDiffString', () => {
    it('returns positive percentage with plus sign', () => {
      const result = controller.getDiffString(120, 100);
      expect(result).toBe('+20.00');
    });

    it('returns negative percentage with minus sign', () => {
      const result = controller.getDiffString(80, 100);
      expect(result).toBe('-20.00');
    });

    it('returns zero percentage with plus sign', () => {
      const result = controller.getDiffString(100, 100);
      expect(result).toBe('+0.00');
    });

    it('formats to two decimal places', () => {
      const result = controller.getDiffString(133.333, 100);
      expect(result).toBe('+33.33');
    });
  });

  describe('compareById', () => {
    it('throws NotFoundException when result does not exist', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      resultadoImpactoService.findOne.mockResolvedValue(null);

      await expect(controller.compareById(user, 'r1', 10)).rejects.toThrow(
        NotFoundException,
      );
      expect(parcelaService.findManyByRange).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when owner does not match without nearby lookup', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const resultado = {
        id: 'r1',
        cultivo: { parcela: { idPropietario: 'u2' } },
      } as never;
      resultadoImpactoService.findOne.mockResolvedValue(resultado);

      await expect(controller.compareById(user, 'r1', 10)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(parcelaService.findManyByRange).not.toHaveBeenCalled();
    });

    it('composes nearby means when owner matches', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const impactData = [{ category: 'GWP', unit: 'kg CO2 eq', amount: 10 }];
      const resultado = {
        id: 'r1',
        idImpacto: 'i1',
        cultivo: { idParcela: 'pa1', parcela: { idPropietario: 'u1' } },
        datos: {
          impacto_total: impactData,
          impacto_pesticidas: impactData,
          impacto_fertilizantes: impactData,
          impacto_sistema_riego: impactData,
          impacto_manejo_cultivo: impactData,
        },
      } as never;
      const parcelas = [{ id: 'pa1' }, { id: 'pa2' }] as never;
      const cultivo1 = { id: 'c1' } as never;
      const cultivo2 = { id: 'c2' } as never;
      const nearbyImpact = [{ category: 'GWP', unit: 'kg CO2 eq', amount: 20 }];
      const resultados = [
        {
          id: 'r2',
          datos: {
            impacto_total: nearbyImpact,
            impacto_pesticidas: nearbyImpact,
            impacto_fertilizantes: nearbyImpact,
            impacto_sistema_riego: nearbyImpact,
            impacto_manejo_cultivo: nearbyImpact,
          },
        },
      ] as never;

      resultadoImpactoService.findOne.mockResolvedValue(resultado);
      parcelaService.findManyByRange.mockResolvedValue(parcelas);
      cultivoService.findMostRecentByParcelaId
        .mockResolvedValueOnce(cultivo1)
        .mockResolvedValueOnce(cultivo2);
      resultadoImpactoService.findMany.mockResolvedValue(resultados);

      const result = await controller.compareById(user, 'r1', 10);

      expect(parcelaService.findManyByRange).toHaveBeenCalledWith('pa1', 10);
      expect(cultivoService.findMostRecentByParcelaId).toHaveBeenCalledWith(
        'pa1',
      );
      expect(cultivoService.findMostRecentByParcelaId).toHaveBeenCalledWith(
        'pa2',
      );
      expect(resultadoImpactoService.findMany).toHaveBeenCalledWith({
        where: {
          cultivo: { id: { in: ['c1', 'c2'] } },
          idImpacto: 'i1',
        },
      });
      expect(result.data.resultado).toBe(resultado);
      expect(result.data.nearbyMean).toBeDefined();
    });
  });
});
