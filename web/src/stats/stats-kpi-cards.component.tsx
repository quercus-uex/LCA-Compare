import type { KpiDto } from './stats.hook.tsx';
import { FiBox, FiGrid, FiDroplet, FiTrendingUp, FiActivity } from 'react-icons/fi';

type Props = {
  kpis: KpiDto;
};

const formatter = (value: number) =>
  new Intl.NumberFormat('es-ES').format(value);

export const StatsKPICards = ({ kpis }: Props) => {
  const cards = [
    {
      label: 'Parcelas',
      value: formatter(kpis.totalParcelas),
      unit: '',
      icon: <FiGrid size={24} />,
    },
    {
      label: 'Cultivos',
      value: formatter(kpis.totalCultivos),
      unit: '',
      icon: <FiBox size={24} />,
    },
    {
      label: 'Superficie Total',
      value: formatter(kpis.superficieTotal),
      unit: 'Ha',
      icon: <FiActivity size={24} />,
    },
    {
      label: 'Consumo H₂O Medio',
      value: formatter(kpis.consumoAguaMedio),
      unit: 'L/Ha',
      icon: <FiDroplet size={24} />,
    },
    {
      label: 'Impacto Total Medio',
      value: formatter(kpis.impactoTotalMedio),
      unit: '',
      icon: <FiTrendingUp size={24} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 text-base-content/60">
              {card.icon}
              <span className="text-sm font-medium">{card.label}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-sm text-base-content/60">{card.unit}</span>
              )}
            </div>
            {kpis.variacionInteranual !== null && (
              <div
                className={`text-xs font-medium mt-1 ${
                  kpis.variacionInteranual <= 0
                    ? 'text-success'
                    : 'text-error'
                }`}
              >
                {kpis.variacionInteranual <= 0 ? '↓' : '↑'}{' '}
                {Math.abs(kpis.variacionInteranual).toFixed(1)}% vs año anterior
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
