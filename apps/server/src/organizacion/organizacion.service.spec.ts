import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { MailerService } from '../mailer/mailer.service';
import type { ParcelaService } from '../parcela/parcela.service';
import type { OrganizacionAccesoService } from './organizacion-acceso.service';
import type { Organizacion } from '../generated/prisma/client';

const FECHA = new Date('2026-01-10T10:00:00.000Z');
const ORG_ID = 'org-1';

const usuario = (id: string, nombre = 'Ana', apellidos = 'Pérez') => ({
  id,
  nombre,
  apellidos,
  email: `${id}@example.com`,
});
const ADMIN = usuario('admin', 'Admin', 'Zamora');

const organizacion: Organizacion = {
  id: ORG_ID,
  nombre: 'Cooperativa',
  descripcion: null,
  idAdministrador: ADMIN.id,
  fechaCreacion: FECHA,
};

/** Fila de la organización con `RESUMEN_INCLUDE` (solo aceptados) */
const conResumen = (idsAceptados: string[] = [], overrides = {}) => ({
  ...organizacion,
  administrador: ADMIN,
  consentimientos: idsAceptados.map((idUsuario) => ({ idUsuario })),
  ...overrides,
});

const resumen = (numMiembros: number, overrides = {}) => ({
  id: ORG_ID,
  nombre: 'Cooperativa',
  descripcion: null,
  fechaCreacion: FECHA.toISOString(),
  administrador: ADMIN,
  numMiembros,
  ...overrides,
});

const consentimiento = (
  idUsuario: string,
  anioCampania: number,
  estado: string,
  extra: Record<string, unknown> = {},
) => ({
  id: `c-${idUsuario}-${anioCampania}`,
  idOrganizacion: ORG_ID,
  idUsuario,
  anioCampania,
  estado,
  fechaSolicitud: FECHA,
  fechaRespuesta: estado === 'pendiente' ? null : FECHA,
  fechaRevocacion: null,
  usuario: usuario(idUsuario),
  ...extra,
});

