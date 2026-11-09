import type { ParcelaResumen } from './parcela.js';

export const CONSENTIMIENTO_ESTADOS = [
  'pendiente',
  'aceptado',
  'rechazado',
  'revocado',
] as const;

export type ConsentimientoEstado = (typeof CONSENTIMIENTO_ESTADOS)[number];

/** Respuesta del usuario a una solicitud pendiente */
export type ConsentimientoRespuesta = Extract<
  ConsentimientoEstado,
  'aceptado' | 'rechazado'
>;

/**
 * Avisos informativos. Los de revocación, expulsión, borrado y transferencia
 * van al miembro afectado; los de respuesta, al administrador.
 */
export const NOTIFICACION_TIPOS = [
  'consentimiento_revocado',
  'miembro_expulsado',
  'organizacion_eliminada',
  'administracion_transferida',
  'consentimiento_aceptado',
  'consentimiento_rechazado',
] as const;

export type NotificacionTipo = (typeof NOTIFICACION_TIPOS)[number];

/** Primer año de campaña que se puede solicitar */
export const CAMPANIA_MIN_ANIO = 2020;

/** Último año de campaña que se puede solicitar: el siguiente al actual (UTC) */
export const campaniaMaxAnio = (now = new Date()): number =>
  now.getUTCFullYear() + 1;

export type UsuarioBasico = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
};

export type CampaniaConsentimiento = {
  idConsentimiento: string;
  anio: number;
  estado: ConsentimientoEstado;
  fechaSolicitud: string;
  fechaRespuesta: string | null;
};

export type OrganizacionResumen = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaCreacion: string;
  administrador: UsuarioBasico;
  /** Usuarios con al menos una campaña aceptada */
  numMiembros: number;
};

/** Usuario con alguna solicitud en la organización y el estado de cada campaña */
export type MiembroOrganizacion = {
  usuario: UsuarioBasico;
  campanias: CampaniaConsentimiento[];
};

export type OrganizacionDetalle = OrganizacionResumen & {
  miembros: MiembroOrganizacion[];
};

/** Organización de la que el usuario es miembro o invitado */
export type MembresiaOrganizacion = {
  organizacion: OrganizacionResumen;
  campanias: CampaniaConsentimiento[];
};

export type MisOrganizacionesDto = {
  administradas: OrganizacionResumen[];
  miembro: MembresiaOrganizacion[];
};

export type CreateOrganizacionDto = {
  nombre: string;
  descripcion?: string;
};

export type UpdateOrganizacionDto = Partial<CreateOrganizacionDto>;

export type SolicitarConsentimientoDto = {
  email: string;
  anios: number[];
};

/** Años solicitados y años omitidos por estar ya pendientes o aceptados */
export type SolicitudConsentimientoResultadoDto = {
  solicitados: number[];
  omitidos: number[];
};

export type TransferirOrganizacionDto = {
  idUsuario: string;
};

export type ResponderConsentimientosDto = {
  ids: string[];
  respuesta: ConsentimientoRespuesta;
};

export type SolicitudPendienteDto = {
  organizacion: Pick<OrganizacionResumen, 'id' | 'nombre' | 'administrador'>;
  campanias: Pick<
    CampaniaConsentimiento,
    'idConsentimiento' | 'anio' | 'fechaSolicitud'
  >[];
};

export type AvisoDatos = {
  nombreOrganizacion: string;
  anios?: number[];
  /** Usuario que respondió, en los avisos de respuesta al administrador */
  usuario?: Pick<UsuarioBasico, 'nombre' | 'apellidos' | 'email'>;
};

export type AvisoDto = {
  id: string;
  tipo: NotificacionTipo;
  datos: AvisoDatos;
  leida: boolean;
  fechaCreacion: string;
};

export type NotificacionesDto = {
  solicitudes: SolicitudPendienteDto[];
  avisos: AvisoDto[];
  /** Avisos sin leer (las solicitudes pendientes se cuentan aparte) */
  sinLeer: number;
};

export type MarcarAvisosLeidosDto = {
  /** Sin ids se marcan todos */
  ids?: string[];
};

/**
 * Cómo accede el usuario a una parcela ajena: como administrador de las
 * organizaciones en las que su propietario ha consentido esas campañas.
 */
export type AccesoOrganizacion = {
  propietario: UsuarioBasico;
  organizaciones: Pick<OrganizacionResumen, 'id' | 'nombre'>[];
  anios: number[];
};

/** Parcelas de un miembro, resumidas solo con sus campañas consentidas */
export type MiembroParcelasDto = {
  usuario: UsuarioBasico;
  anios: number[];
  parcelas: ParcelaResumen[];
};
