import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AccesoOrganizacion } from 'common/organizacion';
import { PrismaService } from '../prisma/prisma.service';
import type { Organizacion } from '../generated/prisma/client';
import {
  ESTADO,
  USUARIO_BASICO_SELECT,
  uniqueSortedAnios,
} from './organizacion.helpers';

export type ConsentimientoAceptado = { idUsuario: string; anio: number };

/**
 * Única fuente de la regla de acceso de una organización: su administrador
 * ve los datos de las campañas que cada miembro ha aceptado. Las del propio
 * administrador también cuentan: las que aporta él mismo y las que aceptó
 * cuando aún no administraba la organización.
 *
 * Vive aparte de `OrganizacionService` para que parcelas, resultados,
 * comparativas y estadísticas puedan usarla sin depender del módulo de
 * organizaciones (que a su vez usa `ParcelaService`).
 */
@Injectable()
export class OrganizacionAccesoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pares usuario-año aceptados en la organización, con los del administrador */
  async getConsentimientosAceptados(
    idOrganizacion: string,
  ): Promise<ConsentimientoAceptado[]> {
    const consentimientos = await this.prisma.consentimiento.findMany({
      where: { idOrganizacion, estado: ESTADO.aceptado },
      select: { idUsuario: true, anioCampania: true },
      orderBy: [{ idUsuario: 'asc' }, { anioCampania: 'asc' }],
    });
    return consentimientos.map((c) => ({
      idUsuario: c.idUsuario,
      anio: c.anioCampania,
    }));
  }

  /**
   * Pares usuario-año de los propietarios de `idsParcela` que `viewerId` ve
   * como administrador de sus organizaciones
   */
  async getConsentimientosDeParcelas(
    viewerId: string,
    idsParcela: string[],
  ): Promise<ConsentimientoAceptado[]> {
    const consentimientos = await this.prisma.consentimiento.findMany({
      where: {
        estado: ESTADO.aceptado,
        organizacion: { idAdministrador: viewerId },
        usuario: { parcelas: { some: { id: { in: idsParcela } } } },
      },
      select: { idUsuario: true, anioCampania: true },
      distinct: ['idUsuario', 'anioCampania'],
      orderBy: [{ idUsuario: 'asc' }, { anioCampania: 'asc' }],
    });
    return consentimientos.map((c) => ({
      idUsuario: c.idUsuario,
      anio: c.anioCampania,
    }));
  }

  /**
   * Campañas de `idPropietario` que ve `viewerId` como administrador de sus
   * organizaciones, o null si no ve ninguna (o si es el propio propietario)
   */
  async getAccesoOrganizacion(
    viewerId: string,
    idPropietario: string,
  ): Promise<AccesoOrganizacion | null> {
    if (viewerId === idPropietario) return null;

    const consentimientos = await this.prisma.consentimiento.findMany({
      where: {
        idUsuario: idPropietario,
        estado: ESTADO.aceptado,
        organizacion: { idAdministrador: viewerId },
      },
      select: {
        anioCampania: true,
        organizacion: { select: { id: true, nombre: true } },
        usuario: { select: USUARIO_BASICO_SELECT },
      },
    });
    const [primero] = consentimientos;
    if (!primero) return null;

    const organizaciones = new Map(
      consentimientos.map((c) => [c.organizacion.id, c.organizacion]),
    );
    return {
      propietario: primero.usuario,
      organizaciones: [...organizaciones.values()].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es'),
      ),
      anios: uniqueSortedAnios(consentimientos.map((c) => c.anioCampania)),
    };
  }

  /** Id y nombre de la organización, p. ej. para describir un filtro */
  getOrganizacionRef(
    idOrganizacion: string,
  ): Promise<Pick<Organizacion, 'id' | 'nombre'> | null> {
    return this.prisma.organizacion.findUnique({
      where: { id: idOrganizacion },
      select: { id: true, nombre: true },
    });
  }

  /**
   * La organización si `viewerId` la administra. Si no hay usuario, la
   * organización no existe o la administra otro, se rechaza con 403
   */
  async getOrganizacionAdministrada(
    idOrganizacion: string,
    viewerId: string | undefined,
  ): Promise<Organizacion> {
    const organizacion = viewerId
      ? await this.prisma.organizacion.findUnique({
          where: { id: idOrganizacion },
        })
      : null;
    if (!organizacion || organizacion.idAdministrador !== viewerId) {
      throw new ForbiddenException(
        'No eres el administrador de esta organización',
      );
    }
    return organizacion;
  }
}
