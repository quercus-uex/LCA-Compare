import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSend, FiSettings, FiUsers } from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import {
  ErrorAlert,
  Page,
  PageHeader,
  PageHeaderSkeleton,
  Skeleton,
  type TabItem,
  TabPanel,
  Tabs,
} from '../../components/ui/index.ts';
import { organizacionApi, type OrganizacionDetalle } from '../../hooks/organizacion.hook.tsx';
import { ParcelaBreadcrumbs } from '../parcelas/parcela-hero.component.tsx';
import { OrganizacionAjustes } from './organizacion-ajustes.component.tsx';
import { OrganizacionMiembros } from './organizacion-miembros.component.tsx';
import { OrganizacionNotFound } from './organizacion-not-found.component.tsx';
import { OrganizacionSolicitar } from './organizacion-solicitar.component.tsx';

const TABS = [
  { id: 'miembros', icon: FiUsers },
  { id: 'solicitar', icon: FiSend },
  { id: 'ajustes', icon: FiSettings },
] as const;
type Tab = (typeof TABS)[number]['id'];

const isTab = (value: string | null): value is Tab => TABS.some((tab) => tab.id === value);

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; organizacion: OrganizacionDetalle };

export const OrganizacionRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const tabsId = useId();

  // La pestaña vive en la URL para que recargar o volver atrás la conserve
  const tabParam = params.get('tab');
  const tab: Tab = isTab(tabParam) ? tabParam : 'miembros';
  const selectTab = (next: Tab) => setParams(next === 'miembros' ? {} : { tab: next }, { replace: true });

  const load = useCallback((signal?: AbortSignal) => {
    if (!id) return;
    organizacionApi.getById(id, signal)
      .then((organizacion) => setState({ status: 'ready', organizacion }))
      .catch((e: unknown) => {
        if (signal?.aborted) return;
        if (e instanceof ApiError && e.status === 401) void navigate('/auth/login', { replace: true });
        // No existe o no la administra: se trata igual
        else if (e instanceof ApiError && (e.status === 403 || e.status === 404)) setState({ status: 'not-found' });
        else setState({ status: 'error' });
      });
  }, [id, navigate]);

  useEffect(() => {
    setState({ status: 'loading' });
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const retry = () => {
    setState({ status: 'loading' });
    load();
  };

  const breadcrumbsRoot = [{ label: t('organizaciones.title'), to: '/organizaciones' }];

  if (state.status === 'loading') {
    return (
      <Page busy>
        <Skeleton className="h-5 w-48" />
        <PageHeaderSkeleton />
        <Skeleton className="h-12 w-full max-w-md rounded-box" />
        <Skeleton className="h-64 w-full rounded-box" />
      </Page>
    );
  }

  if (state.status !== 'ready') {
    return (
      <Page>
        <ParcelaBreadcrumbs root={breadcrumbsRoot} />
        {state.status === 'not-found'
          ? <OrganizacionNotFound />
          : <ErrorAlert message={t('organizaciones.panel.loadError')} onRetry={retry} />}
      </Page>
    );
  }

  const { organizacion } = state;
  const setOrganizacion = (next: OrganizacionDetalle) => setState({ status: 'ready', organizacion: next });
  const tabItems: TabItem<Tab>[] = TABS.map(({ id: tabId, icon }) => ({
    id: tabId,
    icon,
    label: t(`organizaciones.panel.tabs.${tabId}`),
  }));

  return (
    <Page>
      <ParcelaBreadcrumbs root={breadcrumbsRoot} items={[{ label: organizacion.nombre }]} />
      <PageHeader
        title={organizacion.nombre}
        subtitle={organizacion.descripcion ?? undefined}
        aside={<span aria-live="polite">{t('organizaciones.members', { count: organizacion.numMiembros })}</span>}
      />

      <Tabs id={tabsId} label={t('organizaciones.panel.tabsLabel')} items={tabItems} value={tab} onChange={selectTab} fill />

      <TabPanel tabsId={tabsId} value={tab}>
        {tab === 'miembros' && (
          <OrganizacionMiembros
            organizacion={organizacion}
            onChange={setOrganizacion}
            onRequest={() => selectTab('solicitar')}
          />
        )}
        {tab === 'solicitar' && <OrganizacionSolicitar organizacion={organizacion} onSent={() => load()} />}
        {tab === 'ajustes' && (
          <OrganizacionAjustes
            organizacion={organizacion}
            onUpdated={(resumen) => setOrganizacion({ ...organizacion, ...resumen })}
          />
        )}
      </TabPanel>
    </Page>
  );
};
