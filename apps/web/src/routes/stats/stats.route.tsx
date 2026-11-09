import { useTranslation } from 'react-i18next';
import { LoadErrorAlert } from '../../components/load-error-alert.component.tsx';
import { PAGE_CLASS, PageHeader } from '../../components/page-header.component.tsx';
import { useOrganizacionesAdministradas } from '../../hooks/organizacion.hook.tsx';
import { StatsDashboard } from '../../stats/stats-dashboard.component.tsx';
import { StatsFiltersBar } from '../../stats/stats-filters.component.tsx';
import {
  StatsEmptyState,
  StatsLoadingSkeleton,
} from '../../stats/stats-states.component.tsx';
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

  if (!data) {
    return (
      <div className={PAGE_CLASS}>
        {header}
        {failed && !isFetching ? <LoadErrorAlert message={t('stats.errors.load')} onRetry={refetch} /> : <StatsLoadingSkeleton />}
      </div>
    );
  }

  return (
    <div className={PAGE_CLASS}>
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

      {failed && !isFetching && <LoadErrorAlert variant="warning" message={t('stats.errors.stale')} onRetry={refetch} />}

      <div
        aria-busy={isFetching}
        className={`transition-opacity ${isFetching ? 'opacity-60' : ''}`}
      >
        {data.kpis.totalCultivos === 0 ? (
          <StatsEmptyState filtered={hasActiveFilters} onReset={resetFilters} />
        ) : (
          <StatsDashboard data={data} filters={filters} onFiltersChange={setFilters} />
        )}
      </div>
    </div>
  );
};
