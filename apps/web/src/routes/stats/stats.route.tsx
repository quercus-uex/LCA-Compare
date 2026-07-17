import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EfCategoryId } from '../../common/constants.ts';
import { StatsFilters, StatsDashboardContent } from '../../stats/stats-dashboard.component.tsx';
import { StatsLoadingSkeleton, StatsErrorState, StatsEmptyState } from '../../stats/stats-states.tsx';
import { useStats } from '../../stats/stats.hook.tsx';

export const StatsRoute = () => {
  const [anio, setAnio] = useState<number | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<
    EfCategoryId | undefined
  >(undefined);
  const [tipoCultivo, setTipoCultivo] = useState<string | undefined>(undefined);
  const [provinciaFilter, setProvinciaFilter] = useState<string | undefined>(
    undefined,
  );
  const { data, loading, error, refetch } = useStats(
    anio,
    selectedCategory,
    tipoCultivo,
    provinciaFilter,
  );
  const { t } = useTranslation();

  if (loading) {
    return <StatsLoadingSkeleton />;
  }

  if (error) {
    return <StatsErrorState error={error} onRetry={() => void refetch()} />;
  }

  if (!data) {
    return (
      <div className="w-full max-w-[96rem]">
        <StatsEmptyState />
      </div>
    );
  }

  const hasData =
    data.kpis.totalCultivos > 0 ||
    data.rankingProvincias.length > 0 ||
    data.evolucionTemporal.length > 0;

  return (
    <div className="w-full max-w-[96rem] space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t('stats.title')}</h1>
        <StatsFilters
          data={data}
          anio={anio}
          selectedCategory={selectedCategory}
          tipoCultivo={tipoCultivo}
          onAnioChange={setAnio}
          onCategoryChange={setSelectedCategory}
          onTipoCultivoChange={setTipoCultivo}
        />
      </div>

      {!hasData ? (
        <StatsEmptyState anio={anio} />
      ) : (
        <StatsDashboardContent
          data={data}
          selectedCategory={selectedCategory}
          provinciaFilter={provinciaFilter}
          onProvinciaFilterChange={setProvinciaFilter}
        />
      )}
    </div>
  );
};