describe('OrganizacionService', () => {
  let prisma: {
    $transaction: jest.Mock;
    organizacion: Record<
      'create' | 'findMany' | 'findUnique' | 'update' | 'delete',
      jest.Mock
    >;
    consentimiento: Record<
      'findMany' | 'findFirst' | 'updateMany' | 'createMany' | 'deleteMany',
      jest.Mock
    >;
    notificacion: Record<'create' | 'createMany', jest.Mock>;
    usuario: Record<'findFirst' | 'findUnique', jest.Mock>;
  };
  let mailer: jest.Mocked<
    Pick<
      MailerService,
      'sendSolicitudConsentimientoMail' | 'sendAvisoOrganizacionMail'
    >
  >;
  let parcelaService: jest.Mocked<
    Pick<ParcelaService, 'findResumenByPropietario' | 'getGeomsByPropietario'>
  >;
  let accesoService: jest.Mocked<
    Pick<OrganizacionAccesoService, 'getConsentimientosAceptados'>
  >;
  let service: OrganizacionService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      organizacion: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      consentimiento: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      notificacion: { create: jest.fn(), createMany: jest.fn() },
      usuario: { findFirst: jest.fn(), findUnique: jest.fn() },
    };
    // Las transacciones usan el mismo cliente simulado
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
    mailer = {
      sendSolicitudConsentimientoMail: jest.fn().mockResolvedValue(undefined),
      sendAvisoOrganizacionMail: jest.fn().mockResolvedValue(undefined),
    };
    parcelaService = {
      findResumenByPropietario: jest.fn(),
      getGeomsByPropietario: jest.fn(),
    };
    accesoService = { getConsentimientosAceptados: jest.fn() };
    service = new OrganizacionService(
      prisma as unknown as PrismaService,
      mailer as unknown as MailerService,
      parcelaService as unknown as ParcelaService,
      accesoService as unknown as OrganizacionAccesoService,
    );
  });

  /** Detalle que devuelven revocar y expulsar al terminar */
  const mockDetalle = (consentimientos: unknown[] = []) =>
    prisma.organizacion.findUnique.mockResolvedValue({
      ...organizacion,
      administrador: ADMIN,
      consentimientos,
    });

  describe('crear', () => {
    it.each([
      [undefined, null],
      ['', null],
      ['Productores del sur', 'Productores del sur'],
    ])(
      'makes the creator the administrator (descripcion %p → %p)',
      async (descripcion, stored) => {
        prisma.organizacion.create.mockResolvedValue(conResumen());

        await expect(
          service.crear(ADMIN.id, { nombre: 'Cooperativa', descripcion }),
        ).resolves.toEqual(resumen(0));
        expect(prisma.organizacion.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: {
              nombre: 'Cooperativa',
              descripcion: stored,
              idAdministrador: ADMIN.id,
            },
          }),
        );
      },
    );
  });

  describe('getMisOrganizaciones', () => {
    it('returns the administered organizations and the others grouped with my campaigns', async () => {
      prisma.organizacion.findMany.mockResolvedValue([
        // Los consentimientos del administrador no lo cuentan como miembro
        conResumen(['u-1', 'u-1', 'u-2', ADMIN.id]),
      ]);
      const otra = conResumen([], { id: 'org-2', idAdministrador: 'u-9' });
      prisma.consentimiento.findMany.mockResolvedValue([
        consentimiento('me', 2023, 'aceptado', {
          idOrganizacion: 'org-2',
          organizacion: otra,
        }),
        consentimiento('me', 2025, 'pendiente', {
          idOrganizacion: 'org-2',
          organizacion: otra,
        }),
      ]);

      const result = await service.getMisOrganizaciones('me');

      expect(result.administradas).toEqual([resumen(2)]);
      expect(result.miembro).toEqual([
        {
          organizacion: expect.objectContaining({ id: 'org-2' }),
          campanias: [
            expect.objectContaining({ anio: 2025, estado: 'pendiente' }),
            expect.objectContaining({ anio: 2023, estado: 'aceptado' }),
          ],
        },
      ]);
      expect(prisma.consentimiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            idUsuario: 'me',
            organizacion: { idAdministrador: { not: 'me' } },
          },
        }),
      );
    });
  });

  describe('getDetalle', () => {
    it('lists every user with a consent (except the administrator) by surname and name', async () => {
      mockDetalle([
        consentimiento('u-b', 2023, 'pendiente', {
          usuario: usuario('u-b', 'Berta', 'Gómez'),
        }),
        consentimiento('u-a', 2022, 'aceptado', {
          usuario: usuario('u-a', 'Alba', 'Gómez'),
        }),
        consentimiento('u-a', 2024, 'rechazado', {
          usuario: usuario('u-a', 'Alba', 'Gómez'),
        }),
        consentimiento(ADMIN.id, 2022, 'aceptado', { usuario: ADMIN }),
        consentimiento(ADMIN.id, 2024, 'aceptado', { usuario: ADMIN }),
        consentimiento(ADMIN.id, 2023, 'pendiente', { usuario: ADMIN }),
      ]);

      const detalle = await service.getDetalle(ORG_ID);

      expect(detalle.numMiembros).toBe(1);
      // Del administrador solo se listan las campañas que aporta
      expect(detalle.campaniasAdministrador.map((c) => c.anio)).toEqual([
        2024, 2022,
      ]);
      expect(detalle.miembros.map((m) => m.usuario.nombre)).toEqual([
        'Alba',
        'Berta',
      ]);
      expect(detalle.miembros[0].campanias).toEqual([
        {
          idConsentimiento: 'c-u-a-2024',
          anio: 2024,
          estado: 'rechazado',
          fechaSolicitud: FECHA.toISOString(),
          fechaRespuesta: FECHA.toISOString(),
        },
        expect.objectContaining({ anio: 2022, estado: 'aceptado' }),
      ]);
    });

    it('throws NotFoundException when the organization does not exist', async () => {
      prisma.organizacion.findUnique.mockResolvedValue(null);

      await expect(service.getDetalle(ORG_ID)).rejects.toStrictEqual(
        new NotFoundException('Organización no encontrada'),
      );
    });
  });

  describe('actualizar', () => {
    it.each([
      [{ nombre: 'Nueva' }, { nombre: 'Nueva', descripcion: undefined }],
      [{ descripcion: '' }, { nombre: undefined, descripcion: null }],
      [{ descripcion: 'Texto' }, { nombre: undefined, descripcion: 'Texto' }],
    ])('updates %p as %p', async (dto, data) => {
      prisma.organizacion.update.mockResolvedValue(conResumen());

      await service.actualizar(ORG_ID, dto);

      expect(prisma.organizacion.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ORG_ID }, data }),
      );
    });
  });

  describe('solicitarConsentimiento', () => {
    const miembro = usuario('u-1');

    beforeEach(() => {
      prisma.usuario.findFirst.mockResolvedValue(miembro);
    });

    it('looks the email up case-insensitively and rejects unknown users', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      await expect(
        service.solicitarConsentimiento(organizacion, {
          email: 'nadie@example.com',
          anios: [2024],
        }),
      ).rejects.toStrictEqual(
        new NotFoundException('No hay ningún usuario con ese email'),
      );
      expect(prisma.usuario.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: { equals: 'nadie@example.com', mode: 'insensitive' },
          },
        }),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a request to the administrator', async () => {
      prisma.usuario.findFirst.mockResolvedValue(ADMIN);

      await expect(
        service.solicitarConsentimiento(organizacion, {
          email: ADMIN.email,
          anios: [2024],
        }),
      ).rejects.toStrictEqual(
        new BadRequestException(
          'No puedes solicitarte el consentimiento a ti mismo',
        ),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates new years, reopens rejected/revoked ones and skips pending/accepted ones', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([
        { anioCampania: 2021, estado: 'pendiente' },
        { anioCampania: 2022, estado: 'aceptado' },
        { anioCampania: 2023, estado: 'rechazado' },
        { anioCampania: 2024, estado: 'revocado' },
      ]);

      await expect(
        service.solicitarConsentimiento(organizacion, {
          email: miembro.email,
          anios: [2025, 2024, 2023, 2022, 2021],
        }),
      ).resolves.toEqual({
        solicitados: [2023, 2024, 2025],
        omitidos: [2021, 2022],
      });

      const where = { idOrganizacion: ORG_ID, idUsuario: 'u-1' };
      expect(prisma.consentimiento.updateMany).toHaveBeenCalledWith({
        where: { ...where, anioCampania: { in: [2023, 2024] } },
        data: {
          estado: 'pendiente',
          fechaSolicitud: expect.any(Date),
          fechaRespuesta: null,
          fechaRevocacion: null,
        },
      });
      expect(prisma.consentimiento.createMany).toHaveBeenCalledWith({
        data: [{ ...where, anioCampania: 2025, estado: 'pendiente' }],
        skipDuplicates: true,
      });
      expect(mailer.sendSolicitudConsentimientoMail).toHaveBeenCalledWith(
        miembro.email,
        'Cooperativa',
        [2023, 2024, 2025],
      );
      // Las solicitudes no se guardan como avisos
      expect(prisma.notificacion.create).not.toHaveBeenCalled();
      expect(prisma.notificacion.createMany).not.toHaveBeenCalled();
    });

    it('does not write nor e-mail anything when every year is already pending or accepted', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([
        { anioCampania: 2024, estado: 'aceptado' },
      ]);

      await expect(
        service.solicitarConsentimiento(organizacion, {
          email: miembro.email,
          anios: [2024],
        }),
      ).resolves.toEqual({ solicitados: [], omitidos: [2024] });
      expect(prisma.consentimiento.updateMany).not.toHaveBeenCalled();
      expect(prisma.consentimiento.createMany).not.toHaveBeenCalled();
      expect(mailer.sendSolicitudConsentimientoMail).not.toHaveBeenCalled();
    });

    it('does not fail the request when the e-mail fails', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([]);
      mailer.sendSolicitudConsentimientoMail.mockRejectedValue(
        new Error('smtp down'),
      );

      await expect(
        service.solicitarConsentimiento(organizacion, {
          email: miembro.email,
          anios: [2024],
        }),
      ).resolves.toEqual({ solicitados: [2024], omitidos: [] });
    });
  });

  describe('setCampaniasAdministrador', () => {
    const where = { idOrganizacion: ORG_ID, idUsuario: ADMIN.id };

    it('accepts the chosen years without notice and drops the rest', async () => {
      mockDetalle([
        consentimiento(ADMIN.id, 2024, 'aceptado', { usuario: ADMIN }),
        consentimiento(ADMIN.id, 2023, 'aceptado', { usuario: ADMIN }),
      ]);

      const detalle = await service.setCampaniasAdministrador(
        organizacion,
        [2023, 2024],
      );

      expect(detalle.campaniasAdministrador.map((c) => c.anio)).toEqual([
        2024, 2023,
      ]);
      expect(prisma.consentimiento.deleteMany).toHaveBeenCalledWith({
        where: { ...where, anioCampania: { notIn: [2023, 2024] } },
      });
      expect(prisma.consentimiento.updateMany).toHaveBeenCalledWith({
        where: {
          ...where,
          anioCampania: { in: [2023, 2024] },
          estado: { not: 'aceptado' },
        },
        data: {
          estado: 'aceptado',
          fechaRespuesta: expect.any(Date) as Date,
          fechaRevocacion: null,
        },
      });
      expect(prisma.consentimiento.createMany).toHaveBeenCalledWith({
        data: [2023, 2024].map((anioCampania) => ({
          ...where,
          anioCampania,
          estado: 'aceptado',
          fechaRespuesta: expect.any(Date) as Date,
        })),
        skipDuplicates: true,
      });
      expect(prisma.notificacion.create).not.toHaveBeenCalled();
      expect(mailer.sendAvisoOrganizacionMail).not.toHaveBeenCalled();
    });

    it('removes every own campaign with an empty list', async () => {
      mockDetalle([]);

      const detalle = await service.setCampaniasAdministrador(organizacion, []);

      expect(detalle.campaniasAdministrador).toEqual([]);
      expect(prisma.consentimiento.deleteMany).toHaveBeenCalledWith({
        where: { ...where, anioCampania: { notIn: [] } },
      });
    });
  });

  describe('revocarConsentimiento', () => {
    beforeEach(() => mockDetalle());

    it('throws NotFoundException for a consent outside the organization', async () => {
      prisma.consentimiento.findFirst.mockResolvedValue(null);

      await expect(
        service.revocarConsentimiento(organizacion, 'c-x'),
      ).rejects.toStrictEqual(
        new NotFoundException('Consentimiento no encontrado'),
      );
      expect(prisma.consentimiento.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'c-x',
            idOrganizacion: ORG_ID,
            idUsuario: { not: ADMIN.id },
          },
        }),
      );
    });

    it('deletes a pending request without notifying', async () => {
      prisma.consentimiento.findFirst.mockResolvedValue(
        consentimiento('u-1', 2024, 'pendiente'),
      );

      await expect(
        service.revocarConsentimiento(organizacion, 'c-u-1-2024'),
      ).resolves.toMatchObject({ id: ORG_ID, miembros: [] });
      expect(prisma.consentimiento.deleteMany).toHaveBeenCalledWith({
        where: { id: 'c-u-1-2024', estado: 'pendiente' },
      });
      expect(prisma.notificacion.create).not.toHaveBeenCalled();
      expect(mailer.sendAvisoOrganizacionMail).not.toHaveBeenCalled();
    });

    it('revokes an accepted consent and notifies the member in-app and by e-mail', async () => {
      prisma.consentimiento.findFirst.mockResolvedValue(
        consentimiento('u-1', 2024, 'aceptado'),
      );

      await service.revocarConsentimiento(organizacion, 'c-u-1-2024');

      expect(prisma.consentimiento.updateMany).toHaveBeenCalledWith({
        where: { id: 'c-u-1-2024', estado: 'aceptado' },
        data: { estado: 'revocado', fechaRevocacion: expect.any(Date) },
      });
      expect(prisma.notificacion.create).toHaveBeenCalledWith({
        data: {
          idUsuario: 'u-1',
          tipo: 'consentimiento_revocado',
          datos: { nombreOrganizacion: 'Cooperativa', anios: [2024] },
        },
      });
      expect(mailer.sendAvisoOrganizacionMail).toHaveBeenCalledWith(
        'u-1@example.com',
        'consentimiento_revocado',
        'Cooperativa',
        [2024],
      );
    });

    it.each(['rechazado', 'revocado'])(
      'rejects a %s consent with 409',
      async (estado) => {
        prisma.consentimiento.findFirst.mockResolvedValue(
          consentimiento('u-1', 2024, estado),
        );

        await expect(
          service.revocarConsentimiento(organizacion, 'c-u-1-2024'),
        ).rejects.toStrictEqual(
          new ConflictException(
            'Solo se pueden cancelar solicitudes pendientes o revocar consentimientos aceptados',
          ),
        );
        expect(prisma.consentimiento.deleteMany).not.toHaveBeenCalled();
        expect(prisma.consentimiento.updateMany).not.toHaveBeenCalled();
      },
    );

    it('rejects with 409 when the request was answered meanwhile', async () => {
      prisma.consentimiento.findFirst.mockResolvedValue(
        consentimiento('u-1', 2024, 'pendiente'),
      );
      prisma.consentimiento.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.revocarConsentimiento(organizacion, 'c-u-1-2024'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('expulsarMiembro', () => {
    beforeEach(() => mockDetalle());

    it.each([
      ['has no consent in the organization', 'u-1', []],
      ['is the administrator', ADMIN.id, []],
    ])('throws NotFoundException when the user %s', async (_n, id, rows) => {
      prisma.consentimiento.findMany.mockResolvedValue(rows);

      await expect(
        service.expulsarMiembro(organizacion, id),
      ).rejects.toStrictEqual(
        new NotFoundException(
          'El usuario no tiene solicitudes en esta organización',
        ),
      );
      expect(prisma.consentimiento.updateMany).not.toHaveBeenCalled();
    });

    it('revokes the accepted years, deletes pending/rejected ones and notifies the accepted years', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([
        consentimiento('u-1', 2024, 'aceptado'),
        consentimiento('u-1', 2022, 'aceptado'),
        consentimiento('u-1', 2023, 'pendiente'),
        consentimiento('u-1', 2021, 'rechazado'),
      ]);

      await service.expulsarMiembro(organizacion, 'u-1');

      const where = { idOrganizacion: ORG_ID, idUsuario: 'u-1' };
      expect(prisma.consentimiento.updateMany).toHaveBeenCalledWith({
        where: { ...where, estado: 'aceptado' },
        data: { estado: 'revocado', fechaRevocacion: expect.any(Date) },
      });
      expect(prisma.consentimiento.deleteMany).toHaveBeenCalledWith({
        where: { ...where, estado: { in: ['pendiente', 'rechazado'] } },
      });
      expect(prisma.notificacion.create).toHaveBeenCalledWith({
        data: {
          idUsuario: 'u-1',
          tipo: 'miembro_expulsado',
          datos: { nombreOrganizacion: 'Cooperativa', anios: [2022, 2024] },
        },
      });
      expect(mailer.sendAvisoOrganizacionMail).toHaveBeenCalledWith(
        'u-1@example.com',
        'miembro_expulsado',
        'Cooperativa',
        [2022, 2024],
      );
    });

    it('does not notify an invited user without accepted years', async () => {
      prisma.consentimiento.findMany.mockResolvedValue([
        consentimiento('u-1', 2023, 'pendiente'),
      ]);

      await service.expulsarMiembro(organizacion, 'u-1');

      expect(prisma.consentimiento.deleteMany).toHaveBeenCalled();
      expect(prisma.notificacion.create).not.toHaveBeenCalled();
      expect(mailer.sendAvisoOrganizacionMail).not.toHaveBeenCalled();
    });
  });

  describe('transferir', () => {
    const noMiembro = new BadRequestException(
      'Solo puedes transferir la organización a uno de sus miembros',
    );

    it('rejects a user without accepted campaigns with 400', async () => {
      prisma.consentimiento.findFirst.mockResolvedValue(null);

      await expect(
        service.transferir(organizacion, 'u-1'),
      ).rejects.toStrictEqual(noMiembro);
      expect(prisma.consentimiento.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            idOrganizacion: ORG_ID,
            idUsuario: 'u-1',
            estado: 'aceptado',
          },
        }),
      );
      expect(prisma.organizacion.update).not.toHaveBeenCalled();
    });

    it('rejects the current administrator with 400', async () => {
      await expect(
        service.transferir(organizacion, ADMIN.id),
      ).rejects.toStrictEqual(noMiembro);
      expect(prisma.consentimiento.findFirst).not.toHaveBeenCalled();
    });

    it('makes the member the administrator and notifies them', async () => {
      const nuevo = usuario('u-1');
      prisma.consentimiento.findFirst.mockResolvedValue({ usuario: nuevo });
      prisma.organizacion.update.mockResolvedValue(
        conResumen(['u-1', 'u-2'], {
          idAdministrador: 'u-1',
          administrador: nuevo,
        }),
      );

      await expect(service.transferir(organizacion, 'u-1')).resolves.toEqual(
        // El nuevo administrador deja de contar como miembro
        resumen(1, { administrador: nuevo }),
      );
      expect(prisma.organizacion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORG_ID },
          data: { idAdministrador: 'u-1' },
        }),
      );
      // Las solicitudes que no había aceptado ya no tienen quién las responda
      expect(prisma.consentimiento.deleteMany).toHaveBeenCalledWith({
        where: {
          idOrganizacion: ORG_ID,
          idUsuario: 'u-1',
          estado: { not: 'aceptado' },
        },
      });
      expect(prisma.notificacion.create).toHaveBeenCalledWith({
        data: {
          idUsuario: 'u-1',
          tipo: 'administracion_transferida',
          datos: { nombreOrganizacion: 'Cooperativa' },
        },
      });
      expect(mailer.sendAvisoOrganizacionMail).toHaveBeenCalledWith(
        'u-1@example.com',
        'administracion_transferida',
        'Cooperativa',
      );
    });
  });

  describe('eliminar', () => {
    it('throws NotFoundException when the organization does not exist', async () => {
      prisma.organizacion.findUnique.mockResolvedValue(null);

      await expect(service.eliminar(ORG_ID)).rejects.toStrictEqual(
        new NotFoundException('Organización no encontrada'),
      );
      expect(prisma.organizacion.delete).not.toHaveBeenCalled();
    });

    it('notifies users with accepted or pending campaigns, deletes it and returns it as it was', async () => {
      prisma.organizacion.findUnique.mockResolvedValue(conResumen(['u-1']));
      prisma.consentimiento.findMany.mockResolvedValue([
        { usuario: { id: 'u-1', email: 'u-1@example.com' } },
        { usuario: { id: 'u-2', email: 'u-2@example.com' } },
      ]);
      // Un correo que falla no impide los demás ni la respuesta
      mailer.sendAvisoOrganizacionMail.mockRejectedValueOnce(
        new Error('smtp down'),
      );

      await expect(service.eliminar(ORG_ID)).resolves.toEqual(resumen(1));

      expect(prisma.consentimiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            idOrganizacion: ORG_ID,
            estado: { in: ['aceptado', 'pendiente'] },
            idUsuario: { not: ADMIN.id },
          },
          distinct: ['idUsuario'],
        }),
      );
      expect(prisma.notificacion.createMany).toHaveBeenCalledWith({
        data: ['u-1', 'u-2'].map((idUsuario) => ({
          idUsuario,
          tipo: 'organizacion_eliminada',
          datos: { nombreOrganizacion: 'Cooperativa' },
        })),
      });
      expect(prisma.organizacion.delete).toHaveBeenCalledWith({
        where: { id: ORG_ID },
      });
      expect(mailer.sendAvisoOrganizacionMail.mock.calls).toEqual([
        ['u-1@example.com', 'organizacion_eliminada', 'Cooperativa'],
        ['u-2@example.com', 'organizacion_eliminada', 'Cooperativa'],
      ]);
    });

    it('does not create notices when nobody is affected', async () => {
      prisma.organizacion.findUnique.mockResolvedValue(conResumen());
      prisma.consentimiento.findMany.mockResolvedValue([]);

      await service.eliminar(ORG_ID);

      expect(prisma.notificacion.createMany).not.toHaveBeenCalled();
      expect(prisma.organizacion.delete).toHaveBeenCalled();
    });
  });

  describe('getParcelasMiembro', () => {
    it('throws NotFoundException when the user has no accepted campaign', async () => {
      accesoService.getConsentimientosAceptados.mockResolvedValue([
        { idUsuario: 'u-2', anio: 2024 },
      ]);

      await expect(
        service.getParcelasMiembro(ORG_ID, 'u-1'),
      ).rejects.toStrictEqual(
        new NotFoundException(
          'El usuario no ha aceptado ninguna campaña en esta organización',
        ),
      );
      expect(parcelaService.findResumenByPropietario).not.toHaveBeenCalled();
    });

    it('summarizes the member parcels over the accepted years only, with geometry', async () => {
      const miembro = usuario('u-1');
      const geom = { type: 'Polygon', coordinates: [] };
      accesoService.getConsentimientosAceptados.mockResolvedValue([
        { idUsuario: 'u-1', anio: 2024 },
        { idUsuario: 'u-2', anio: 2023 },
        { idUsuario: 'u-1', anio: 2022 },
      ]);
      prisma.usuario.findUnique.mockResolvedValue(miembro);
      parcelaService.findResumenByPropietario.mockResolvedValue([
        { id: 'pa1' },
        { id: 'pa2' },
      ] as never);
      parcelaService.getGeomsByPropietario.mockResolvedValue(
        new Map([['pa1', geom]]) as never,
      );

      await expect(service.getParcelasMiembro(ORG_ID, 'u-1')).resolves.toEqual({
        usuario: miembro,
        anios: [2022, 2024],
        parcelas: [
          { id: 'pa1', geom },
          { id: 'pa2', geom: null },
        ],
      });
      expect(parcelaService.findResumenByPropietario).toHaveBeenCalledWith(
        'u-1',
        [2022, 2024],
      );
    });
  });
});
