import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ResultadoImpactoController } from './resultado-impacto.controller';
import type { ResultadoImpactoService } from './resultado-impacto.service';
import type { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';

describe('ResultadoImpactoController', () => {
  let resultadoImpactoService: jest.Mocked<
    Pick<ResultadoImpactoService, 'findOne'>
  >;
  let accesoService: jest.Mocked<
    Pick<OrganizacionAccesoService, 'getAccesoOrganizacion'>
  >;
  let controller: ResultadoImpactoController;

  beforeEach(() => {
    accesoService = { getAccesoOrganizacion: jest.fn() };
    resultadoImpactoService = {
      findOne: jest.fn(),
    };
    controller = new ResultadoImpactoController(
      resultadoImpactoService as unknown as ResultadoImpactoService,
      accesoService as unknown as OrganizacionAccesoService,
    );
  });

  describe('getById', () => {
    it('returns result when owner matches', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const resultado = {
        id: 'r1',
        cultivo: {
          fechaInicioCampania: new Date('2024-03-01T00:00:00.000Z'),
          parcela: { idPropietario: 'u1' },
        },
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

    describe('as a non-owner', () => {
      const user = { sub: 'admin', email: 'admin@example.com' };
      const resultado = {
        id: 'r1',
        cultivo: {
          // Año UTC 2023
          fechaInicioCampania: new Date('2023-12-31T23:30:00.000Z'),
          parcela: { idPropietario: 'u2' },
        },
      };
      const acceso = (anios: number[]) => ({
        propietario: {
          id: 'u2',
          nombre: 'Ana',
          apellidos: 'Pérez',
          email: 'ana@example.com',
        },
        organizaciones: [{ id: 'org-1', nombre: 'Cooperativa' }],
        anios,
      });

      beforeEach(() => {
        resultadoImpactoService.findOne.mockResolvedValue(resultado as never);
      });

      it('returns the result to an organization admin with its campaign year consented', async () => {
        accesoService.getAccesoOrganizacion.mockResolvedValue(
          acceso([2022, 2023]),
        );

        await expect(controller.getById(user, 'r1')).resolves.toEqual({
          data: resultado,
        });
        expect(accesoService.getAccesoOrganizacion).toHaveBeenCalledWith(
          'admin',
          'u2',
        );
      });

      it.each([
        ['a stranger without access', null],
        ['an organization admin without that year', acceso([2024])],
      ])('throws UnauthorizedException for %s', async (_name, found) => {
        accesoService.getAccesoOrganizacion.mockResolvedValue(found);

        await expect(controller.getById(user, 'r1')).rejects.toStrictEqual(
          new UnauthorizedException('No eres el propietario de esta parcela'),
        );
      });
    });
  });
});
