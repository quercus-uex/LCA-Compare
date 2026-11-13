import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AvisoDatos,
  AvisoDto,
  NotificacionesDto,
  NotificacionTipo,
  SolicitudPendienteDto,
} from 'common/organizacion';
import { PrismaService } from '../prisma/prisma.service';
import {
  ESTADO,
  USUARIO_BASICO_SELECT,
  avisoData,
  groupBy,
  uniqueSortedAnios,
} from './organizacion.helpers';
import type { ResponderConsentimientosDto } from './dto/responder-consentimientos.dto';

/** Avisos más recientes que se devuelven */
export const AVISOS_RECIENTES = 20;

/**
 * Bandeja del usuario: sus solicitudes pendientes (que se leen de
 * `Consentimiento`) y sus avisos informativos (`Notificacion`)
 */
@Injectable()
export class NotificacionService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotificaciones(idUsuario: string): Promise<NotificacionesDto> {
    const [pendientes, avisos, sinLeer] = await Promise.all([
      this.prisma.consentimiento.findMany({
        where: {
          idUsuario,
          estado: ESTADO.pendiente,
          // Las de la organización que administra no cuentan mientras la administre
          organizacion: { idAdministrador: { not: idUsuario } },
        },
        include: {
          organizacion: {
            select: {
              id: true,
              nombre: true,
              administrador: { select: USUARIO_BASICO_SELECT },
            },
          },
        },
        orderBy: [
          { organizacion: { nombre: 'asc' } },
          { idOrganizacion: 'asc' },
          { anioCampania: 'asc' },
        ],
      }),
      this.prisma.notificacion.findMany({
        where: { idUsuario },
        orderBy: [{ fechaCreacion: 'desc' }, { id: 'asc' }],
        take: AVISOS_RECIENTES,
      }),
      this.prisma.notificacion.count({ where: { idUsuario, leida: false } }),
    ]);

    const solicitudes: SolicitudPendienteDto[] = groupBy(
      pendientes,
      (c) => c.idOrganizacion,
    ).map((grupo) => ({
      organizacion: grupo[0].organizacion,
      campanias: grupo
        .map((c) => ({
          idConsentimiento: c.id,
          anio: c.anioCampania,
          fechaSolicitud: c.fechaSolicitud.toISOString(),
        }))
        .sort((a, b) => a.anio - b.anio),
    }));

    return {
      solicitudes,
      avisos: avisos.map(
        (n): AvisoDto => ({
          id: n.id,
          tipo: n.tipo as NotificacionTipo,
          datos: n.datos as AvisoDatos,
          leida: n.leida,
          fechaCreacion: n.fechaCreacion.toISOString(),
        }),
      ),
      sinLeer,
    };
  }

  /** Marca como leídos los avisos indicados, o todos si no se indica ninguno */
  async marcarLeidas(
    idUsuario: string,
    ids?: string[],
  ): Promise<NotificacionesDto> {
    await this.prisma.notificacion.updateMany({
      where: {
        idUsuario,
        leida: false,
        ...(ids && { id: { in: ids } }),
      },
      data: { leida: true },
    });
    return this.getNotificaciones(idUsuario);
  }

  /**
   * Acepta o rechaza solicitudes propias pendientes. Si alguna no existe, no
   * es del usuario o ya está respondida, no se responde ninguna. Cada
   * administrador recibe un aviso por organización con los años respondidos.
   */
  async responder(
    idUsuario: string,
    dto: ResponderConsentimientosDto,
  ): Promise<NotificacionesDto> {
    const ids = [...new Set(dto.ids)];
    const yaRespondida = () =>
      new ConflictException('Alguna de las solicitudes ya se ha respondido');

    await this.prisma.$transaction(async (tx) => {
      const consentimientos = await tx.consentimiento.findMany({
        where: {
          id: { in: ids },
          idUsuario,
          organizacion: { idAdministrador: { not: idUsuario } },
        },
        include: {
          organizacion: {
            select: { id: true, nombre: true, idAdministrador: true },
          },
          usuario: { select: { nombre: true, apellidos: true, email: true } },
        },
      });
      if (consentimientos.length !== ids.length) {
        throw new NotFoundException('Solicitud no encontrada');
      }
      if (consentimientos.some((c) => c.estado !== ESTADO.pendiente)) {
        throw yaRespondida();
      }

      const { count } = await tx.consentimiento.updateMany({
        where: { id: { in: ids }, estado: ESTADO.pendiente },
        data: { estado: dto.respuesta, fechaRespuesta: new Date() },
      });
      // Otra petición la ha respondido entretanto: se deshace todo
      if (count !== ids.length) throw yaRespondida();

      const tipo: NotificacionTipo =
        dto.respuesta === ESTADO.aceptado
          ? 'consentimiento_aceptado'
          : 'consentimiento_rechazado';
      await tx.notificacion.createMany({
        data: groupBy(consentimientos, (c) => c.idOrganizacion).map((grupo) =>
          avisoData(grupo[0].organizacion.idAdministrador, tipo, {
            nombreOrganizacion: grupo[0].organizacion.nombre,
            anios: uniqueSortedAnios(grupo.map((c) => c.anioCampania)),
            usuario: grupo[0].usuario,
          }),
        ),
      });
    });

    return this.getNotificaciones(idUsuario);
  }
}
