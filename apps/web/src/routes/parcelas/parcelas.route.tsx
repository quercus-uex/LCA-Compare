import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { LoadErrorAlert } from '../../components/load-error-alert.component.tsx';
import { PAGE_CLASS, PageHeader } from '../../components/page-header.component.tsx';
import { type ParcelaResumen, useParcela } from '../../hooks/parcela.hook.tsx';
import { ParcelasBrowser, useParcelasBrowser } from './parcelas-browser.component.tsx';
import { EmptyState, ParcelasListSkeleton } from './parcelas-states.component.tsx';
import type { ParcelaLinkState } from './parcelas.utils.ts';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; parcelas: ParcelaResumen[] };

export const ParcelasRoute = () => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const location = useLocation();
  const navigate = useNavigate();
  const parcela = useParcela();
  const { t } = useTranslation();

  const load = useCallback(() => {
    setState({ status: 'loading' });
    parcela.getFromToken()
      .then((parcelas) => setState({ status: 'ready', parcelas }))
      .catch((e: unknown) => {
        // Sin sesión: al iniciarla, el login vuelve a «Mis parcelas»
        if (e instanceof ApiError && e.status === 401) void navigate('/auth/login', { replace: true });
        else setState({ status: 'error' });
      });
  }, [navigate, parcela]);

  useEffect(load, [load]);

  const parcelas = state.status === 'ready' ? state.parcelas : undefined;
  const browser = useParcelasBrowser(parcelas);
  const { filtered } = browser;
  const linkState: ParcelaLinkState = { listSearch: location.search };

  return (
    <div className={PAGE_CLASS}>
      <PageHeader
        title={t('parcelas.title')}
        aside={parcelas && parcelas.length > 0 && (
          <span aria-live="polite">
            {filtered.length === parcelas.length
              ? t('parcelas.count', { count: parcelas.length })
              : t('parcelas.countFiltered', { shown: filtered.length, total: parcelas.length })}
          </span>
        )}
      />

      {state.status === 'loading' && <ParcelasListSkeleton />}

      {state.status === 'error' && <LoadErrorAlert message={t('parcelas.loadError')} onRetry={load} />}

      {parcelas && parcelas.length === 0 && (
        <EmptyState title={t('parcelas.empty.title')} description={t('parcelas.empty.description')} />
      )}

      {parcelas && parcelas.length > 0 && <ParcelasBrowser browser={browser} linkState={linkState} />}
    </div>
  );
};
