import type {
  ConsentimientoRespuesta,
  MarcarAvisosLeidosDto,
  NotificacionesDto,
  ResponderConsentimientosDto,
} from 'common/organizacion';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../common/api.ts';
import { useAuth } from './auth.hook.tsx';

export type { AvisoDto, NotificacionesDto, SolicitudPendienteDto } from 'common/organizacion';

const POLL_INTERVAL_MS = 60_000;
// Al volver a la pestaña llegan casi a la vez `focus` y `visibilitychange`
const MIN_REFRESH_GAP_MS = 5_000;

type NotificacionesContextType = {
  data: NotificacionesDto | null;
  /** Años pendientes de respuesta más avisos sin leer */
  total: number;
  /** Cambia cada vez que el usuario responde a solicitudes, para recargar lo que dependa de ellas */
  respuestas: number;
  refresh: () => void;
  respond: (ids: string[], respuesta: ConsentimientoRespuesta) => Promise<void>;
  markRead: (ids?: string[]) => Promise<void>;
};

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

type State = { idUsuario: string; data: NotificacionesDto };

export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id;
  const [state, setState] = useState<State | null>(null);
  const [respuestas, setRespuestas] = useState(0);
  const lastFetchRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchNow = useCallback(() => {
    if (!idUsuario) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    lastFetchRef.current = Date.now();
    apiFetch<NotificacionesDto>('/notificaciones', { signal: controller.signal })
      .then((data) => setState({ idUsuario, data }))
      // Un fallo puntual no se muestra: se reintenta en el siguiente ciclo
      .catch(() => undefined);
  }, [idUsuario]);

  useEffect(() => {
    if (!idUsuario) return;
    fetchNow();

    // Sondeo periódico, en pausa mientras la pestaña no se ve
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchNow();
    }, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastFetchRef.current >= MIN_REFRESH_GAP_MS) fetchNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      controllerRef.current?.abort();
    };
  }, [idUsuario, fetchNow]);

  const respond = useCallback(async (ids: string[], respuesta: ConsentimientoRespuesta) => {
    if (!idUsuario) return;
    const data = await apiFetch<NotificacionesDto>('/consentimientos', {
      method: 'PATCH',
      body: JSON.stringify({ ids, respuesta } satisfies ResponderConsentimientosDto),
    });
    setState({ idUsuario, data });
    setRespuestas((n) => n + 1);
  }, [idUsuario]);

  const markRead = useCallback(async (ids?: string[]) => {
    if (!idUsuario) return;
    const data = await apiFetch<NotificacionesDto>('/notificaciones/leidas', {
      method: 'PATCH',
      body: JSON.stringify((ids ? { ids } : {}) satisfies MarcarAvisosLeidosDto),
    });
    setState({ idUsuario, data });
  }, [idUsuario]);

  // Tras cerrar sesión no se muestran las notificaciones del usuario anterior
  const data = state && state.idUsuario === idUsuario ? state.data : null;
  const total = data
    ? data.sinLeer + data.solicitudes.reduce((sum, s) => sum + s.campanias.length, 0)
    : 0;

  const value = useMemo(
    () => ({ data, total, respuestas, refresh: fetchNow, respond, markRead }),
    [data, total, respuestas, fetchNow, respond, markRead],
  );

  return <NotificacionesContext.Provider value={value}>{children}</NotificacionesContext.Provider>;
}

export function useNotificaciones() {
  const context = useContext(NotificacionesContext);
  if (!context) {
    throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  }
  return context;
}
