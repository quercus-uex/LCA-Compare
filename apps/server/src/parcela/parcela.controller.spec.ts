import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ParcelaController } from './parcela.controller';
import type { ParcelaService } from './parcela.service';

describe('ParcelaController', () => {
  let parcelaService: jest.Mocked<
    Pick<
      ParcelaService,
      | 'findResumenByPropietario'
      | 'getGeomsByPropietario'
      | 'findDetalle'
      | 'getGeom'
    >
  >;
  let controller: ParcelaController;

  beforeEach(() => {
    parcelaService = {
      findResumenByPropietario: jest.fn(),
      getGeomsByPropietario: jest.fn(),
      findDetalle: jest.fn(),
      getGeom: jest.fn(),
    };
    controller = new ParcelaController(
      parcelaService as unknown as ParcelaService,
    );
  });

  describe('getByAuthUser', () => {
    it('returns the owner parcel summaries with their geometry (null when missing)', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const geom = { type: 'Polygon', coordinates: [] };
      parcelaService.findResumenByPropietario.mockResolvedValue([
        { id: 'pa1', idPropietario: 'u1' },
        { id: 'pa2', idPropietario: 'u1' },
      ] as never);
      parcelaService.getGeomsByPropietario.mockResolvedValue(
        new Map([['pa1', geom]]) as never,
      );

      const result = await controller.getByAuthUser(user);

      expect(parcelaService.findResumenByPropietario).toHaveBeenCalledWith(
        'u1',
      );
      expect(parcelaService.getGeomsByPropietario).toHaveBeenCalledWith('u1');
      expect(result).toEqual({
        data: [
          { id: 'pa1', idPropietario: 'u1', geom },
          { id: 'pa2', idPropietario: 'u1', geom: null },
        ],
      });
    });
  });

  describe('getById', () => {
    it('returns parcel with geometry when owner matches', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const parcela = { id: 'pa1', idPropietario: 'u1' };
      const geom = { type: 'Point', coordinates: [0, 0] };
      parcelaService.findDetalle.mockResolvedValue(parcela as never);
      parcelaService.getGeom.mockResolvedValue(geom as never);

      const result = await controller.getById(user, 'pa1');

      expect(parcelaService.findDetalle).toHaveBeenCalledWith('pa1');
      expect(parcelaService.getGeom).toHaveBeenCalledWith('pa1');
      expect(result).toEqual({ data: { ...parcela, geom } });
    });

    it('throws NotFoundException when parcel does not exist', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      parcelaService.findDetalle.mockResolvedValue(null);

      await expect(controller.getById(user, 'pa1')).rejects.toThrow(
        NotFoundException,
      );
      expect(parcelaService.getGeom).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when owner does not match without geometry lookup', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      const parcela = { id: 'pa1', idPropietario: 'u2' } as never;
      parcelaService.findDetalle.mockResolvedValue(parcela);

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
