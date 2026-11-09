import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBell, FiInfo, FiPlus, FiShield, FiUsers } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { formatNumericDate } from '../../common/format.ts';
import { LoadErrorAlert } from '../../components/load-error-alert.component.tsx';
import { PAGE_CLASS, PageHeader } from '../../components/page-header.component.tsx';
import { useNotificaciones } from '../../hooks/notificaciones.hook.tsx';
import {
  type MembresiaOrganizacion,
  type MisOrganizacionesDto,
  organizacionApi,
  type OrganizacionResumen,
} from '../../hooks/organizacion.hook.tsx';
import { EmptyState } from '../parcelas/parcelas-states.component.tsx';
import { CampaniaChip, CampaniaLegend } from './campania-chip.component.tsx';
import { CrearOrganizacionDialog } from './crear-organizacion-dialog.component.tsx';
import { nombreCompleto, ordenarCampanias, organizacionUrl } from './organizaciones.utils.ts';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: MisOrganizacionesDto };

const SectionHeader = ({ id, title, action }: { id: string; title: string; action?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 id={id} className="text-2xl font-bold">{title}</h2>
    {action}
  </div>
);

const AdministradaCard = ({ organizacion }: { organizacion: OrganizacionResumen }) => {
  const { t } = useTranslation();
  const fecha = formatNumericDate(organizacion.fechaCreacion);

  return (
    <Link
      to={organizacionUrl(organizacion.id)}
      aria-label={t('organizaciones.admin.open', { nombre: organizacion.nombre })}
      className="card bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="card-body gap-2">
        <h3 className="card-title break-words">{organizacion.nombre}</h3>
        {organizacion.descripcion && (
          <div className="line-clamp-2 text-sm text-base-content/70">{organizacion.descripcion}</div>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <FiUsers aria-hidden />
            {t('organizaciones.members', { count: organizacion.numMiembros })}
          </span>
          {fecha && <span className="text-base-content/70">{t('organizaciones.createdAt', { date: fecha })}</span>}
        </div>
      </div>
    </Link>
  );
};

const MembresiaCard = ({ membresia }: { membresia: MembresiaOrganizacion }) => {
  const { t } = useTranslation();
  const { organizacion, campanias } = membresia;
  const admin = organizacion.administrador;
  const pendientes = campanias.some((c) => c.estado === 'pendiente');

  return (
    <article className="card bg-base-100 shadow-sm" aria-labelledby={`membresia-${organizacion.id}`}>
      <div className="card-body gap-3">
        <div className="min-w-0">
          <h3 id={`membresia-${organizacion.id}`} className="card-title break-words">{organizacion.nombre}</h3>
          <div className="text-sm text-base-content/70 break-words">
            {t('organizaciones.adminBy', { nombre: nombreCompleto(admin) })}
          </div>
          <a className="link link-hover text-sm text-base-content/70 break-all" href={`mailto:${admin.email}`}>{admin.email}</a>
        </div>
        {organizacion.descripcion && (
          <div className="line-clamp-2 text-sm text-base-content/70">{organizacion.descripcion}</div>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-base-content/70">
            {t('organizaciones.member.campaigns')}
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {ordenarCampanias(campanias).map((c) => (
              <li key={c.idConsentimiento}><CampaniaChip anio={c.anio} estado={c.estado} /></li>
            ))}
          </ul>
        </div>
        {pendientes && (
          // Sin <p>: DaisyUI les da flex-grow dentro de .card-body y se estiraría al igualar la altura de las tarjetas
          <div className="flex items-center gap-2 rounded-box bg-warning/40 px-3 py-2 text-sm">
            <FiBell aria-hidden className="shrink-0" />
            {t('organizaciones.member.pendingNote')}
          </div>
        )}
      </div>
    </article>
  );
};

export const OrganizacionesRoute = () => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { respuestas } = useNotificaciones();
  const { t } = useTranslation();

  const load = useCallback((signal?: AbortSignal) => {
    organizacionApi.getMias(signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((e: unknown) => {
        if (signal?.aborted) return;
        // Sin sesión: al iniciarla, el login vuelve aquí
        if (e instanceof ApiError && e.status === 401) void navigate('/auth/login', { replace: true });
        else setState({ status: 'error' });
      });
  }, [navigate]);

  // Se recarga también cuando el usuario responde a una solicitud desde las notificaciones
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, respuestas]);

  const retry = () => {
    setState({ status: 'loading' });
    load();
  };

  const createButton = (
    <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
      <FiPlus aria-hidden />
      {t('organizaciones.admin.create')}
    </button>
  );

  return (
    <div className={PAGE_CLASS}>
      <PageHeader title={t('organizaciones.title')} />

      {state.status === 'loading' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-box" />)}
        </div>
      )}

      {state.status === 'error' && <LoadErrorAlert message={t('organizaciones.loadError')} onRetry={retry} />}

      {state.status === 'ready' && (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="org-administradas">
            <SectionHeader
              id="org-administradas"
              title={t('organizaciones.admin.title')}
              action={state.data.administradas.length > 0 && createButton}
            />
            {state.data.administradas.length === 0 ? (
              <EmptyState
                icon={FiShield}
                headingLevel="h3"
                title={t('organizaciones.admin.emptyTitle')}
                description={t('organizaciones.admin.emptyDescription')}
                action={createButton}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {state.data.administradas.map((o) => <AdministradaCard key={o.id} organizacion={o} />)}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="org-miembro">
            <SectionHeader
              id="org-miembro"
              title={t('organizaciones.member.title')}
            />
            {state.data.miembro.length === 0 ? (
              <EmptyState
                icon={FiUsers}
                headingLevel="h3"
                title={t('organizaciones.member.emptyTitle')}
                description={t('organizaciones.member.emptyDescription')}
              />
            ) : (
              <>
                <div className="flex flex-col gap-2 rounded-box bg-base-100 p-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-start gap-2">
                    <FiInfo aria-hidden className="mt-0.5 shrink-0 text-secondary" />
                    {t('organizaciones.member.managedNote')}
                  </p>
                  <CampaniaLegend estados={['aceptado', 'pendiente', 'rechazado', 'revocado']} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {state.data.miembro.map((m) => <MembresiaCard key={m.organizacion.id} membresia={m} />)}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {creating && <CrearOrganizacionDialog onClose={() => setCreating(false)} />}
    </div>
  );
};
