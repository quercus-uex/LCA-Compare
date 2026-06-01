import type { PoblacionRankingItemDto } from './stats.hook.tsx';

type Props = {
  ranking: PoblacionRankingItemDto[];
};

export const StatsPoblacionRanking = ({ ranking }: Props) => {
  const top = ranking.slice(0, 10);
  const bottom = ranking.slice(-10).reverse();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="card-title text-success text-base">
            Top 10 — Menor Impacto
          </h3>
          <ul className="space-y-1 mt-2">
            {top.map((item, idx) => (
              <li
                key={item.idPoblacion}
                className="flex items-center gap-2 p-2 rounded bg-success/5"
              >
                <span className="font-mono text-xs text-success font-bold w-6">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.nombrePoblacion}
                  </p>
                  <p className="text-xs text-base-content/50">
                    {item.nombreProvincia} · {item.numParcelas} parcelas
                  </p>
                </div>
                <span className="text-sm font-mono text-success font-bold">
                  {item.impactoTotalMedio.toFixed(1)}
                </span>
              </li>
            ))}
            {top.length === 0 && (
              <p className="text-sm text-base-content/50 p-2">
                Sin datos
              </p>
            )}
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="card-title text-error text-base">
            Top 10 — Mayor Impacto
          </h3>
          <ul className="space-y-1 mt-2">
            {bottom.map((item, idx) => (
              <li
                key={item.idPoblacion}
                className="flex items-center gap-2 p-2 rounded bg-error/5"
              >
                <span className="font-mono text-xs text-error font-bold w-6">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.nombrePoblacion}
                  </p>
                  <p className="text-xs text-base-content/50">
                    {item.nombreProvincia} · {item.numParcelas} parcelas
                  </p>
                </div>
                <span className="text-sm font-mono text-error font-bold">
                  {item.impactoTotalMedio.toFixed(1)}
                </span>
              </li>
            ))}
            {bottom.length === 0 && (
              <p className="text-sm text-base-content/50 p-2">
                Sin datos
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
