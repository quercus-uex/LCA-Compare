import type {
  AvisoDatos,
  CampaniaConsentimiento,
  ConsentimientoEstado,
  NotificacionTipo,
  UsuarioBasico,
} from 'common/organizacion';
import type { Consentimiento, Prisma } from '../generated/prisma/client';

export const USUARIO_BASICO_SELECT = {
  id: true,
  nombre: true,
  apellidos: true,
  email: true,
} satisfies Prisma.UsuarioSelect;

export const ESTADO = {
  pendiente: 'pendiente',
  aceptado: 'aceptado',
  rechazado: 'rechazado',
  revocado: 'revocado',
} as const satisfies Record<ConsentimientoEstado, ConsentimientoEstado>;

export function toCampania(
  c: Pick<
    Consentimiento,
    'id' | 'anioCampania' | 'estado' | 'fechaSolicitud' | 'fechaRespuesta'
  >,
): CampaniaConsentimiento {
  return {
    idConsentimiento: c.id,
    anio: c.anioCampania,
    estado: c.estado as ConsentimientoEstado,
    fechaSolicitud: c.fechaSolicitud.toISOString(),
    fechaRespuesta: c.fechaRespuesta?.toISOString() ?? null,
  };
}

export const byAnioDesc = (a: { anio: number }, b: { anio: number }) =>
  b.anio - a.anio;

export const byAnioAsc = (a: { anio: number }, b: { anio: number }) =>
  a.anio - b.anio;

/** Ordena por apellidos y nombre, como se listan los miembros */
export const byApellidosNombre = (
  a: Pick<UsuarioBasico, 'nombre' | 'apellidos'>,
  b: Pick<UsuarioBasico, 'nombre' | 'apellidos'>,
) =>
  a.apellidos.localeCompare(b.apellidos, 'es') ||
  a.nombre.localeCompare(b.nombre, 'es');

/** Agrupa conservando el orden de la primera aparición de cada clave */
export function groupBy<T>(items: T[], key: (item: T) => string): T[][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return [...groups.values()];
}

export const uniqueSortedAnios = (anios: number[]): number[] =>
  [...new Set(anios)].sort((a, b) => a - b);

/** Fila de un aviso; `datos` copia el nombre para que sobreviva al borrado */
export function avisoData(
  idUsuario: string,
  tipo: NotificacionTipo,
  datos: AvisoDatos,
): Prisma.NotificacionCreateManyInput {
  return { idUsuario, tipo, datos };
}
