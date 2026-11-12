import { ApiProperty } from '@nestjs/swagger';
import {
  CONSENTIMIENTO_ESTADOS,
  NOTIFICACION_TIPOS,
  type AvisoDatos,
  type AvisoDto as AvisoShape,
  type CampaniaConsentimiento,
  type ConsentimientoEstado,
  type MembresiaOrganizacion,
  type MiembroOrganizacion,
  type MiembroParcelasDto as MiembroParcelasShape,
  type MisOrganizacionesDto as MisOrganizacionesShape,
  type NotificacionesDto as NotificacionesShape,
  type NotificacionTipo,
  type OrganizacionDetalle,
  type OrganizacionResumen,
  type SolicitudConsentimientoResultadoDto as SolicitudConsentimientoResultadoShape,
  type SolicitudPendienteDto as SolicitudPendienteShape,
  type UsuarioBasico,
} from 'common/organizacion';
import { ParcelaResumenDto } from '../../parcela/dto/parcela.dto';
import { UsuarioBasicoDto } from './organizacion-acceso.dto';

export class CampaniaConsentimientoDto implements CampaniaConsentimiento {
  @ApiProperty({ format: 'uuid' })
  idConsentimiento: string;

  anio: number;

  @ApiProperty({ enum: CONSENTIMIENTO_ESTADOS })
  estado: ConsentimientoEstado;

  @ApiProperty({ format: 'date-time' })
  fechaSolicitud: string;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  fechaRespuesta: string | null;
}

export class OrganizacionResumenDto implements OrganizacionResumen {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;

  @ApiProperty({ nullable: true, type: String })
  descripcion: string | null;

  @ApiProperty({ format: 'date-time' })
  fechaCreacion: string;

  administrador: UsuarioBasicoDto;

  @ApiProperty({ description: 'Usuarios con al menos una campaña aceptada' })
  numMiembros: number;
}

export class MiembroOrganizacionDto implements MiembroOrganizacion {
  usuario: UsuarioBasicoDto;

  @ApiProperty({
    type: [CampaniaConsentimientoDto],
    description: 'Del año más reciente al más antiguo',
  })
  campanias: CampaniaConsentimientoDto[];
}

export class OrganizacionDetalleDto
  extends OrganizacionResumenDto
  implements OrganizacionDetalle
{
  @ApiProperty({
    type: [MiembroOrganizacionDto],
    description:
      'Usuarios con alguna solicitud en la organización (sin el administrador), por apellidos y nombre',
  })
  miembros: MiembroOrganizacionDto[];

  @ApiProperty({
    type: [CampaniaConsentimientoDto],
    description:
      'Campañas propias que el administrador aporta a la organización, del año más reciente al más antiguo',
  })
  campaniasAdministrador: CampaniaConsentimientoDto[];
}

export class MembresiaOrganizacionDto implements MembresiaOrganizacion {
  organizacion: OrganizacionResumenDto;

  @ApiProperty({
    type: [CampaniaConsentimientoDto],
    description: 'Del año más reciente al más antiguo',
  })
  campanias: CampaniaConsentimientoDto[];
}

export class MisOrganizacionesDto implements MisOrganizacionesShape {
  @ApiProperty({ type: [OrganizacionResumenDto] })
  administradas: OrganizacionResumenDto[];

  @ApiProperty({
    type: [MembresiaOrganizacionDto],
    description:
      'Organizaciones (no administradas) en las que el usuario tiene alguna solicitud',
  })
  miembro: MembresiaOrganizacionDto[];
}

export class SolicitudConsentimientoResultadoDto implements SolicitudConsentimientoResultadoShape {
  @ApiProperty({ type: [Number], description: 'Años solicitados' })
  solicitados: number[];

  @ApiProperty({
    type: [Number],
    description: 'Años omitidos por estar ya pendientes o aceptados',
  })
  omitidos: number[];
}

export class MiembroParcelasDto implements MiembroParcelasShape {
  usuario: UsuarioBasicoDto;

  @ApiProperty({ type: [Number], description: 'Años de campaña aceptados' })
  anios: number[];

  @ApiProperty({
    type: [ParcelaResumenDto],
    description:
      'Parcelas con algún cultivo de los años aceptados, resumidas solo con esos cultivos',
  })
  parcelas: ParcelaResumenDto[];
}

class OrganizacionSolicitanteDto implements Pick<
  OrganizacionResumen,
  'id' | 'nombre' | 'administrador'
> {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;

  administrador: UsuarioBasicoDto;
}

class CampaniaSolicitadaDto implements Pick<
  CampaniaConsentimiento,
  'idConsentimiento' | 'anio' | 'fechaSolicitud'
> {
  @ApiProperty({ format: 'uuid' })
  idConsentimiento: string;

  anio: number;

  @ApiProperty({ format: 'date-time' })
  fechaSolicitud: string;
}

export class SolicitudPendienteDto implements SolicitudPendienteShape {
  organizacion: OrganizacionSolicitanteDto;

  @ApiProperty({
    type: [CampaniaSolicitadaDto],
    description: 'Del año más antiguo al más reciente',
  })
  campanias: CampaniaSolicitadaDto[];
}

class UsuarioRespuestaDto implements Pick<
  UsuarioBasico,
  'nombre' | 'apellidos' | 'email'
> {
  nombre: string;

  apellidos: string;

  @ApiProperty({ format: 'email' })
  email: string;
}

class AvisoDatosDto implements AvisoDatos {
  nombreOrganizacion: string;

  @ApiProperty({ type: [Number], required: false })
  anios?: number[];

  @ApiProperty({
    required: false,
    description: 'Usuario que respondió, en los avisos al administrador',
  })
  usuario?: UsuarioRespuestaDto;
}

export class AvisoDto implements AvisoShape {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: NOTIFICACION_TIPOS })
  tipo: NotificacionTipo;

  datos: AvisoDatosDto;

  leida: boolean;

  @ApiProperty({ format: 'date-time' })
  fechaCreacion: string;
}

export class NotificacionesDto implements NotificacionesShape {
  @ApiProperty({
    type: [SolicitudPendienteDto],
    description: 'Solicitudes pendientes agrupadas por organización',
  })
  solicitudes: SolicitudPendienteDto[];

  @ApiProperty({
    type: [AvisoDto],
    description: 'Los 20 avisos más recientes',
  })
  avisos: AvisoDto[];

  @ApiProperty({ description: 'Avisos sin leer' })
  sinLeer: number;
}
