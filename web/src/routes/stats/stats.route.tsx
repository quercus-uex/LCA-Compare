import { useState } from 'react';
import { useStats } from '../../stats/stats.hook.tsx';
import { StatsKPICards } from '../../stats/stats-kpi-cards.component.tsx';
import { StatsProvinciaRanking } from '../../stats/stats-provincia-ranking.component.tsx';
import { StatsBarChart } from '../../stats/stats-bar-chart.component.tsx';
import { StatsTimeline } from '../../stats/stats-timeline.component.tsx';
import { StatsCropDonut } from '../../stats/stats-crop-donut.component.tsx';
import { StatsScatterChart } from '../../stats/stats-scatter-chart.component.tsx';
import { StatsPoblacionRanking } from '../../stats/stats-poblacion-ranking.component.tsx';
import { StatsImpactScatterChart } from '../../stats/stats-impact-scatter-chart.component.tsx';

export const StatsRoute = () => {
  const [anio, setAnio] = useState<number | undefined>(new Date().getFullYear());
  const { data, loading, error, refetch } = useStats(anio);

  if (loading) {
    return (
      <div className="w-full max-w-7xl space-y-6">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
        <div className="skeleton h-80 rounded-xl" />
        <div className="skeleton h-60 rounded-xl" />
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
        <select
          className="select select-bordered"
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

      {!hasData ? (
        <div className="alert">
          <span>No hay datos disponibles{anio ? ` para el año ${anio}` : ''}</span>
        </div>
      ) : (
        <>
          <section>
            <StatsKPICards kpis={data.kpis} />
          </section>

          <section>
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Ranking de Provincias</h2>
                <StatsProvinciaRanking ranking={data.rankingProvincias} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Impacto Total por Provincia</h2>
                <StatsBarChart ranking={data.rankingProvincias} />
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Distribución por Cultivo</h2>
                <StatsCropDonut data={data.distribucionCultivos} />
              </div>
            </div>
          </section>

          <section>
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Evolución Temporal</h2>
                <StatsTimeline data={data.evolucionTemporal} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">
                  Eficiencia: Producción vs Consumo H₂O
                </h2>
                <StatsScatterChart ranking={data.rankingProvincias} />
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Ranking de Poblaciones</h2>
                <StatsPoblacionRanking ranking={data.rankingPoblaciones} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">
                  Impacto vs Superficie por Provincia
                </h2>
                <StatsImpactScatterChart ranking={data.rankingProvincias} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
