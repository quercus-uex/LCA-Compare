import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ResultadoImpactoController } from './resultado-impacto.controller';
import type { ResultadoImpactoService } from './resultado-impacto.service';

describe('ResultadoImpactoController', () => {
  let resultadoImpactoService: jest.Mocked<
    Pick<ResultadoImpactoService, 'findOne'>
  >;
  let controller: ResultadoImpactoController;

  beforeEach(() => {
    resultadoImpactoService = {
      findOne: jest.fn(),
    };
    controller = new ResultadoImpactoController(
      resultadoImpactoService as unknown as ResultadoImpactoService,
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
});
