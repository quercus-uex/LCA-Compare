import { useTranslation } from 'react-i18next';
import { FiBarChart2 } from 'react-icons/fi';
import { Button, EmptyState, ErrorAlert, Page, PageHeader } from '../../components/ui/index.ts';
import { useOrganizacionesAdministradas } from '../../hooks/organizacion.hook.tsx';
import { StatsDashboard } from '../../stats/stats-dashboard.component.tsx';
import { StatsFiltersBar } from '../../stats/stats-filters.component.tsx';
import { StatsLoadingSkeleton } from '../../stats/stats-states.component.tsx';
import { useStats } from '../../stats/stats.hook.tsx';
import { useStatsFilters } from '../../stats/use-stats-filters.ts';

export const StatsRoute = () => {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters, hasActiveFilters } = useStatsFilters();
  const organizaciones = useOrganizacionesAdministradas();
  const { data, failed, isFetching, refetch } = useStats({
    anio: filters.anio,
    tipoCultivo: filters.tipoCultivo,
    idOrganizacion: filters.organizacion,
  });

  const header = <PageHeader title={t('stats.title')} />;
  const loadFailed = failed && !isFetching;

  if (!data) {
    return (
      <Page busy={!loadFailed}>
        {header}
        {loadFailed ? <ErrorAlert message={t('stats.errors.load')} onRetry={refetch} /> : <StatsLoadingSkeleton />}
      </Page>
    );
  }

  return (
    <Page>
      {header}

      <StatsFiltersBar
        data={data}
        filters={filters}
        organizaciones={organizaciones}
        isFetching={isFetching}
        hasActiveFilters={hasActiveFilters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {loadFailed && <ErrorAlert tone="warning" message={t('stats.errors.stale')} onRetry={refetch} />}

      <div
        aria-busy={isFetching}
        className={`transition-opacity ${isFetching ? 'opacity-60' : ''}`}
      >
        {data.kpis.totalCultivos === 0 ? (
          <EmptyState
            icon={FiBarChart2}
            description={hasActiveFilters ? t('stats.noDataForFilters') : t('stats.noData')}
            action={hasActiveFilters && (
              <Button variant="primary" size="sm" onClick={resetFilters}>
                {t('stats.filters.reset')}
              </Button>
            )}
          />
        ) : (
          <StatsDashboard data={data} filters={filters} onFiltersChange={setFilters} />
        )}
      </div>
    </Page>
  );
};
