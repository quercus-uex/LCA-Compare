import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GiFarmTractor } from 'react-icons/gi';
import { useSearchParams } from 'react-router';
import { Button, EmptyState } from '../../components/ui/index.ts';
import type { ParcelaResumen } from '../../hooks/parcela.hook.tsx';
import { ParcelasItem } from './parcelas-item.component.tsx';
import { ParcelasMap } from './parcelas-map.component.tsx';
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

/** Búsqueda, filtros, orden y vista de un listado de parcelas, guardados en la URL */
export function useParcelasBrowser(parcelas: ParcelaResumen[] | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { i18n } = useTranslation();

  const query = useMemo(() => parseParcelasQuery(searchParams), [searchParams]);
  const updateQuery = (patch: Partial<ParcelasQuery>, options?: { replace?: boolean }) =>
    setSearchParams(toSearchParams({ ...query, ...patch }), { replace: options?.replace });
  const clearFilters = () =>
    updateQuery({ q: '', tipo: '', poblacion: '', soloReferencia: false });

  const filtered = useMemo(
    () => (parcelas ? filterAndSortParcelas(parcelas, query, i18n.language) : []),
    [parcelas, query, i18n.language],
  );
  const filterOptions = useMemo(() => getFilterOptions(parcelas ?? []), [parcelas]);

  return { query, updateQuery, clearFilters, filtered, filterOptions };
}

type Props = {
  browser: ReturnType<typeof useParcelasBrowser>;
  linkState: ParcelaLinkState;
};

/** Barra de búsqueda y parcelas filtradas en tarjetas, tabla o mapa */
export const ParcelasBrowser = ({ browser, linkState }: Props) => {
  const { t } = useTranslation();
  const { query, updateQuery, clearFilters, filtered, filterOptions } = browser;

  return (
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
          icon={GiFarmTractor}
          title={t('parcelas.empty.filteredTitle')}
          description={t('parcelas.empty.filteredDescription')}
          action={hasActiveFilters(query) && (
            <Button variant="primary" size="sm" onClick={clearFilters}>
              {t('parcelas.filters.clear')}
            </Button>
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
  );
};
