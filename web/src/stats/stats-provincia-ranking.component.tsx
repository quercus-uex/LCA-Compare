import { useState } from 'react';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';

type Props = {
  ranking: ProvinciaRankingItemDto[];
};

type SortColumn = keyof ProvinciaRankingItemDto;

const COLUMNS: { key: SortColumn; label: string }[] = [
  { key: 'nombreProvincia', label: 'Provincia' },
  { key: 'numParcelas', label: 'Parcelas' },
  { key: 'numCultivos', label: 'Cultivos' },
  { key: 'superficieTotal', label: 'Sup. Total (Ha)' },
  { key: 'produccionMedia', label: 'Prod. Media (T/Ha)' },
  { key: 'consumoAguaMedio', label: 'Cons. H₂O (L/Ha)' },
  { key: 'impactoTotalMedio', label: 'Impacto Total' },
  { key: 'eficiencia', label: 'Eficiencia' },
];

const formatter = (value: number, decimals = 0) =>
  new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

export const StatsProvinciaRanking = ({ ranking }: Props) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('impactoTotalMedio');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...ranking].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const handleSort = (col: SortColumn) => {
    if (col === sortColumn) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDir('asc');
    }
  };

  const getRowClass = (index: number) => {
    if (index < 3) return 'bg-success/10';
    if (index >= sorted.length - 3) return 'bg-error/10';
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra table-sm">
        <thead>
          <tr>
            <th>#</th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="cursor-pointer hover:bg-base-200 select-none"
                onClick={() => handleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {sortColumn === col.key && (
                    <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, idx) => (
            <tr key={item.idProvincia} className={getRowClass(idx)}>
              <td className="font-mono text-xs">{idx + 1}</td>
              <td className="font-medium">{item.nombreProvincia}</td>
              <td>{formatter(item.numParcelas)}</td>
              <td>{formatter(item.numCultivos)}</td>
              <td>{formatter(item.superficieTotal, 1)}</td>
              <td>{formatter(item.produccionMedia, 2)}</td>
              <td>{formatter(item.consumoAguaMedio, 1)}</td>
              <td>{formatter(item.impactoTotalMedio, 2)}</td>
              <td>{item.eficiencia.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
