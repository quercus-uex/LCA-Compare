import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBell, FiPlus, FiShield, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { formatNumericDate } from '../../common/format.ts';
import {
  Button,
  Callout,
  Card,
  CardLink,
  EmptyState,
  ErrorAlert,
  Page,
  PageHeader,
  SectionHeader,
  Skeleton,
} from '../../components/ui/index.ts';
import { useNotificaciones } from '../../hooks/notificaciones.hook.tsx';
import {
  type MembresiaOrganizacion,
  type MisOrganizacionesDto,
  organizacionApi,
  type OrganizacionResumen,
} from '../../hooks/organizacion.hook.tsx';
import { CampaniaChip, CampaniaLegend } from './campania-chip.component.tsx';
import { CrearOrganizacionDialog } from './crear-organizacion-dialog.component.tsx';
import { nombreCompleto, ordenarCampanias, organizacionUrl } from './organizaciones.utils.ts';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: MisOrganizacionesDto };

const AdministradaCard = ({ organizacion }: { organizacion: OrganizacionResumen }) => {
  const { t } = useTranslation();
  const fecha = formatNumericDate(organizacion.fechaCreacion);

  return (
    <CardLink to={organizacionUrl(organizacion.id)} label={t('organizaciones.admin.open', { nombre: organizacion.nombre })}>
      <h3 className="text-lg font-semibold break-words">{organizacion.nombre}</h3>
      {organizacion.descripcion && (
        <div className="line-clamp-2 text-sm text-muted">{organizacion.descripcion}</div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <FiUsers aria-hidden />
          {t('organizaciones.members', { count: organizacion.numMiembros })}
        </span>
        {fecha && <span className="text-muted">{t('organizaciones.createdAt', { date: fecha })}</span>}
      </div>
    </CardLink>
  );
};

const MembresiaCard = ({ membresia }: { membresia: MembresiaOrganizacion }) => {
  const { t } = useTranslation();
  const { organizacion, campanias } = membresia;
  const admin = organizacion.administrador;
  const pendientes = campanias.some((c) => c.estado === 'pendiente');

  return (
    <Card as="article" aria-labelledby={`membresia-${organizacion.id}`}>
      <div className="min-w-0">
        <h3 id={`membresia-${organizacion.id}`} className="text-lg font-semibold break-words">{organizacion.nombre}</h3>
        <div className="text-sm text-muted break-words">
          {t('organizaciones.adminBy', { nombre: nombreCompleto(admin) })}
        </div>
        <a className="link link-hover text-sm text-muted break-all" href={`mailto:${admin.email}`}>{admin.email}</a>
      </div>
      {organizacion.descripcion && (
        <div className="line-clamp-2 text-sm text-muted">{organizacion.descripcion}</div>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="eyebrow">{t('organizaciones.member.campaigns')}</span>
        <ul className="flex flex-wrap gap-1.5">
          {ordenarCampanias(campanias).map((c) => (
            <li key={c.idConsentimiento}><CampaniaChip anio={c.anio} estado={c.estado} /></li>
          ))}
        </ul>
      </div>
      {pendientes && <Callout tone="warning" icon={FiBell}>{t('organizaciones.member.pendingNote')}</Callout>}
    </Card>
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
    <Button variant="primary" icon={FiPlus} onClick={() => setCreating(true)}>
      {t('organizaciones.admin.create')}
    </Button>
  );

  return (
    <Page busy={state.status === 'loading'}>
      <PageHeader title={t('organizaciones.title')} />

      {state.status === 'loading' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-box" />)}
        </div>
      )}

      {state.status === 'error' && <ErrorAlert message={t('organizaciones.loadError')} onRetry={retry} />}

      {state.status === 'ready' && (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="org-administradas">
            <SectionHeader
              level="page"
              id="org-administradas"
              title={t('organizaciones.admin.title')}
              actions={state.data.administradas.length > 0 && createButton}
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
            <SectionHeader level="page" id="org-miembro" title={t('organizaciones.member.title')} />
            {state.data.miembro.length === 0 ? (
              <EmptyState
                icon={FiUsers}
                headingLevel="h3"
                title={t('organizaciones.member.emptyTitle')}
                description={t('organizaciones.member.emptyDescription')}
              />
            ) : (
              <>
                <Callout tone="neutral" action={<CampaniaLegend estados={['aceptado', 'pendiente', 'rechazado', 'revocado']} />}>
                  {t('organizaciones.member.managedNote')}
                </Callout>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {state.data.miembro.map((m) => <MembresiaCard key={m.organizacion.id} membresia={m} />)}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {creating && <CrearOrganizacionDialog onClose={() => setCreating(false)} />}
    </Page>
  );
};
