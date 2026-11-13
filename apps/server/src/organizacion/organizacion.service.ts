import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Polygon } from 'geojson';
import type {
  MembresiaOrganizacion,
  MiembroOrganizacion,
  MisOrganizacionesDto,
  OrganizacionDetalle,
  OrganizacionResumen,
  SolicitudConsentimientoResultadoDto,
  UsuarioBasico,
} from 'common/organizacion';
import { PrismaService } from '../prisma/prisma.service';
import type { Organizacion, Prisma } from '../generated/prisma/client';
import { MailerService } from '../mailer/mailer.service';
import {
  ParcelaService,
  type ParcelaResumenRow,
} from '../parcela/parcela.service';
import { errorMessage } from '../common/helpers/error.helper';
import { OrganizacionAccesoService } from './organizacion-acceso.service';
import {
  ESTADO,
  USUARIO_BASICO_SELECT,
  avisoData,
  byAnioDesc,
  byApellidosNombre,
  groupBy,
  toCampania,
  uniqueSortedAnios,
} from './organizacion.helpers';
import type {
  CreateOrganizacionDto,
  UpdateOrganizacionDto,
} from './dto/create-organizacion.dto';
import type { SolicitarConsentimientoDto } from './dto/solicitar-consentimiento.dto';

/** Lo que necesita `toResumen`: el administrador y quién ha aceptado algo */
const RESUMEN_INCLUDE = {
  administrador: { select: USUARIO_BASICO_SELECT },
  consentimientos: {
    where: { estado: ESTADO.aceptado },
    select: { idUsuario: true },
  },
} satisfies Prisma.OrganizacionInclude;

type OrganizacionConResumen = Prisma.OrganizacionGetPayload<{
  include: typeof RESUMEN_INCLUDE;
}>;

const DETALLE_INCLUDE = {
  administrador: { select: USUARIO_BASICO_SELECT },
  consentimientos: {
    include: { usuario: { select: USUARIO_BASICO_SELECT } },
    orderBy: { anioCampania: 'desc' },
  },
} satisfies Prisma.OrganizacionInclude;

type OrganizacionConDetalle = Prisma.OrganizacionGetPayload<{
  include: typeof DETALLE_INCLUDE;
}>;

/** Relaciones de cada organización en el listado del panel de administración */
export const ORGANIZACION_ADMIN_LIST_INCLUDE = {
  administrador: { select: USUARIO_BASICO_SELECT },
  _count: { select: { consentimientos: true } },
} satisfies Prisma.OrganizacionInclude;

/** Relaciones de cada consentimiento en el panel de administración */
export const CONSENTIMIENTO_ADMIN_INCLUDE = {
  organizacion: { select: { id: true, nombre: true } },
  usuario: { select: USUARIO_BASICO_SELECT },
} satisfies Prisma.ConsentimientoInclude;

export type ParcelaMiembro = ParcelaResumenRow & { geom: Polygon | null };

export type MiembroParcelas = {
  usuario: UsuarioBasico;
  anios: number[];
  parcelas: ParcelaMiembro[];
};

/**
 * Los miembros son quienes tienen alguna campaña aceptada, sin el
 * administrador: sus campañas cuentan como datos, pero él no como miembro
 */
function countMiembros(
  idAdministrador: string,
  aceptados: { idUsuario: string }[],
): number {
  const miembros = new Set(aceptados.map((c) => c.idUsuario));
  miembros.delete(idAdministrador);
  return miembros.size;
}

function toResumen(
  organizacion: Omit<OrganizacionConResumen, 'consentimientos'>,
  numMiembros: number,
): OrganizacionResumen {
  return {
    id: organizacion.id,
    nombre: organizacion.nombre,
    descripcion: organizacion.descripcion,
    fechaCreacion: organizacion.fechaCreacion.toISOString(),
    administrador: organizacion.administrador,
    numMiembros,
  };
}

/** `RESUMEN_INCLUDE` ya trae solo los consentimientos aceptados */
const resumenOf = (organizacion: OrganizacionConResumen) =>
  toResumen(
    organizacion,
    countMiembros(organizacion.idAdministrador, organizacion.consentimientos),
  );

