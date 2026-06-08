import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ParcelaController } from './parcela.controller';
import type { ParcelaService } from './parcela.service';

describe('ParcelaController', () => {
  let parcelaService: jest.Mocked<
    Pick<ParcelaService, 'findMany' | 'findOne' | 'getGeom'>
  >;
  let controller: ParcelaController;

  beforeEach(() => {
    parcelaService = {
      findMany: jest.fn(),
      findOne: jest.fn(),
      getGeom: jest.fn(),
    };
    controller = new ParcelaController(
      parcelaService as unknown as ParcelaService,
    );
  });

  describe('getByAuthUser', () => {
    it('calls ParcelaService.findMany with owner filter and wraps result in { data }', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const parcelas = [{ id: 'pa1', idPropietario: 'u1' }] as never;
      parcelaService.findMany.mockResolvedValue(parcelas);

      const result = await controller.getByAuthUser(user);

      expect(parcelaService.findMany).toHaveBeenCalledWith({
        where: { idPropietario: 'u1' },
      });
      expect(result).toEqual({ data: parcelas });
    });
  });

  describe('getById', () => {
    it('returns parcel with geometry when owner matches', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const parcela = { id: 'pa1', idPropietario: 'u1' } as never;
      const geom = { type: 'Point', coordinates: [0, 0] };
      parcelaService.findOne.mockResolvedValue(parcela);
      parcelaService.getGeom.mockResolvedValue(geom as never);

      const result = await controller.getById(user, 'pa1');

      expect(parcelaService.findOne).toHaveBeenCalledWith({ id: 'pa1' });
      expect(parcelaService.getGeom).toHaveBeenCalledWith('pa1');
      expect(result).toEqual({ data: { ...parcela, geom } });
    });

    it('throws NotFoundException when parcel does not exist', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      parcelaService.findOne.mockResolvedValue(null);

      await expect(controller.getById(user, 'pa1')).rejects.toThrow(
        NotFoundException,
      );
      expect(parcelaService.getGeom).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when owner does not match without geometry lookup', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const parcela = { id: 'pa1', idPropietario: 'u2' } as never;
      parcelaService.findOne.mockResolvedValue(parcela);

      await expect(controller.getById(user, 'pa1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.getById(user, 'pa1')).rejects.toThrow(
        'No eres el propietario de esta parcela',
      );
      expect(parcelaService.getGeom).not.toHaveBeenCalled();
    });
  });
});
