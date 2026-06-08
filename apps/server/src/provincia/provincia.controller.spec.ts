import { NotFoundException } from '@nestjs/common';
import { ProvinciaController } from './provincia.controller';
import type { ProvinciaService } from './provincia.service';
import type { PoblacionService } from '../poblacion/poblacion.service';

describe('ProvinciaController', () => {
  let provinciaService: jest.Mocked<Pick<ProvinciaService, 'findAll'>>;
  let poblacionService: jest.Mocked<Pick<PoblacionService, 'findMany'>>;
  let controller: ProvinciaController;

  beforeEach(() => {
    provinciaService = {
      findAll: jest.fn(),
    };
    poblacionService = {
      findMany: jest.fn(),
    };
    controller = new ProvinciaController(
      provinciaService as unknown as ProvinciaService,
      poblacionService as unknown as PoblacionService,
    );
  });

  describe('getAll', () => {
    it('calls ProvinciaService.findAll and wraps result in { data }', async () => {
      const provincias = [{ id: 'pr1', nombre: 'Lisboa' }] as never;
      provinciaService.findAll.mockResolvedValue(provincias);

      const result = await controller.getAll();

      expect(provinciaService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: provincias });
    });
  });

  describe('getPoblacionesByProvinciaId', () => {
    it('calls PoblacionService.findMany with province id filter and wraps result in { data }', async () => {
      const poblaciones = [{ id: 'p1', nombre: 'Lisboa' }] as never;
      poblacionService.findMany.mockResolvedValue(poblaciones);

      const result = await controller.getPoblacionesByProvinciaId('pr1');

      expect(poblacionService.findMany).toHaveBeenCalledWith({
        where: { idProvincia: 'pr1' },
      });
      expect(result).toEqual({ data: poblaciones });
    });

    it('throws NotFoundException when no populations found', async () => {
      poblacionService.findMany.mockResolvedValue([]);

      await expect(
        controller.getPoblacionesByProvinciaId('pr1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getPoblacionesByProvinciaId('pr1'),
      ).rejects.toThrow('Provincia no encontrada');
    });
  });
});
