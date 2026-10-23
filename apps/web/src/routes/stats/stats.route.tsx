import { useTranslation } from 'react-i18next';
import { StatsDashboard } from '../../stats/stats-dashboard.component.tsx';
import { StatsFiltersBar } from '../../stats/stats-filters.component.tsx';
import {
  StatsEmptyState,
  StatsErrorState,
  StatsLoadingSkeleton,
  StatsStaleAlert,
} from '../../stats/stats-states.component.tsx';
import { useStats } from '../../stats/stats.hook.tsx';
import { useStatsFilters } from '../../stats/use-stats-filters.ts';

export const StatsRoute = () => {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters, hasActiveFilters } = useStatsFilters();
  const { data, failed, isFetching, refetch } = useStats({
    anio: filters.anio,
    tipoCultivo: filters.tipoCultivo,
  });

  if (!data) {
    return failed && !isFetching ? (
      <StatsErrorState onRetry={refetch} />
    ) : (
      <StatsLoadingSkeleton />
    );
  }

  return (
    <div className="w-full max-w-[96rem] space-y-4">
      <header>
        <h1 className="text-2xl font-bold">{t('stats.title')}</h1>
        <p className="text-sm text-base-content/60">{t('stats.subtitle')}</p>
      </header>

      <StatsFiltersBar
        data={data}
        filters={filters}
        isFetching={isFetching}
        hasActiveFilters={hasActiveFilters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {failed && !isFetching && <StatsStaleAlert onRetry={refetch} />}

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
