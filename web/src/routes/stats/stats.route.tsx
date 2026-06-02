import { useState } from 'react';
import { useStats } from '../../stats/stats.hook.tsx';
import { StatsKPICards } from '../../stats/stats-kpi-cards.component.tsx';
import { StatsProvinciaRanking } from '../../stats/stats-provincia-ranking.component.tsx';
import { StatsTimeline } from '../../stats/stats-timeline.component.tsx';
import { StatsCropDonut } from '../../stats/stats-crop-donut.component.tsx';
import { StatsScatterChart } from '../../stats/stats-scatter-chart.component.tsx';
import { StatsPoblacionRanking } from '../../stats/stats-poblacion-ranking.component.tsx';
import { StatsSpiderChart } from '../../stats/stats-spider-chart.component.tsx';
import { StatsHeatmap } from '../../stats/stats-heatmap.component.tsx';
import { StatsCategorySelector } from '../../stats/stats-category-selector.component.tsx';
import type { EfCategoryId } from '../../common/constants.ts';

export const StatsRoute = () => {
  const [anio, setAnio] = useState<number | undefined>(
    new Date().getFullYear(),
  );
  const [selectedCategory, setSelectedCategory] = useState<
    EfCategoryId | undefined
  >(undefined);
  const { data, loading, error, refetch } = useStats(anio, selectedCategory);

  if (loading) {
    return (
      <div className="w-full max-w-7xl space-y-6">
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
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl">
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={refetch}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-7xl">
        <div className="alert">
          <span>No hay datos disponibles</span>
        </div>
      </div>
    );
  }

  const hasData =
    data.kpis.totalCultivos > 0 ||
    data.rankingProvincias.length > 0 ||
    data.evolucionTemporal.length > 0;

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Estadísticas Globales</h1>
        <div className="flex items-center gap-2">
          <StatsCategorySelector
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
          <select
            className="select select-bordered select-sm"
            value={anio ?? ''}
            onChange={(e) =>
              setAnio(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">Todos los años</option>
            {data.aniosDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasData ? (
        <div className="alert">
          <span>
            No hay datos disponibles{anio ? ` para el año ${anio}` : ''}
          </span>
        </div>
      ) : (
        <>
          <section>
            <StatsKPICards kpis={data.kpis} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Ranking de Provincias</h2>
                <StatsProvinciaRanking
                  ranking={data.rankingProvincias}
                  selectedCategory={selectedCategory}
                />
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Ranking de Poblaciones</h2>
                <StatsPoblacionRanking
                  ranking={data.rankingPoblaciones}
                  selectedCategory={selectedCategory}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">
                  Evolución Temporal por Categoría EF 3.1
                </h2>
                <StatsTimeline data={data.evolucionTemporal} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">
                  Perfil de Impacto
                </h2>
                <StatsSpiderChart
                  ranking={data.rankingProvincias}
                  poblacionRanking={data.rankingPoblaciones}
                />
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">
                  Mapa de Calor: Provincias × Categorías
                </h2>
                <StatsHeatmap ranking={data.rankingProvincias} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">
                  Distribución por Cultivo
                </h2>
                <StatsCropDonut data={data.distribucionCultivos} />
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">
                  Eficiencia: Producción vs Consumo H₂O
                </h2>
                <StatsScatterChart ranking={data.rankingProvincias} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
