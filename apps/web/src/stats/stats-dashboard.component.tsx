import { useTranslation } from 'react-i18next';
import type { EfCategoryId } from '../common/constants.ts';
import { StatsCategorySelector } from './stats-category-selector.component.tsx';
import { StatsCropDonut } from './stats-crop-donut.component.tsx';
import { StatsCropSelector } from './stats-crop-selector.component.tsx';
import { StatsHeatmap } from './stats-heatmap.component.tsx';
import { StatsKPICards } from './stats-kpi-cards.component.tsx';
import { StatsPoblacionRanking } from './stats-poblacion-ranking.component.tsx';
import { StatsProvinciaRanking } from './stats-provincia-ranking.component.tsx';
import { StatsScatterChart } from './stats-scatter-chart.component.tsx';
import { StatsSpiderChart } from './stats-spider-chart.component.tsx';
import { StatsTimeline } from './stats-timeline.component.tsx';
import type { GlobalStatsDto } from './stats.hook.tsx';

type FiltersProps = {
  data: GlobalStatsDto;
  anio: number | undefined;
  selectedCategory: EfCategoryId | undefined;
  tipoCultivo: string | undefined;
  onAnioChange: (anio: number | undefined) => void;
  onCategoryChange: (category: EfCategoryId | undefined) => void;
  onTipoCultivoChange: (tipoCultivo: string | undefined) => void;
};

export const StatsFilters = ({
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

export const StatsDashboardContent = ({
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