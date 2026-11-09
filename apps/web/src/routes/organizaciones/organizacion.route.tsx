import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiSend, FiSettings, FiUsers } from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { LoadErrorAlert } from '../../components/load-error-alert.component.tsx';
import { PAGE_CLASS, PageHeader, PageHeaderSkeleton } from '../../components/page-header.component.tsx';
import { organizacionApi, type OrganizacionDetalle } from '../../hooks/organizacion.hook.tsx';
import { ParcelaBreadcrumbs } from '../parcelas/parcela-hero.component.tsx';
import { OrganizacionAjustes } from './organizacion-ajustes.component.tsx';
import { OrganizacionMiembros } from './organizacion-miembros.component.tsx';
import { OrganizacionNotFound } from './organizacion-not-found.component.tsx';
import { OrganizacionSolicitar } from './organizacion-solicitar.component.tsx';

const TABS: { id: 'miembros' | 'solicitar' | 'ajustes'; icon: IconType }[] = [
  { id: 'miembros', icon: FiUsers },
  { id: 'solicitar', icon: FiSend },
  { id: 'ajustes', icon: FiSettings },
];
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
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

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

  // Flechas, Inicio y Fin mueven el foco entre pestañas, como en el patrón de pestañas de ARIA
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.findIndex((tabItem) => tabItem.id === tab);
    const last = TABS.length - 1;
    const nextIndex = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[e.key];
    const next = nextIndex === undefined ? undefined : TABS[nextIndex];
    if (!next) return;
    e.preventDefault();
    selectTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const retry = () => {
    setState({ status: 'loading' });
    load();
  };

  const breadcrumbsRoot = [{ label: t('organizaciones.title'), to: '/organizaciones' }];

  if (state.status === 'loading') {
    return (
      <div className={PAGE_CLASS} aria-busy="true">
        <div className="skeleton h-5 w-48" />
        <PageHeaderSkeleton />
        <div className="skeleton h-12 w-full max-w-md rounded-box" />
        <div className="skeleton h-64 w-full rounded-box" />
      </div>
    );
  }

  if (state.status !== 'ready') {
    return (
      <div className={PAGE_CLASS}>
        <ParcelaBreadcrumbs root={breadcrumbsRoot} />
        {state.status === 'not-found'
          ? <OrganizacionNotFound />
          : <LoadErrorAlert message={t('organizaciones.panel.loadError')} onRetry={retry} />}
      </div>
    );
  }

  const { organizacion } = state;
  const setOrganizacion = (next: OrganizacionDetalle) => setState({ status: 'ready', organizacion: next });

  return (
    <div className={PAGE_CLASS}>
      <ParcelaBreadcrumbs root={breadcrumbsRoot} items={[{ label: organizacion.nombre }]} />
      <PageHeader
        title={organizacion.nombre}
        subtitle={organizacion.descripcion ?? undefined}
        aside={<span aria-live="polite">{t('organizaciones.members', { count: organizacion.numMiembros })}</span>}
      />

      <div role="tablist" aria-label={t('organizaciones.panel.tabsLabel')} className="tabs tabs-box w-full sm:w-fit">
        {TABS.map(({ id: tabId, icon: Icon }) => (
          <button
            key={tabId}
            ref={(el) => { tabRefs.current[tabId] = el; }}
            type="button"
            role="tab"
            id={`${tabsId}-${tabId}`}
            aria-selected={tab === tabId}
            aria-controls={`${tabsId}-panel`}
            tabIndex={tab === tabId ? 0 : -1}
            className={`tab flex-1 gap-2 whitespace-nowrap px-3 sm:flex-none ${tab === tabId ? 'tab-active' : ''}`}
            onClick={() => selectTab(tabId)}
            onKeyDown={onTabKeyDown}
          >
            <Icon aria-hidden className="hidden shrink-0 sm:block" />
            {t(`organizaciones.panel.tabs.${tabId}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
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
      </div>
    </div>
  );
};
