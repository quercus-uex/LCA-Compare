import { useTranslation } from 'react-i18next';
import { StatsCropDonut } from './stats-crop-donut.component.tsx';
import { StatsOverview } from './stats-overview.component.tsx';
import { StatsProfile } from './stats-profile.component.tsx';
import { StatsRankings } from './stats-rankings.component.tsx';
import { StatsSection } from './stats-section.component.tsx';
import { StatsTimeline } from './stats-timeline.component.tsx';
import { StatsWaterChart } from './stats-water-chart.component.tsx';
import type { GlobalStatsDto } from './stats.hook.tsx';
import type { StatsFilters } from './use-stats-filters.ts';

type Props = {
  data: GlobalStatsDto;
  filters: StatsFilters;
  onFiltersChange: (patch: Partial<StatsFilters>) => void;
};

/**
 * De lo general a lo particular: resumen, la categoría seleccionada por zona y
 * en el tiempo, el perfil con todas las categorías y el contexto agronómico.
 */
export const StatsDashboard = ({ data, filters, onFiltersChange }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <StatsOverview
        kpis={data.kpis}
        numProvincias={data.rankingProvincias.length + data.zonasOcultas.provincias}
        anio={filters.anio}
        selectedCategory={filters.categoria}
        onCategoryChange={(categoria) => onFiltersChange({ categoria })}
      />

      <StatsRankings
        data={data}
        selectedCategory={filters.categoria}
        provinciaFilter={filters.provincia}
        onProvinciaFilterChange={(provincia) => onFiltersChange({ provincia })}
      />

      <StatsSection
        title={t('stats.sections.timeline')}
        hint={t('stats.sections.timelineHint')}
      >
        <StatsTimeline
          data={data.evolucionTemporal}
          selectedCategory={filters.categoria}
          anio={filters.anio}
        />
      </StatsSection>

      <StatsProfile data={data} selectedCategory={filters.categoria} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StatsSection
          title={t('stats.sections.cropDistribution')}
          hint={t('stats.sections.cropDistributionHint')}
        >
          <StatsCropDonut
            data={data.distribucionCultivos}
            tiposCultivo={data.tiposCultivoDisponibles}
            selected={filters.tipoCultivo}
            onSelect={(tipoCultivo) => onFiltersChange({ tipoCultivo })}
          />
        </StatsSection>
        <StatsSection
          title={t('stats.sections.waterProductivity')}
          hint={t('stats.sections.waterProductivityHint')}
        >
          <StatsWaterChart
            ranking={data.rankingProvincias}
            tipoCultivo={filters.tipoCultivo}
            tiposCultivo={data.tiposCultivoDisponibles}
            onSelectCrop={(tipoCultivo) => onFiltersChange({ tipoCultivo })}
          />
        </StatsSection>
      </div>
    </div>
  );
};
