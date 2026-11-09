import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiInfo, FiUsers } from 'react-icons/fi';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { LoadErrorAlert } from '../../components/load-error-alert.component.tsx';
import { PAGE_CLASS, PageHeader } from '../../components/page-header.component.tsx';
import {
  type MiembroParcelas,
  organizacionApi,
  type OrganizacionDetalle,
} from '../../hooks/organizacion.hook.tsx';
import { ParcelaBreadcrumbs } from '../parcelas/parcela-hero.component.tsx';
import { ParcelasBrowser, useParcelasBrowser } from '../parcelas/parcelas-browser.component.tsx';
import { EmptyState, ParcelasListSkeleton } from '../parcelas/parcelas-states.component.tsx';
import type { ParcelaLinkState } from '../parcelas/parcelas.utils.ts';
import { CampaniaChip } from './campania-chip.component.tsx';
import { OrganizacionNotFound } from './organizacion-not-found.component.tsx';
import { nombreCompleto, organizacionUrl } from './organizaciones.utils.ts';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  /** La organización existe pero el usuario no tiene campañas aceptadas en ella */
  | { status: 'sin-campanias'; organizacion: OrganizacionDetalle }
  | { status: 'ready'; organizacion: OrganizacionDetalle; miembro: MiembroParcelas };

/** Parcelas de un miembro, con solo las campañas que ha consentido a la organización */
export const MiembroParcelasRoute = () => {
  const { id, idUsuario } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback((signal?: AbortSignal) => {
    if (!id || !idUsuario) return;
    const isStatus = (e: unknown, ...codes: number[]) => e instanceof ApiError && codes.includes(e.status);
    const fail = (e: unknown) => {
      if (signal?.aborted) return;
      if (isStatus(e, 401)) void navigate('/auth/login', { replace: true });
      else if (isStatus(e, 403, 404)) setState({ status: 'not-found' });
      else setState({ status: 'error' });
    };
    // El detalle de la organización aporta su nombre a las migas y distingue
    // una organización ajena de un miembro sin campañas aceptadas (ambos dan 404)
    organizacionApi.getById(id, signal)
      .then((organizacion) =>
        organizacionApi.getMiembroParcelas(id, idUsuario, signal)
          .then((miembro) => setState({ status: 'ready', organizacion, miembro }))
          .catch((e: unknown) => {
            if (!signal?.aborted && isStatus(e, 404)) setState({ status: 'sin-campanias', organizacion });
            else fail(e);
          }))
      .catch(fail);
  }, [id, idUsuario, navigate]);

  useEffect(() => {
    setState({ status: 'loading' });
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const parcelas = state.status === 'ready' ? state.miembro.parcelas : undefined;
  const browser = useParcelasBrowser(parcelas);

  const root = [{ label: t('organizaciones.title'), to: '/organizaciones' }];

  if (state.status === 'loading') {
    return (
      <div className={PAGE_CLASS}>
        <div className="skeleton h-5 w-64 max-w-full" />
        <ParcelasListSkeleton />
      </div>
    );
  }

  if (state.status === 'sin-campanias') {
    const { organizacion } = state;
    return (
      <div className={PAGE_CLASS}>
        <ParcelaBreadcrumbs root={root} items={[{ label: organizacion.nombre, to: organizacionUrl(organizacion.id) }]} />
        <EmptyState
          icon={FiUsers}
          title={t('organizaciones.miembroParcelas.noAccessTitle')}
          description={t('organizaciones.miembroParcelas.noAccessDescription', { organizacion: organizacion.nombre })}
          action={
            <Link to={organizacionUrl(organizacion.id)} className="btn btn-primary btn-sm">
              {t('organizaciones.miembroParcelas.backToPanel')}
            </Link>
          }
        />
      </div>
    );
  }

  if (state.status !== 'ready') {
    return (
      <div className={PAGE_CLASS}>
        <ParcelaBreadcrumbs root={root} />
        {state.status === 'not-found'
          ? <OrganizacionNotFound />
          : (
            <LoadErrorAlert
              message={t('organizaciones.miembroParcelas.loadError')}
              onRetry={() => {
                setState({ status: 'loading' });
                load();
              }}
            />
          )}
      </div>
    );
  }

  const { organizacion, miembro } = state;
  const nombre = nombreCompleto(miembro.usuario);
  const anios = [...miembro.anios].sort((a, b) => a - b);
  const linkState: ParcelaLinkState = { organizacion: { id: organizacion.id, search: location.search } };
  const { filtered } = browser;

  return (
    <div className={PAGE_CLASS}>
      <ParcelaBreadcrumbs
        root={root}
        items={[{ label: organizacion.nombre, to: organizacionUrl(organizacion.id) }, { label: nombre }]}
      />

      <PageHeader
        title={nombre}
        subtitle={miembro.usuario.email}
        aside={miembro.parcelas.length > 0 && (
          <span aria-live="polite">
            {filtered.length === miembro.parcelas.length
              ? t('parcelas.count', { count: miembro.parcelas.length })
              : t('parcelas.countFiltered', { shown: filtered.length, total: miembro.parcelas.length })}
          </span>
        )}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-box bg-base-100 p-4 text-sm shadow-sm">
        <FiInfo aria-hidden className="shrink-0 text-secondary" />
        <span>{t('organizaciones.miembroParcelas.note', { organizacion: organizacion.nombre })}</span>
        <ul className="flex flex-wrap gap-1.5" aria-label={t('organizaciones.miembroParcelas.acceptedYears')}>
          {anios.map((anio) => <li key={anio}><CampaniaChip anio={anio} estado="aceptado" /></li>)}
        </ul>
      </div>

      {miembro.parcelas.length === 0 ? (
        <EmptyState
          title={t('organizaciones.miembroParcelas.emptyTitle')}
          description={t('organizaciones.miembroParcelas.emptyDescription')}
        />
      ) : (
        <ParcelasBrowser browser={browser} linkState={linkState} />
      )}
    </div>
  );
};
