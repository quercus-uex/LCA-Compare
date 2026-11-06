import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { LoadErrorAlert } from '../../components/load-error-alert.component.tsx';
import { PAGE_CLASS, PageHeader } from '../../components/page-header.component.tsx';
import { type ParcelaResumen, useParcela } from '../../hooks/parcela.hook.tsx';
import { ParcelasItem } from './parcelas-item.component.tsx';
import { ParcelasMap } from './parcelas-map.component.tsx';
import { EmptyState, ParcelasListSkeleton } from './parcelas-states.component.tsx';
import { ParcelasTable } from './parcelas-table.component.tsx';
import { ParcelasToolbar } from './parcelas-toolbar.component.tsx';
import {
  filterAndSortParcelas,
  getFilterOptions,
  hasActiveFilters,
  type ParcelaLinkState,
  type ParcelasQuery,
  parseParcelasQuery,
  toSearchParams,
} from './parcelas.utils.ts';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; parcelas: ParcelaResumen[] };

export const ParcelasRoute = () => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const parcela = useParcela();
  const { t, i18n } = useTranslation();

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

  const query = useMemo(() => parseParcelasQuery(searchParams), [searchParams]);
  const updateQuery = (patch: Partial<ParcelasQuery>, options?: { replace?: boolean }) =>
    setSearchParams(toSearchParams({ ...query, ...patch }), { replace: options?.replace });
  const clearFilters = () =>
    updateQuery({ q: '', tipo: '', poblacion: '', soloReferencia: false });

  const parcelas = state.status === 'ready' ? state.parcelas : undefined;
  const filtered = useMemo(
    () => (parcelas ? filterAndSortParcelas(parcelas, query, i18n.language) : []),
    [parcelas, query, i18n.language],
  );
  const filterOptions = useMemo(() => getFilterOptions(parcelas ?? []), [parcelas]);
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

      {parcelas && parcelas.length > 0 && (
        <>
          <ParcelasToolbar
            query={query}
            onChange={updateQuery}
            onClear={clearFilters}
            tipos={filterOptions.tipos}
            poblaciones={filterOptions.poblaciones}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title={t('parcelas.empty.filteredTitle')}
              description={t('parcelas.empty.filteredDescription')}
              action={hasActiveFilters(query) && (
                <button type="button" className="btn btn-primary btn-sm" onClick={clearFilters}>
                  {t('parcelas.filters.clear')}
                </button>
              )}
            />
          ) : (
            <>
              {query.vista === 'tarjetas' && (
                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((p) => <ParcelasItem key={p.id} parcela={p} linkState={linkState} />)}
                </div>
              )}
              {query.vista === 'tabla' && <ParcelasTable parcelas={filtered} linkState={linkState} />}
              {query.vista === 'mapa' && <ParcelasMap parcelas={filtered} linkState={linkState} />}
            </>
          )}
        </>
      )}
    </div>
  );
};