function toDetalle(organizacion: OrganizacionConDetalle): OrganizacionDetalle {
  const esDelAdministrador = (c: { idUsuario: string }) =>
    c.idUsuario === organizacion.idAdministrador;
  const consentimientos = organizacion.consentimientos.filter(
    (c) => !esDelAdministrador(c),
  );
  const miembros: MiembroOrganizacion[] = groupBy(
    consentimientos,
    (c) => c.idUsuario,
  )
    .map((grupo) => ({
      usuario: grupo[0].usuario,
      campanias: grupo.map(toCampania).sort(byAnioDesc),
    }))
    .sort((a, b) => byApellidosNombre(a.usuario, b.usuario));

  return {
    ...toResumen(
      organizacion,
      countMiembros(
        organizacion.idAdministrador,
        consentimientos.filter((c) => c.estado === ESTADO.aceptado),
      ),
    ),
    miembros,
    campaniasAdministrador: organizacion.consentimientos
      .filter((c) => esDelAdministrador(c) && c.estado === ESTADO.aceptado)
      .map(toCampania)
      .sort(byAnioDesc),
  };
}

@Injectable()
export class OrganizacionService {
  private readonly logger = new Logger(OrganizacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly parcelaService: ParcelaService,
    private readonly accesoService: OrganizacionAccesoService,
  ) {}

