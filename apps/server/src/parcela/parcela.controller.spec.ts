import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ParcelaController } from './parcela.controller';
import type { ParcelaService } from './parcela.service';
import type { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';
import type { AccesoOrganizacion } from 'common/organizacion';

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
  let accesoService: jest.Mocked<
    Pick<OrganizacionAccesoService, 'getAccesoOrganizacion'>
  >;
  let controller: ParcelaController;

  beforeEach(() => {
    accesoService = { getAccesoOrganizacion: jest.fn() };
    parcelaService = {
      findResumenByPropietario: jest.fn(),
      getGeomsByPropietario: jest.fn(),
      findDetalle: jest.fn(),
      getGeom: jest.fn(),
    };
    controller = new ParcelaController(
      parcelaService as unknown as ParcelaService,
      accesoService as unknown as OrganizacionAccesoService,
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
      expect(accesoService.getAccesoOrganizacion).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when parcel does not exist', async () => {
      const user = { sub: 'u1', email: 'test@example.com' };
      parcelaService.findDetalle.mockResolvedValue(null);

      await expect(controller.getById(user, 'pa1')).rejects.toThrow(
        NotFoundException,
      );
    });

    describe('as a non-owner', () => {
      const admin = { sub: 'admin', email: 'admin@example.com' };
      const geom = { type: 'Polygon', coordinates: [] };
      const cultivo = (id: string, fecha: string) => ({
        id,
        fechaInicioCampania: new Date(fecha),
      });
      const parcela = {
        id: 'pa1',
        idPropietario: 'u2',
        cultivos: [
          cultivo('c2025', '2025-03-01T00:00:00.000Z'),
          // Año UTC 2023 aunque en hora local pueda ser 2024
          cultivo('c2023', '2023-12-31T23:30:00.000Z'),
          cultivo('c2022', '2022-03-01T00:00:00.000Z'),
        ],
      };
      const acceso: AccesoOrganizacion = {
        propietario: {
          id: 'u2',
          nombre: 'Ana',
          apellidos: 'Pérez',
          email: 'ana@example.com',
        },
        organizaciones: [{ id: 'org-1', nombre: 'Cooperativa' }],
        anios: [2023, 2025],
      };

      beforeEach(() => {
        parcelaService.findDetalle.mockResolvedValue(parcela as never);
        parcelaService.getGeom.mockResolvedValue(geom as never);
      });

      it('returns only the consented cultivos plus acceso and geometry to an organization admin', async () => {
        accesoService.getAccesoOrganizacion.mockResolvedValue(acceso);

        const result = await controller.getById(admin, 'pa1');

        expect(accesoService.getAccesoOrganizacion).toHaveBeenCalledWith(
          'admin',
          'u2',
        );
        expect(result).toEqual({
          data: {
            ...parcela,
            cultivos: [parcela.cultivos[0], parcela.cultivos[1]],
            acceso,
            geom,
          },
        });
      });

      it.each([
        ['a stranger without access', null],
        [
          'an organization admin without any of its campaign years',
          { ...acceso, anios: [2024] },
        ],
      ])('throws UnauthorizedException for %s', async (_name, found) => {
        accesoService.getAccesoOrganizacion.mockResolvedValue(found);

        await expect(controller.getById(admin, 'pa1')).rejects.toStrictEqual(
          new UnauthorizedException('No eres el propietario de esta parcela'),
        );
      });
    });
  });
});
