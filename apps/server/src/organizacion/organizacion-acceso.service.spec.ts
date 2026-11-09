import { ForbiddenException } from '@nestjs/common';
import { OrganizacionAccesoService } from './organizacion-acceso.service';
import type { PrismaService } from '../prisma/prisma.service';

const ORG_ID = 'org-1';

const usuario = (id: string, nombre = 'Ana') => ({
  id,
  nombre,
  apellidos: 'Pérez',
  email: `${id}@example.com`,
});

describe('OrganizacionAccesoService', () => {
  let prisma: {
    consentimiento: { findMany: jest.Mock };
    organizacion: { findUnique: jest.Mock };
  };
  let service: OrganizacionAccesoService;

  beforeEach(() => {
    prisma = {
      consentimiento: { findMany: jest.fn() },
      organizacion: { findUnique: jest.fn() },
    };
    service = new OrganizacionAccesoService(prisma as unknown as PrismaService);
  });

  describe('getConsentimientosAceptados', () => {
    it('reads the accepted user-year pairs excluding the current administrator', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([
        { idUsuario: 'u-1', anioCampania: 2023 },
        { idUsuario: 'u-2', anioCampania: 2024 },
      ]);

      await expect(
        service.getConsentimientosAceptados(ORG_ID),
      ).resolves.toEqual([
        { idUsuario: 'u-1', anio: 2023 },
        { idUsuario: 'u-2', anio: 2024 },
      ]);
      expect(prisma.consentimiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            idOrganizacion: ORG_ID,
            estado: 'aceptado',
            NOT: {
              usuario: {
                organizacionesAdministradas: { some: { id: ORG_ID } },
              },
            },
          },
        }),
      );
    });
  });

  describe('getAccesoOrganizacion', () => {
    it('returns null for the owner without querying', async () => {
      await expect(service.getAccesoOrganizacion('u-1', 'u-1')).resolves.toBe(
        null,
      );
      expect(prisma.consentimiento.findMany).not.toHaveBeenCalled();
    });

    it('returns null when the viewer administers no organization with consents of the owner', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([]);

      await expect(
        service.getAccesoOrganizacion('admin', 'u-1'),
      ).resolves.toBeNull();
      expect(prisma.consentimiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            idUsuario: 'u-1',
            estado: 'aceptado',
            organizacion: { idAdministrador: 'admin' },
          },
        }),
      );
    });

    it('merges the accepted years of every organization the viewer administers', async () => {
      const propietario = usuario('u-1');
      const cooperativa = { id: 'org-2', nombre: 'Cooperativa' };
      const asociacion = { id: 'org-1', nombre: 'Asociación' };
      prisma.consentimiento.findMany.mockResolvedValue([
        { anioCampania: 2024, organizacion: cooperativa, usuario: propietario },
        { anioCampania: 2022, organizacion: asociacion, usuario: propietario },
        { anioCampania: 2024, organizacion: asociacion, usuario: propietario },
      ]);

      await expect(
        service.getAccesoOrganizacion('admin', 'u-1'),
      ).resolves.toEqual({
        propietario,
        organizaciones: [asociacion, cooperativa],
        anios: [2022, 2024],
      });
    });
  });

  describe('getOrganizacionAdministrada', () => {
    const forbidden = new ForbiddenException(
      'No eres el administrador de esta organización',
    );

    it('rejects anonymous requests without querying', async () => {
      await expect(
        service.getOrganizacionAdministrada(ORG_ID, undefined),
      ).rejects.toStrictEqual(forbidden);
      expect(prisma.organizacion.findUnique).not.toHaveBeenCalled();
    });

    it.each([
      ['a missing organization', null],
      [
        'an organization administered by someone else',
        { idAdministrador: 'u-2' },
      ],
    ])('rejects %s with 403', async (_name, found) => {
      prisma.organizacion.findUnique.mockResolvedValue(found);

      await expect(
        service.getOrganizacionAdministrada(ORG_ID, 'u-1'),
      ).rejects.toStrictEqual(forbidden);
    });

    it('returns the organization to its administrator', async () => {
      const organizacion = { id: ORG_ID, idAdministrador: 'u-1' };
      prisma.organizacion.findUnique.mockResolvedValue(organizacion);

      await expect(
        service.getOrganizacionAdministrada(ORG_ID, 'u-1'),
      ).resolves.toBe(organizacion);
      expect(prisma.organizacion.findUnique).toHaveBeenCalledWith({
        where: { id: ORG_ID },
      });
    });
  });
});
