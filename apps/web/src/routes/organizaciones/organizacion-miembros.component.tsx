import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMap, FiSend, FiUserMinus, FiUsers } from 'react-icons/fi';
import { toast } from 'sonner';
import { Button, ButtonLink, Card, ConfirmDialog, EmptyState } from '../../components/ui/index.ts';
import {
  type CampaniaConsentimiento,
  type MiembroOrganizacion,
  organizacionApi,
  type OrganizacionDetalle,
} from '../../hooks/organizacion.hook.tsx';
import { CampaniaChip, CampaniaLegend } from './campania-chip.component.tsx';
import {
  describeOrganizacionError,
  iniciales,
  miembroUrl,
  nombreCompleto,
  ordenarCampanias,
  tieneAceptadas,
} from './organizaciones.utils.ts';

type Pending =
  | { kind: 'retirar'; miembro: MiembroOrganizacion; campania: CampaniaConsentimiento }
  | { kind: 'expulsar'; miembro: MiembroOrganizacion };

type Props = {
  organizacion: OrganizacionDetalle;
  onChange: (organizacion: OrganizacionDetalle) => void;
  onRequest: () => void;
};

// Primero quien tiene campañas aceptadas, luego quien tiene solicitudes pendientes
const prioridad = (m: MiembroOrganizacion) =>
  tieneAceptadas(m.campanias) ? 0 : m.campanias.some((c) => c.estado === 'pendiente') ? 1 : 2;

const esActiva = (c: CampaniaConsentimiento) => c.estado === 'aceptado' || c.estado === 'pendiente';

export const OrganizacionMiembros = ({ organizacion, onChange, onRequest }: Props) => {
  const { t, i18n } = useTranslation();
  const [pending, setPending] = useState<Pending | null>(null);

  const miembros = useMemo(() => {
    const collator = new Intl.Collator(i18n.language, { sensitivity: 'base' });
    return [...organizacion.miembros].sort(
      (a, b) => prioridad(a) - prioridad(b) || collator.compare(nombreCompleto(a.usuario), nombreCompleto(b.usuario)),
    );
  }, [organizacion.miembros, i18n.language]);

  if (miembros.length === 0) {
    return (
      <EmptyState
        icon={FiUsers}
        title={t('organizaciones.miembros.emptyTitle')}
        description={t('organizaciones.miembros.emptyDescription')}
        action={
          <Button variant="primary" size="sm" icon={FiSend} onClick={onRequest}>
            {t('organizaciones.panel.tabs.solicitar')}
          </Button>
        }
      />
    );
  }

  const confirmProps = {
    cancelLabel: t('organizaciones.confirm.dismiss'),
    describeError: (e: unknown) => describeOrganizacionError(e, t),
    onClose: () => setPending(null),
  };

  const dialog = (() => {
    if (!pending) return null;
    const nombre = nombreCompleto(pending.miembro.usuario);
    if (pending.kind === 'expulsar') {
      return (
        <ConfirmDialog
          {...confirmProps}
          title={t('organizaciones.miembros.confirm.expelTitle', { nombre })}
          body={t('organizaciones.miembros.confirm.expelBody', { nombre })}
          confirmLabel={t('organizaciones.miembros.expel')}
          onConfirm={async () => {
            onChange(await organizacionApi.expulsar(organizacion.id, pending.miembro.usuario.id));
            toast.success(t('organizaciones.miembros.expelled', { nombre }));
            setPending(null);
          }}
        />
      );
    }
    const { anio, estado, idConsentimiento } = pending.campania;
    const revocar = estado === 'aceptado';
    return (
      <ConfirmDialog
        {...confirmProps}
        title={t(revocar ? 'organizaciones.miembros.confirm.revokeTitle' : 'organizaciones.miembros.confirm.cancelTitle', { anio, nombre })}
        body={t(revocar ? 'organizaciones.miembros.confirm.revokeBody' : 'organizaciones.miembros.confirm.cancelBody', { anio, nombre })}
        confirmLabel={t(revocar ? 'organizaciones.miembros.confirm.revoke' : 'organizaciones.miembros.confirm.cancel')}
        onConfirm={async () => {
          onChange(await organizacionApi.retirarConsentimiento(organizacion.id, idConsentimiento));
          toast.success(t(revocar ? 'organizaciones.miembros.revoked' : 'organizaciones.miembros.cancelled', { anio }));
          setPending(null);
        }}
      />
    );
  })();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{t('organizaciones.miembros.hint')}</p>
        <CampaniaLegend estados={['aceptado', 'pendiente', 'rechazado', 'revocado']} />
      </div>

      <Card flush>
        <ul className="divide-y divide-base-200">
          {miembros.map((miembro) => {
            const { usuario } = miembro;
            const nombre = nombreCompleto(usuario);
            const headingId = `miembro-${usuario.id}`;
            return (
              <li key={usuario.id}>
                <article
                  className="flex flex-col gap-3 p-4 sm:px-6 md:flex-row md:items-center md:justify-between"
                  aria-labelledby={headingId}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="avatar avatar-placeholder shrink-0" aria-hidden>
                      <div className="w-10 rounded-full bg-base-200 text-sm font-semibold text-secondary">
                        <span>{iniciales(usuario)}</span>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="min-w-0">
                        <h3 id={headingId} className="font-semibold break-words">{nombre}</h3>
                        <div className="text-sm text-muted break-all">{usuario.email}</div>
                      </div>
                      <ul className="flex flex-wrap gap-1.5" aria-label={t('organizaciones.miembros.campaigns')}>
                        {ordenarCampanias(miembro.campanias).map((c) => (
                          <li key={c.idConsentimiento}>
                            <CampaniaChip
                              anio={c.anio}
                              estado={c.estado}
                              action={esActiva(c) ? {
                                label: t(
                                  c.estado === 'aceptado' ? 'organizaciones.miembros.revokeYear' : 'organizaciones.miembros.cancelYear',
                                  { anio: c.anio, nombre },
                                ),
                                onClick: () => setPending({ kind: 'retirar', miembro, campania: c }),
                              } : undefined}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                    {tieneAceptadas(miembro.campanias) && (
                      <ButtonLink variant="outline" size="sm" icon={FiMap} to={miembroUrl(organizacion.id, usuario.id)}>
                        {t('organizaciones.miembros.viewPlots')}
                      </ButtonLink>
                    )}
                    {miembro.campanias.some(esActiva) && (
                      <Button
                        variant="danger-ghost"
                        size="sm"
                        icon={FiUserMinus}
                        aria-label={t('organizaciones.miembros.expelUser', { nombre })}
                        onClick={() => setPending({ kind: 'expulsar', miembro })}
                      >
                        {t('organizaciones.miembros.expel')}
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </Card>

      {dialog}
    </div>
  );
};
