import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import type { PoblacionRankingItemDto } from './stats.hook.tsx';

type Props = {
  ranking: PoblacionRankingItemDto[];
  selectedCategory?: EfCategoryId;
};

const catFormatter = (value: number) => {
  if (value < 0.001) return value.toExponential(2);
  if (value < 10) return value.toFixed(4);
  return value.toFixed(2);
};

export const StatsPoblacionRanking = ({
  ranking,
  selectedCategory,
}: Props) => {
  const top = ranking.slice(0, 10);
  const bottom = ranking.slice(-10).reverse();

  const getValue = (item: PoblacionRankingItemDto) => {
    if (selectedCategory) {
      return item.impactosPorCategoria[selectedCategory] ?? 0;
    }
    return item.impactoTotalMedio;
  };

  const catLabel = selectedCategory
    ? EF_CATEGORIES.find((c) => c.id === selectedCategory)?.spanishName
    : undefined;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="card-title text-success text-base">
            Top 10 — Menor Impacto
            {catLabel && (
              <span className="text-xs font-normal text-base-content/50">
                ({catLabel})
              </span>
            )}
          </h3>
          <ul className="space-y-1 mt-2">
            {top.map((item, idx) => (
              <li
                key={item.idPoblacion}
                className="flex items-center gap-2 p-2 rounded bg-success text-success-content"
              >
                <span className="font-mono text-xs font-bold w-6">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.nombrePoblacion}
                  </p>
                  <p className="text-xs opacity-70">
                    {item.nombreProvincia} · {item.numParcelas} parcelas
                  </p>
                </div>
                <span className="text-sm font-mono font-bold">
                  {catFormatter(getValue(item))}
                </span>
              </li>
            ))}
            {top.length === 0 && (
              <p className="text-sm text-base-content/50 p-2">Sin datos</p>
            )}
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="card-title text-error text-base">
            Top 10 — Mayor Impacto
            {catLabel && (
              <span className="text-xs font-normal text-base-content/50">
                ({catLabel})
              </span>
            )}
          </h3>
          <ul className="space-y-1 mt-2">
            {bottom.map((item, idx) => (
              <li
                key={item.idPoblacion}
                className="flex items-center gap-2 p-2 rounded bg-error text-error-content"
              >
                <span className="font-mono text-xs font-bold w-6">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.nombrePoblacion}
                  </p>
                  <p className="text-xs opacity-70">
                    {item.nombreProvincia} · {item.numParcelas} parcelas
                  </p>
                </div>
                <span className="text-sm font-mono font-bold">
                  {catFormatter(getValue(item))}
                </span>
              </li>
            ))}
            {bottom.length === 0 && (
              <p className="text-sm text-base-content/50 p-2">Sin datos</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
