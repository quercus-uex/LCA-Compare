import { CAMPANIA_MIN_ANIO, campaniaMaxAnio } from 'common/organizacion';
import type { TFunction } from 'i18next';
import { ApiError } from '../../common/api.ts';
import type {
  CampaniaConsentimiento,
  ConsentimientoEstado,
  UsuarioBasico,
} from '../../hooks/organizacion.hook.tsx';

/** Años de campaña que se pueden solicitar, del más reciente al más antiguo */
export const campaniasSolicitables = (): number[] => {
  const max = campaniaMaxAnio();
  return Array.from({ length: max - CAMPANIA_MIN_ANIO + 1 }, (_, i) => max - i);
};

export const ordenarCampanias = (campanias: CampaniaConsentimiento[]) =>
  [...campanias].sort((a, b) => a.anio - b.anio);

export const aniosEnEstado = (campanias: CampaniaConsentimiento[], estado: ConsentimientoEstado) =>
  campanias.filter((c) => c.estado === estado).map((c) => c.anio).sort((a, b) => a - b);

export const tieneAceptadas = (campanias: CampaniaConsentimiento[]) =>
  campanias.some((c) => c.estado === 'aceptado');

export const nombreCompleto = (u: Pick<UsuarioBasico, 'nombre' | 'apellidos'>) =>
  [u.nombre, u.apellidos].filter(Boolean).join(' ');

/** Iniciales para el avatar: primera letra del nombre y de los apellidos */
export const iniciales = (u: Pick<UsuarioBasico, 'nombre' | 'apellidos'>) =>
  [u.nombre, u.apellidos].map((s) => s.trim().charAt(0)).join('').toUpperCase();

export const organizacionUrl = (id: string) => `/organizaciones/${id}`;

export const miembroUrl = (idOrganizacion: string, idUsuario: string) =>
  `/organizaciones/${idOrganizacion}/miembros/${idUsuario}`;

/** Mensaje para un error de las acciones de organización */
export const describeOrganizacionError = (e: unknown, t: TFunction) => {
  if (!(e instanceof ApiError)) return t('organizaciones.errors.network');
  if (e.status === 403) return t('organizaciones.errors.forbidden');
  if (e.status === 404) return t('organizaciones.errors.notFound');
  if (e.status === 409) return t('organizaciones.errors.conflict');
  return t('organizaciones.errors.generic');
};
