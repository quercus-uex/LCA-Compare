import { useState } from 'react';
import { type GlobalStatsDto, useStats } from '../../stats/stats.hook.tsx';
import { StatsKPICards } from '../../stats/stats-kpi-cards.component.tsx';
import { StatsProvinciaRanking } from '../../stats/stats-provincia-ranking.component.tsx';
import { StatsTimeline } from '../../stats/stats-timeline.component.tsx';
import { StatsCropDonut } from '../../stats/stats-crop-donut.component.tsx';
import { StatsScatterChart } from '../../stats/stats-scatter-chart.component.tsx';
import { StatsPoblacionRanking } from '../../stats/stats-poblacion-ranking.component.tsx';
import { StatsSpiderChart } from '../../stats/stats-spider-chart.component.tsx';
import { StatsHeatmap } from '../../stats/stats-heatmap.component.tsx';
import { StatsCategorySelector } from '../../stats/stats-category-selector.component.tsx';
import { StatsCropSelector } from '../../stats/stats-crop-selector.component.tsx';
import type { EfCategoryId } from '../../common/constants.ts';
import { useTranslation } from 'react-i18next';

type FiltersProps = {
  data: GlobalStatsDto;
  anio: number | undefined;
  selectedCategory: EfCategoryId | undefined;
  tipoCultivo: string | undefined;
  onAnioChange: (anio: number | undefined) => void;
  onCategoryChange: (category: EfCategoryId | undefined) => void;
  onTipoCultivoChange: (tipoCultivo: string | undefined) => void;
};

const StatsLoadingSkeleton = () => (
  <div className="w-full max-w-[96rem] space-y-6">
    <div className="skeleton h-10 w-48" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-xl" />
      ))}
    </div>
    <div className="flex gap-3">
      <div className="skeleton h-16 rounded-box flex-1" />
      <div className="skeleton h-16 rounded-box flex-1" />
      <div className="skeleton h-16 rounded-box flex-1" />
      <div className="skeleton h-16 rounded-box flex-1" />
    </div>
    <div className="skeleton h-80 rounded-xl" />
    <div className="skeleton h-96 rounded-xl" />
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="skeleton h-80 rounded-xl" />
      <div className="skeleton h-80 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="skeleton h-80 rounded-xl" />
      <div className="skeleton h-80 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="skeleton h-60 rounded-xl" />
    </div>
  </div>
);

const StatsErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-[96rem]">
      <div className="alert alert-error">
        <span>{error}</span>
        <button className="btn btn-sm btn-ghost" onClick={onRetry}>
          {t('common.actions.retry')}
        </button>
      </div>
    </div>
  );
};

const StatsEmptyState = ({ anio }: { anio?: number }) => {
  const { t } = useTranslation();

  return (
    <div className="alert">
      <span>{anio ? t('stats.noDataForYear', { year: anio }) : t('stats.noData')}</span>
    </div>
  );
};

const StatsFilters = ({
  data,
  anio,
  selectedCategory,
  tipoCultivo,
  onAnioChange,
  onCategoryChange,
  onTipoCultivoChange,
}: FiltersProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <StatsCategorySelector selected={selectedCategory} onChange={onCategoryChange} />
      <StatsCropSelector
        selected={tipoCultivo}
        onChange={onTipoCultivoChange}
        distribucionCultivos={data.distribucionCultivos}
      />
      <select
        className="select select-bordered select-sm"
        value={anio ?? ''}
        onChange={(e) =>
          onAnioChange(e.target.value ? Number(e.target.value) : undefined)
        }
      >
        <option value="">{t('stats.filters.allYears')}</option>
        {data.aniosDisponibles.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
};

type DashboardContentProps = {
  data: GlobalStatsDto;
  selectedCategory: EfCategoryId | undefined;
  provinciaFilter: string | undefined;
  onProvinciaFilterChange: (provinciaId: string | undefined) => void;
};

const StatsDashboardContent = ({
  data,
  selectedCategory,
  provinciaFilter,
  onProvinciaFilterChange,
}: DashboardContentProps) => {
  const { t } = useTranslation();

  return (
    <>
    <section>
      <StatsKPICards kpis={data.kpis} />
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h2 className="card-title text-lg">{t('stats.sections.provinceRanking')}</h2>
          <StatsProvinciaRanking
            ranking={data.rankingProvincias}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h2 className="card-title text-lg">{t('stats.sections.townRanking')}</h2>
          <StatsPoblacionRanking
            ranking={data.rankingPoblaciones}
            selectedCategory={selectedCategory}
            provinciaFilter={provinciaFilter}
            onProvinciaFilterChange={onProvinciaFilterChange}
          />
        </div>
      </div>
    </section>

    <section>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h2 className="card-title text-lg">{t('stats.sections.timeline')}</h2>
          <StatsTimeline data={data.evolucionTemporal} />
        </div>
      </div>
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-[minmax(420px,2.4fr)_minmax(0,3fr)] gap-6">
      <div className="card bg-base-100 shadow-sm min-w-0">
        <div className="card-body p-4">
          <h2 className="card-title text-lg">{t('stats.sections.impactProfile')}</h2>
          <StatsSpiderChart
            ranking={data.rankingProvincias}
            poblacionRanking={data.rankingPoblaciones}
          />
        </div>
      </div>
      <div className="card bg-base-100 shadow-sm min-w-0">
        <div className="card-body p-4 min-w-0">
          <h2 className="card-title text-lg">
            {t('stats.sections.heatmap')}
          </h2>
          <StatsHeatmap ranking={data.rankingProvincias} />
        </div>
      </div>
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h2 className="card-title text-lg">{t('stats.sections.cropDistribution')}</h2>
          <StatsCropDonut data={data.distribucionCultivos} />
        </div>
      </div>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h2 className="card-title text-lg">{t('stats.sections.efficiency')}</h2>
          <StatsScatterChart ranking={data.rankingProvincias} />
        </div>
      </div>
    </section>
    </>
  );
};

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
    return <StatsErrorState error={error} onRetry={refetch} />;
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
