import { ConflictException, NotFoundException } from '@nestjs/common';
import { AVISOS_RECIENTES, NotificacionService } from './notificacion.service';
import type { PrismaService } from '../prisma/prisma.service';

const FECHA = new Date('2026-01-10T10:00:00.000Z');
const YO = { nombre: 'Ana', apellidos: 'Pérez', email: 'ana@example.com' };

const organizacionRef = (id: string, idAdministrador: string) => ({
  id,
  nombre: `Org ${id}`,
  idAdministrador,
});

const pendiente = (
  id: string,
  idOrganizacion: string,
  anioCampania: number,
  estado = 'pendiente',
) => ({
  id,
  idOrganizacion,
  idUsuario: 'me',
  anioCampania,
  estado,
  fechaSolicitud: FECHA,
  organizacion: organizacionRef(idOrganizacion, `admin-${idOrganizacion}`),
  usuario: YO,
});

describe('NotificacionService', () => {
  let prisma: {
    $transaction: jest.Mock;
    consentimiento: Record<'findMany' | 'updateMany', jest.Mock>;
    notificacion: Record<
      'findMany' | 'count' | 'updateMany' | 'createMany',
      jest.Mock
    >;
  };
  let service: NotificacionService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      consentimiento: { findMany: jest.fn(), updateMany: jest.fn() },
      notificacion: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        updateMany: jest.fn(),
        createMany: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
    service = new NotificacionService(prisma as unknown as PrismaService);
  });

  describe('getNotificaciones', () => {
    it('groups my pending requests by organization and returns my latest notices', async () => {
      const admin = {
        id: 'admin',
        nombre: 'Admin',
        apellidos: 'Zamora',
        email: 'admin@example.com',
      };
      const org = { id: 'org-1', nombre: 'Cooperativa', administrador: admin };
      prisma.consentimiento.findMany.mockResolvedValue([
        { ...pendiente('c2', 'org-1', 2024), organizacion: org },
        { ...pendiente('c1', 'org-1', 2023), organizacion: org },
      ]);
      const datos = { nombreOrganizacion: 'Cooperativa', anios: [2024] };
      prisma.notificacion.findMany.mockResolvedValue([
        {
          id: 'n1',
          idUsuario: 'me',
          tipo: 'consentimiento_revocado',
          datos,
          leida: false,
          fechaCreacion: FECHA,
        },
      ]);
      prisma.notificacion.count.mockResolvedValue(1);

      await expect(service.getNotificaciones('me')).resolves.toEqual({
        solicitudes: [
          {
            organizacion: org,
            campanias: [
              {
                idConsentimiento: 'c1',
                anio: 2023,
                fechaSolicitud: FECHA.toISOString(),
              },
              {
                idConsentimiento: 'c2',
                anio: 2024,
                fechaSolicitud: FECHA.toISOString(),
              },
            ],
          },
        ],
        avisos: [
          {
            id: 'n1',
            tipo: 'consentimiento_revocado',
            datos,
            leida: false,
            fechaCreacion: FECHA.toISOString(),
          },
        ],
        sinLeer: 1,
      });
      expect(prisma.consentimiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            idUsuario: 'me',
            estado: 'pendiente',
            organizacion: { idAdministrador: { not: 'me' } },
          },
        }),
      );
      expect(prisma.notificacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idUsuario: 'me' },
          take: AVISOS_RECIENTES,
        }),
      );
      expect(prisma.notificacion.count).toHaveBeenCalledWith({
        where: { idUsuario: 'me', leida: false },
      });
    });
  });

  describe('marcarLeidas', () => {
    beforeEach(() => {
      prisma.consentimiento.findMany.mockResolvedValue([]);
    });

    it.each([
      [undefined, { idUsuario: 'me', leida: false }],
      [
        ['n1', 'n2'],
        { idUsuario: 'me', leida: false, id: { in: ['n1', 'n2'] } },
      ],
    ])('marks my notices %p as read', async (ids, where) => {
      await service.marcarLeidas('me', ids);

      expect(prisma.notificacion.updateMany).toHaveBeenCalledWith({
        where,
        data: { leida: true },
      });
    });
  });

  describe('responder', () => {
    it('rejects the whole batch with 404 when any id is not one of my requests', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([
        pendiente('c1', 'org-1', 2024),
      ]);

      await expect(
        service.responder('me', { ids: ['c1', 'c2'], respuesta: 'aceptado' }),
      ).rejects.toStrictEqual(new NotFoundException('Solicitud no encontrada'));
      expect(prisma.consentimiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { in: ['c1', 'c2'] },
            idUsuario: 'me',
            organizacion: { idAdministrador: { not: 'me' } },
          },
        }),
      );
      expect(prisma.consentimiento.updateMany).not.toHaveBeenCalled();
    });

    it('rejects the whole batch with 409 when any request is no longer pending', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([
        pendiente('c1', 'org-1', 2024),
        pendiente('c2', 'org-1', 2023, 'aceptado'),
      ]);

      await expect(
        service.responder('me', { ids: ['c1', 'c2'], respuesta: 'rechazado' }),
      ).rejects.toStrictEqual(
        new ConflictException('Alguna de las solicitudes ya se ha respondido'),
      );
      expect(prisma.consentimiento.updateMany).not.toHaveBeenCalled();
    });

    it('rejects with 409 when another request answered one meanwhile', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([
        pendiente('c1', 'org-1', 2024),
      ]);
      prisma.consentimiento.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.responder('me', { ids: ['c1'], respuesta: 'aceptado' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.notificacion.createMany).not.toHaveBeenCalled();
    });

    it.each([
      ['aceptado', 'consentimiento_aceptado'],
      ['rechazado', 'consentimiento_rechazado'],
    ] as const)(
      'answers %s and sends each administrator one notice per organization',
      async (respuesta, tipo) => {
        prisma.consentimiento.findMany
          .mockResolvedValueOnce([
            pendiente('c1', 'org-1', 2024),
            pendiente('c2', 'org-2', 2023),
            pendiente('c3', 'org-1', 2022),
          ])
          // Notificaciones devueltas tras responder
          .mockResolvedValue([]);
        prisma.consentimiento.updateMany.mockResolvedValue({ count: 3 });

        await expect(
          // Los ids repetidos cuentan una vez
          service.responder('me', {
            ids: ['c1', 'c2', 'c3', 'c1'],
            respuesta,
          }),
        ).resolves.toEqual({ solicitudes: [], avisos: [], sinLeer: 0 });

        expect(prisma.consentimiento.updateMany).toHaveBeenCalledWith({
          where: { id: { in: ['c1', 'c2', 'c3'] }, estado: 'pendiente' },
          data: { estado: respuesta, fechaRespuesta: expect.any(Date) },
        });
        expect(prisma.notificacion.createMany).toHaveBeenCalledWith({
          data: [
            {
              idUsuario: 'admin-org-1',
              tipo,
              datos: {
                nombreOrganizacion: 'Org org-1',
                anios: [2022, 2024],
                usuario: YO,
              },
            },
            {
              idUsuario: 'admin-org-2',
              tipo,
              datos: {
                nombreOrganizacion: 'Org org-2',
                anios: [2023],
                usuario: YO,
              },
            },
          ],
        });
      },
    );
  });
});
