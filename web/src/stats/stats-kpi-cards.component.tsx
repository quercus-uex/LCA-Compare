import type { KpiDto } from './stats.hook.tsx';
import { EF_CATEGORIES } from '../common/constants.ts';
import { FiBox, FiGrid, FiActivity } from 'react-icons/fi';

type Props = {
  kpis: KpiDto;
};

const formatter = (value: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 }).format(value);

const shortFormatter = (value: number) =>
  new Intl.NumberFormat('es-ES').format(value);

export const StatsKPICards = ({ kpis }: Props) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {EF_CATEGORIES.map((cat) => {
          const value = kpis.impactosPorCategoria[cat.id] ?? 0;
          return (
            <div
              key={cat.id}
              className="card bg-base-100 shadow-sm border-l-4"
              style={{ borderLeftColor: cat.color }}
            >
              <div className="card-body p-3">
                <div
                  className="text-xs font-semibold truncate tooltip tooltip-top"
                  data-tip={`${cat.spanishName} (${cat.unit})`}
                  style={{ color: cat.color }}
                >
                  {cat.spanishName}
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-bold truncate">
                    {formatter(value)}
                  </span>
                </div>
                <div className="text-[10px] text-base-content/50 truncate">
                  {cat.unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="stat bg-base-100 shadow-sm rounded-box px-4 py-2 min-w-0 flex-1">
          <div className="stat-title text-xs flex items-center gap-1">
            <FiGrid size={14} />
            Parcelas
          </div>
          <div className="stat-value text-lg">
            {shortFormatter(kpis.totalParcelas)}
          </div>
        </div>
        <div className="stat bg-base-100 shadow-sm rounded-box px-4 py-2 min-w-0 flex-1">
          <div className="stat-title text-xs flex items-center gap-1">
            <FiBox size={14} />
            Cultivos
          </div>
          <div className="stat-value text-lg">
            {shortFormatter(kpis.totalCultivos)}
          </div>
        </div>
        <div className="stat bg-base-100 shadow-sm rounded-box px-4 py-2 min-w-0 flex-1">
          <div className="stat-title text-xs flex items-center gap-1">
            <FiActivity size={14} />
            Superficie
          </div>
          <div className="stat-value text-lg">
            {shortFormatter(kpis.superficieTotal)}{' '}
            <span className="text-sm font-normal text-base-content/50">Ha</span>
          </div>
        </div>
        {kpis.variacionInteranual !== null && (
          <div className="stat bg-base-100 shadow-sm rounded-box px-4 py-2 min-w-0 flex-1">
            <div className="stat-title text-xs">Variación Interanual</div>
            <div
              className={`stat-value text-lg ${
                kpis.variacionInteranual <= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {kpis.variacionInteranual <= 0 ? '↓' : '↑'}{' '}
              {Math.abs(kpis.variacionInteranual).toFixed(1)}%
            </div>
            <div className="stat-desc text-[10px]">vs año anterior</div>
          </div>
        )}
      </div>
    </div>
  );
};
