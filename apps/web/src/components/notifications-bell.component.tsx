import type { AvisoDto, ConsentimientoRespuesta, NotificacionTipo } from 'common/organizacion';
import type { TFunction } from 'i18next';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import {
  FiAlertTriangle,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiRepeat,
  FiSlash,
  FiTrash2,
  FiUserMinus,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { formatDateTime, formatList, formatRelativeTime } from '../common/format.ts';
import { type SolicitudPendienteDto, useNotificaciones } from '../hooks/notificaciones.hook.tsx';
import { nombreCompleto } from '../routes/organizaciones/organizaciones.utils.ts';
import { Dropdown } from './dropdown.component.tsx';

const AVISO_ICONS: Record<NotificacionTipo, IconType> = {
  consentimiento_revocado: FiSlash,
  miembro_expulsado: FiUserMinus,
  organizacion_eliminada: FiTrash2,
  administracion_transferida: FiRepeat,
  consentimiento_aceptado: FiCheckCircle,
  consentimiento_rechazado: FiXCircle,
};

const avisoText = ({ tipo, datos }: AvisoDto, t: TFunction) => {
  const anios = [...(datos.anios ?? [])].sort((a, b) => a - b);
  return t(`notificaciones.avisos.${tipo}`, {
    organizacion: datos.nombreOrganizacion,
    usuario: datos.usuario ? nombreCompleto(datos.usuario) : '',
    anios: formatList(anios),
    count: anios.length,
  });
};

/** Campana con el número de novedades */
export const BellIcon = ({ total }: { total: number }) => (
  <span className="indicator">
    <FiBell aria-hidden className="size-5" />
    {total > 0 && (
      <span aria-hidden className="indicator-item badge badge-secondary badge-xs min-w-4 px-1 tabular-nums">
        {total > 9 ? '9+' : total}
      </span>
    )}
  </span>
);

export const useBellLabel = () => {
  const { t } = useTranslation();
  const { total } = useNotificaciones();
  return total > 0 ? t('notificaciones.openWithCount', { count: total }) : t('notificaciones.open');
};

type RequestCardProps = {
  solicitud: SolicitudPendienteDto;
  busy: boolean;
  onRespond: (ids: string[], respuesta: ConsentimientoRespuesta) => void;
};

const RequestCard = ({ solicitud, busy, onRespond }: RequestCardProps) => {
  const { t } = useTranslation();
  const { organizacion, campanias } = solicitud;
  const ordenadas = [...campanias].sort((a, b) => a.anio - b.anio);
  const ids = ordenadas.map((c) => c.idConsentimiento);

  return (
    <li className="rounded-box border border-base-300 p-3">
      <div className="font-semibold break-words">{organizacion.nombre}</div>
      <div className="text-xs text-base-content/70 break-words">
        {t('notificaciones.admin', { nombre: nombreCompleto(organizacion.administrador) })}
      </div>
      <div className="truncate text-xs text-base-content/70" title={organizacion.administrador.email}>
        {organizacion.administrador.email}
      </div>
      <ul className="mt-2 flex flex-col divide-y divide-base-200">
        {ordenadas.map((c) => (
          <li key={c.idConsentimiento} className="flex items-center justify-between gap-2 py-1.5">
            <span className="text-sm font-medium tabular-nums">{t('notificaciones.campaign', { anio: c.anio })}</span>
            <span className="flex gap-1">
              <button
                type="button"
                // Con varias campañas, la acción principal es «Aceptar todas»
                className={`btn btn-primary btn-xs ${ordenadas.length > 1 ? 'btn-outline' : ''}`}
                disabled={busy}
                aria-label={t('notificaciones.acceptYear', { anio: c.anio, organizacion: organizacion.nombre })}
                onClick={() => onRespond([c.idConsentimiento], 'aceptado')}
              >
                <FiCheck aria-hidden />
                {t('notificaciones.accept')}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                disabled={busy}
                aria-label={t('notificaciones.rejectYear', { anio: c.anio, organizacion: organizacion.nombre })}
                onClick={() => onRespond([c.idConsentimiento], 'rechazado')}
              >
                <FiX aria-hidden />
                {t('notificaciones.reject')}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {ordenadas.length > 1 && (
        <div className="mt-2 flex flex-wrap justify-end gap-1 border-t border-base-200 pt-2">
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            disabled={busy}
            aria-label={t('notificaciones.rejectAllOf', { organizacion: organizacion.nombre })}
            onClick={() => onRespond(ids, 'rechazado')}
          >
            {t('notificaciones.rejectAll')}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-xs"
            disabled={busy}
            aria-label={t('notificaciones.acceptAllOf', { organizacion: organizacion.nombre })}
            onClick={() => onRespond(ids, 'aceptado')}
          >
            {t('notificaciones.acceptAll')}
          </button>
        </div>
      )}
    </li>
  );
};

/** Contenido de las notificaciones: solicitudes pendientes y avisos */
export const NotificationsPanel = () => {
  const { t } = useTranslation();
  const { data, respond, markRead } = useNotificaciones();
  const [busy, setBusy] = useState(false);
  // El panel de escritorio se abre con el foco: al desaparecer el botón pulsado,
  // el foco se mueve aquí antes para que no se cierre
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const run = async (action: () => Promise<void>, success?: string) => {
    rootRef.current?.focus();
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
    } catch {
      toast.error(t('notificaciones.error'));
    } finally {
      setBusy(false);
    }
  };

  const onRespond = (ids: string[], respuesta: ConsentimientoRespuesta) =>
    void run(
      () => respond(ids, respuesta),
      t(respuesta === 'aceptado' ? 'notificaciones.accepted' : 'notificaciones.rejected', { count: ids.length }),
    );

  const solicitudes = data?.solicitudes ?? [];
  const avisos = data?.avisos ?? [];
  const sinLeer = data?.sinLeer ?? 0;

  return (
    <div ref={rootRef} tabIndex={-1} className="flex flex-col gap-3 p-1 outline-none">
      <h2 className="px-1 text-base font-semibold">{t('notificaciones.title')}</h2>

      {!data && (
        <div className="flex flex-col gap-2" aria-busy="true">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      )}

      {data && solicitudes.length === 0 && avisos.length === 0 && (
        <p className="px-1 py-6 text-center text-sm text-base-content/70">{t('notificaciones.empty')}</p>
      )}

      {solicitudes.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby={`${id}-solicitudes`}>
          <h3 id={`${id}-solicitudes`} className="px-1 text-xs font-semibold uppercase tracking-wide text-base-content/70">
            {t('notificaciones.requests')}
          </h3>
          <div className="flex items-start gap-2 rounded-box bg-warning/60 p-2 text-xs">
            <FiAlertTriangle aria-hidden className="mt-0.5 shrink-0" />
            <span>{t('notificaciones.warning')}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {solicitudes.map((s) => (
              <RequestCard key={s.organizacion.id} solicitud={s} busy={busy} onRespond={onRespond} />
            ))}
          </ul>
        </section>
      )}

      {avisos.length > 0 && (
        <section className="flex flex-col gap-1" aria-labelledby={`${id}-avisos`}>
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 id={`${id}-avisos`} className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
              {t('notificaciones.notices')}
            </h3>
            {sinLeer > 0 && (
              <button type="button" className="btn btn-ghost btn-xs" disabled={busy} onClick={() => void run(() => markRead())}>
                {t('notificaciones.markAllRead')}
              </button>
            )}
          </div>
          <ul className="flex flex-col">
            {avisos.map((aviso) => {
              const Icon = AVISO_ICONS[aviso.tipo];
              return (
                <li
                  key={aviso.id}
                  className={`flex gap-2 rounded-box px-2 py-2 text-sm ${aviso.leida ? '' : 'bg-base-200'}`}
                >
                  <Icon aria-hidden className="mt-0.5 shrink-0 text-secondary" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="break-words">{avisoText(aviso, t)}</span>
                    <time dateTime={aviso.fechaCreacion} title={formatDateTime(aviso.fechaCreacion)} className="text-xs text-base-content/70">
                      {formatRelativeTime(aviso.fechaCreacion)}
                    </time>
                  </div>
                  {!aviso.leida && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-secondary" title={t('notificaciones.unread')}>
                      <span className="sr-only">{t('notificaciones.unread')}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Link to="/organizaciones" className="btn btn-ghost btn-sm justify-center">
        {t('notificaciones.viewOrganizations')}
      </Link>
    </div>
  );
};

/** Campana de escritorio: desplegable que no se cierra al responder */
export const NotificationsBell = () => {
  const { total } = useNotificaciones();
  const label = useBellLabel();

  return (
    <Dropdown
      triggerClassName="btn btn-circle btn-ghost"
      contentClassName="w-96 max-w-[calc(100vw-2rem)] max-h-[75vh] overflow-y-auto"
      label={label}
      title={label}
      closeOn="a"
      trigger={<BellIcon total={total} />}
    >
      <NotificationsPanel />
    </Dropdown>
  );
};
