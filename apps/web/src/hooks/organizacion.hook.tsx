import type {
  CreateOrganizacionDto,
  MiembroParcelasDto,
  MisOrganizacionesDto,
  OrganizacionDetalle,
  OrganizacionResumen,
  SolicitarConsentimientoDto,
  SolicitudConsentimientoResultadoDto,
  TransferirOrganizacionDto,
  UpdateOrganizacionDto,
} from 'common/organizacion';
import { useEffect, useState } from 'react';
import { apiFetch } from '../common/api.ts';
import { useAuth } from './auth.hook.tsx';
import type { ParcelaResumen } from './parcela.hook.tsx';

export type {
  CampaniaConsentimiento,
  ConsentimientoEstado,
  MembresiaOrganizacion,
  MiembroOrganizacion,
  MisOrganizacionesDto,
  OrganizacionDetalle,
  OrganizacionResumen,
  UsuarioBasico,
} from 'common/organizacion';

/** Parcelas de un miembro con su geometría, como en «Mis parcelas» */
export type MiembroParcelas = Omit<MiembroParcelasDto, 'parcelas'> & { parcelas: ParcelaResumen[] };

const json = (method: 'POST' | 'PATCH', body: unknown) => ({ method, body: JSON.stringify(body) });

const base = (id: string) => `/organizaciones/${encodeURIComponent(id)}`;

/** Llamadas a la API de organizaciones; no guardan estado, así que no necesitan proveedor */
export const organizacionApi = {
  getMias: (signal?: AbortSignal) => apiFetch<MisOrganizacionesDto>('/organizaciones', { signal }),

  create: (dto: CreateOrganizacionDto) =>
    apiFetch<OrganizacionResumen>('/organizaciones', json('POST', dto)),

  getById: (id: string, signal?: AbortSignal) => apiFetch<OrganizacionDetalle>(base(id), { signal }),

  update: (id: string, dto: UpdateOrganizacionDto) =>
    apiFetch<OrganizacionResumen>(base(id), json('PATCH', dto)),

  remove: (id: string) => apiFetch<OrganizacionResumen>(base(id), { method: 'DELETE' }),

  solicitar: (id: string, dto: SolicitarConsentimientoDto) =>
    apiFetch<SolicitudConsentimientoResultadoDto>(`${base(id)}/solicitudes`, json('POST', dto)),

  /** Cancela una solicitud pendiente o revoca una campaña aceptada */
  retirarConsentimiento: (id: string, idConsentimiento: string) =>
    apiFetch<OrganizacionDetalle>(
      `${base(id)}/consentimientos/${encodeURIComponent(idConsentimiento)}`,
      { method: 'DELETE' },
    ),

  expulsar: (id: string, idUsuario: string) =>
    apiFetch<OrganizacionDetalle>(`${base(id)}/miembros/${encodeURIComponent(idUsuario)}`, { method: 'DELETE' }),

  transferir: (id: string, dto: TransferirOrganizacionDto) =>
    apiFetch<OrganizacionResumen>(`${base(id)}/transferir`, json('POST', dto)),

  getMiembroParcelas: (id: string, idUsuario: string, signal?: AbortSignal) =>
    apiFetch<MiembroParcelas>(`${base(id)}/miembros/${encodeURIComponent(idUsuario)}/parcelas`, { signal }),
};

const NINGUNA: OrganizacionResumen[] = [];

/**
 * Organizaciones que administra el usuario con sesión, para ofrecerlas como
 * filtro. Vacío sin sesión, mientras carga o si falla la petición.
 */
export function useOrganizacionesAdministradas(): OrganizacionResumen[] {
  const { usuario } = useAuth();
  const [state, setState] = useState<{ idUsuario: string; organizaciones: OrganizacionResumen[] } | null>(null);
  const idUsuario = usuario?.id;

  useEffect(() => {
    if (!idUsuario) return;
    const controller = new AbortController();
    organizacionApi.getMias(controller.signal)
      .then((mias) => setState({ idUsuario, organizaciones: mias.administradas }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [idUsuario]);

  // Tras cerrar sesión o cambiar de usuario no se muestran las del anterior
  return state && state.idUsuario === idUsuario ? state.organizaciones : NINGUNA;
}