  async crear(
    idAdministrador: string,
    dto: CreateOrganizacionDto,
  ): Promise<OrganizacionResumen> {
    const organizacion = await this.prisma.organizacion.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion || null,
        idAdministrador,
      },
      include: RESUMEN_INCLUDE,
    });
    return resumenOf(organizacion);
  }

  /**
   * Organizaciones que administra el usuario y aquellas (no administradas) en
   * las que tiene alguna solicitud, en cualquier estado
   */
  async getMisOrganizaciones(idUsuario: string): Promise<MisOrganizacionesDto> {
    const [administradas, consentimientos] = await Promise.all([
      this.prisma.organizacion.findMany({
        where: { idAdministrador: idUsuario },
        include: RESUMEN_INCLUDE,
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.consentimiento.findMany({
        where: {
          idUsuario,
          organizacion: { idAdministrador: { not: idUsuario } },
        },
        include: { organizacion: { include: RESUMEN_INCLUDE } },
        orderBy: [
          { organizacion: { nombre: 'asc' } },
          { idOrganizacion: 'asc' },
          { anioCampania: 'desc' },
        ],
      }),
    ]);

    const miembro: MembresiaOrganizacion[] = groupBy(
      consentimientos,
      (c) => c.idOrganizacion,
    ).map((grupo) => ({
      organizacion: resumenOf(grupo[0].organizacion),
      campanias: grupo.map(toCampania).sort(byAnioDesc),
    }));

    return { administradas: administradas.map(resumenOf), miembro };
  }

  async getDetalle(idOrganizacion: string): Promise<OrganizacionDetalle> {
    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id: idOrganizacion },
      include: DETALLE_INCLUDE,
    });
    if (!organizacion) {
      throw new NotFoundException('Organización no encontrada');
    }
    return toDetalle(organizacion);
  }

  async actualizar(
    idOrganizacion: string,
    dto: UpdateOrganizacionDto,
  ): Promise<OrganizacionResumen> {
    const organizacion = await this.prisma.organizacion.update({
      where: { id: idOrganizacion },
      data: {
        nombre: dto.nombre,
        // Una descripción vacía borra la actual; sin ella se mantiene
        descripcion:
          dto.descripcion === undefined ? undefined : dto.descripcion || null,
      },
      include: RESUMEN_INCLUDE,
    });
    return resumenOf(organizacion);
  }

  /**
   * Elimina la organización (sus consentimientos se borran en cascada) y avisa
   * a quienes tenían alguna campaña aceptada o pendiente. Devuelve la
   * organización tal como estaba.
   */
  async eliminar(idOrganizacion: string): Promise<OrganizacionResumen> {
    const { resumen, emails } = await this.prisma.$transaction(async (tx) => {
      const organizacion = await tx.organizacion.findUnique({
        where: { id: idOrganizacion },
        include: RESUMEN_INCLUDE,
      });
      if (!organizacion) {
        throw new NotFoundException('Organización no encontrada');
      }

      const afectados = await tx.consentimiento.findMany({
        where: {
          idOrganizacion,
          estado: { in: [ESTADO.aceptado, ESTADO.pendiente] },
          idUsuario: { not: organizacion.idAdministrador },
        },
        distinct: ['idUsuario'],
        select: { usuario: { select: { id: true, email: true } } },
      });
      if (afectados.length > 0) {
        await tx.notificacion.createMany({
          data: afectados.map(({ usuario }) =>
            avisoData(usuario.id, 'organizacion_eliminada', {
              nombreOrganizacion: organizacion.nombre,
            }),
          ),
        });
      }
      await tx.organizacion.delete({ where: { id: idOrganizacion } });

      return {
        resumen: resumenOf(organizacion),
        emails: afectados.map(({ usuario }) => usuario.email),
      };
    });

    await Promise.all(
      emails.map((email) =>
        this.enviarCorreo('organizacion_eliminada', () =>
          this.mailerService.sendAvisoOrganizacionMail(
            email,
            'organizacion_eliminada',
            resumen.nombre,
          ),
        ),
      ),
    );
    return resumen;
  }

  /**
   * Pide a un usuario acceso a sus campañas. Los años rechazados o revocados
   * se vuelven a pedir en la misma fila; los pendientes o aceptados se omiten.
   */
  async solicitarConsentimiento(
    organizacion: Organizacion,
    dto: SolicitarConsentimientoDto,
  ): Promise<SolicitudConsentimientoResultadoDto> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        email: { equals: dto.email.trim(), mode: 'insensitive' },
      },
      select: USUARIO_BASICO_SELECT,
    });
    if (!usuario) {
      throw new NotFoundException('No hay ningún usuario con ese email');
    }
    if (usuario.id === organizacion.idAdministrador) {
      throw new BadRequestException(
        'No puedes solicitarte el consentimiento a ti mismo',
      );
    }

    const anios = uniqueSortedAnios(dto.anios);
    const where = { idOrganizacion: organizacion.id, idUsuario: usuario.id };

    const resultado = await this.prisma.$transaction(async (tx) => {
      const existentes = await tx.consentimiento.findMany({
        where: { ...where, anioCampania: { in: anios } },
        select: { anioCampania: true, estado: true },
      });
      const estados = new Map(
        existentes.map((c) => [c.anioCampania, c.estado]),
      );
      const conEstado = (...valores: string[]) =>
        anios.filter((anio) => valores.includes(estados.get(anio) ?? ''));

      const omitidos = conEstado(ESTADO.pendiente, ESTADO.aceptado);
      const reabiertos = conEstado(ESTADO.rechazado, ESTADO.revocado);
      const nuevos = anios.filter((anio) => !estados.has(anio));

      if (reabiertos.length > 0) {
        await tx.consentimiento.updateMany({
          where: { ...where, anioCampania: { in: reabiertos } },
          data: {
            estado: ESTADO.pendiente,
            fechaSolicitud: new Date(),
            fechaRespuesta: null,
            fechaRevocacion: null,
          },
        });
      }
      if (nuevos.length > 0) {
        await tx.consentimiento.createMany({
          data: nuevos.map((anioCampania) => ({
            ...where,
            anioCampania,
            estado: ESTADO.pendiente,
          })),
          skipDuplicates: true,
        });
      }

      return {
        solicitados: uniqueSortedAnios([...reabiertos, ...nuevos]),
        omitidos,
      };
    });

    if (resultado.solicitados.length > 0) {
      await this.enviarCorreo('solicitud', () =>
        this.mailerService.sendSolicitudConsentimientoMail(
          usuario.email,
          organizacion.nombre,
          resultado.solicitados,
        ),
      );
    }
    return resultado;
  }

  /**
   * Fija las campañas que el administrador aporta a su organización: los años
   * de `anios` quedan aceptados sin solicitud ni aviso, y el resto de sus
   * filas (en cualquier estado) se borran.
   */
  async setCampaniasAdministrador(
    organizacion: Organizacion,
    anios: number[],
  ): Promise<OrganizacionDetalle> {
    const where = {
      idOrganizacion: organizacion.id,
      idUsuario: organizacion.idAdministrador,
    };
    const ahora = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.consentimiento.deleteMany({
        where: { ...where, anioCampania: { notIn: anios } },
      });
      // Las que aceptó como miembro antes de administrar se conservan tal cual
      await tx.consentimiento.updateMany({
        where: {
          ...where,
          anioCampania: { in: anios },
          estado: { not: ESTADO.aceptado },
        },
        data: {
          estado: ESTADO.aceptado,
          fechaRespuesta: ahora,
          fechaRevocacion: null,
        },
      });
      await tx.consentimiento.createMany({
        data: anios.map((anioCampania) => ({
          ...where,
          anioCampania,
          estado: ESTADO.aceptado,
          fechaRespuesta: ahora,
        })),
        skipDuplicates: true,
      });
    });

    return this.getDetalle(organizacion.id);
  }

  /**
   * Cancela una solicitud pendiente (se borra) o revoca una campaña aceptada
   * (se avisa al miembro). Las rechazadas o ya revocadas no admiten cambios.
   */
  async revocarConsentimiento(
    organizacion: Organizacion,
    idConsentimiento: string,
  ): Promise<OrganizacionDetalle> {
    const consentimiento = await this.prisma.consentimiento.findFirst({
      where: {
        id: idConsentimiento,
        idOrganizacion: organizacion.id,
        // Las del administrador se gestionan con `setCampaniasAdministrador`
        idUsuario: { not: organizacion.idAdministrador },
      },
      include: { usuario: { select: USUARIO_BASICO_SELECT } },
    });
    if (!consentimiento) {
      throw new NotFoundException('Consentimiento no encontrado');
    }

    const conflicto = () =>
      new ConflictException(
        'Solo se pueden cancelar solicitudes pendientes o revocar consentimientos aceptados',
      );

    if (consentimiento.estado === ESTADO.pendiente) {
      // Si el usuario la ha respondido entretanto, no se borra
      const { count } = await this.prisma.consentimiento.deleteMany({
        where: { id: consentimiento.id, estado: ESTADO.pendiente },
      });
      if (count === 0) throw conflicto();
    } else if (consentimiento.estado === ESTADO.aceptado) {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.consentimiento.updateMany({
          where: { id: consentimiento.id, estado: ESTADO.aceptado },
          data: { estado: ESTADO.revocado, fechaRevocacion: new Date() },
        });
        if (count === 0) throw conflicto();
        await tx.notificacion.create({
          data: avisoData(consentimiento.idUsuario, 'consentimiento_revocado', {
            nombreOrganizacion: organizacion.nombre,
            anios: [consentimiento.anioCampania],
          }),
        });
      });
      await this.enviarCorreo('consentimiento_revocado', () =>
        this.mailerService.sendAvisoOrganizacionMail(
          consentimiento.usuario.email,
          'consentimiento_revocado',
          organizacion.nombre,
          [consentimiento.anioCampania],
        ),
      );
    } else {
      throw conflicto();
    }

    return this.getDetalle(organizacion.id);
  }

  /**
   * Revoca todas las campañas aceptadas del usuario y borra sus solicitudes
   * pendientes o rechazadas. Solo se le avisa si tenía alguna aceptada.
   */
  async expulsarMiembro(
    organizacion: Organizacion,
    idUsuario: string,
  ): Promise<OrganizacionDetalle> {
    const noEncontrado = () =>
      new NotFoundException(
        'El usuario no tiene solicitudes en esta organización',
      );
    if (idUsuario === organizacion.idAdministrador) throw noEncontrado();

    const where = { idOrganizacion: organizacion.id, idUsuario };
    const expulsado = await this.prisma.$transaction(async (tx) => {
      const consentimientos = await tx.consentimiento.findMany({
        where,
        include: { usuario: { select: USUARIO_BASICO_SELECT } },
      });
      const [primero] = consentimientos;
      if (!primero) throw noEncontrado();

      const aceptados = uniqueSortedAnios(
        consentimientos
          .filter((c) => c.estado === ESTADO.aceptado)
          .map((c) => c.anioCampania),
      );

      await tx.consentimiento.updateMany({
        where: { ...where, estado: ESTADO.aceptado },
        data: { estado: ESTADO.revocado, fechaRevocacion: new Date() },
      });
      await tx.consentimiento.deleteMany({
        where: {
          ...where,
          estado: { in: [ESTADO.pendiente, ESTADO.rechazado] },
        },
      });
      if (aceptados.length > 0) {
        await tx.notificacion.create({
          data: avisoData(idUsuario, 'miembro_expulsado', {
            nombreOrganizacion: organizacion.nombre,
            anios: aceptados,
          }),
        });
      }
      return { email: primero.usuario.email, aceptados };
    });

    if (expulsado.aceptados.length > 0) {
      await this.enviarCorreo('miembro_expulsado', () =>
        this.mailerService.sendAvisoOrganizacionMail(
          expulsado.email,
          'miembro_expulsado',
          organizacion.nombre,
          expulsado.aceptados,
        ),
      );
    }

    return this.getDetalle(organizacion.id);
  }

  /**
   * Pasa la administración a un miembro (con alguna campaña aceptada). Sus
   * campañas aceptadas siguen contando y pasa a gestionarlas él mismo; las que
   * no había aceptado se borran, porque ya no tiene a quién responder. El
   * administrador saliente queda como miembro con las campañas que aportaba.
   */
  async transferir(
    organizacion: Organizacion,
    idUsuario: string,
  ): Promise<OrganizacionResumen> {
    const miembro =
      idUsuario === organizacion.idAdministrador
        ? null
        : await this.prisma.consentimiento.findFirst({
            where: {
              idOrganizacion: organizacion.id,
              idUsuario,
              estado: ESTADO.aceptado,
            },
            select: { usuario: { select: USUARIO_BASICO_SELECT } },
          });
    if (!miembro) {
      throw new BadRequestException(
        'Solo puedes transferir la organización a uno de sus miembros',
      );
    }

    const resumen = await this.prisma.$transaction(async (tx) => {
      const actualizada = await tx.organizacion.update({
        where: { id: organizacion.id },
        data: { idAdministrador: idUsuario },
        include: RESUMEN_INCLUDE,
      });
      await tx.consentimiento.deleteMany({
        where: {
          idOrganizacion: organizacion.id,
          idUsuario,
          estado: { not: ESTADO.aceptado },
        },
      });
      await tx.notificacion.create({
        data: avisoData(idUsuario, 'administracion_transferida', {
          nombreOrganizacion: actualizada.nombre,
        }),
      });
      return resumenOf(actualizada);
    });

    await this.enviarCorreo('administracion_transferida', () =>
      this.mailerService.sendAvisoOrganizacionMail(
        miembro.usuario.email,
        'administracion_transferida',
        resumen.nombre,
      ),
    );
    return resumen;
  }

  /**
   * Parcelas del miembro con algún cultivo de sus campañas aceptadas, con el
   * último cultivo y el número de cultivos calculados solo sobre esas campañas
   */
  async getParcelasMiembro(
    idOrganizacion: string,
    idUsuario: string,
  ): Promise<MiembroParcelas> {
    const anios = uniqueSortedAnios(
      (await this.accesoService.getConsentimientosAceptados(idOrganizacion))
        .filter((c) => c.idUsuario === idUsuario)
        .map((c) => c.anio),
    );
    const usuario =
      anios.length > 0
        ? await this.prisma.usuario.findUnique({
            where: { id: idUsuario },
            select: USUARIO_BASICO_SELECT,
          })
        : null;
    if (!usuario) {
      throw new NotFoundException(
        'El usuario no ha aceptado ninguna campaña en esta organización',
      );
    }

    const [parcelas, geoms] = await Promise.all([
      this.parcelaService.findResumenByPropietario(idUsuario, anios),
      this.parcelaService.getGeomsByPropietario(idUsuario),
    ]);
    return {
      usuario,
      anios,
      parcelas: parcelas.map((p) => ({ ...p, geom: geoms.get(p.id) ?? null })),
    };
  }

  // ─── Panel de administración de la plataforma ───

  findMany(params: {
    where?: Prisma.OrganizacionWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.OrganizacionOrderByWithRelationInput[];
  }) {
    return this.prisma.organizacion.findMany({
      ...params,
      include: ORGANIZACION_ADMIN_LIST_INCLUDE,
    });
  }

  count(where?: Prisma.OrganizacionWhereInput): Promise<number> {
    return this.prisma.organizacion.count({ where });
  }

  findOneAdmin(id: string) {
    return this.prisma.organizacion.findUnique({
      where: { id },
      include: {
        administrador: { select: USUARIO_BASICO_SELECT },
        consentimientos: {
          include: { usuario: { select: USUARIO_BASICO_SELECT } },
          orderBy: [{ idUsuario: 'asc' }, { anioCampania: 'desc' }],
        },
      },
    });
  }

  findManyConsentimientos(params: {
    where?: Prisma.ConsentimientoWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.ConsentimientoOrderByWithRelationInput[];
  }) {
    return this.prisma.consentimiento.findMany({
      ...params,
      include: CONSENTIMIENTO_ADMIN_INCLUDE,
    });
  }

  countConsentimientos(where?: Prisma.ConsentimientoWhereInput) {
    return this.prisma.consentimiento.count({ where });
  }

  findConsentimiento(id: string) {
    return this.prisma.consentimiento.findUnique({
      where: { id },
      include: CONSENTIMIENTO_ADMIN_INCLUDE,
    });
  }

  /** Los correos no deben hacer fallar la petición: si fallan, se registra */
  private async enviarCorreo(tipo: string, envio: () => Promise<void>) {
    try {
      await envio();
    } catch (error) {
      this.logger.error(`Mail "${tipo}" failed: ${errorMessage(error)}`);
    }
  }
}
