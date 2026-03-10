import type { ResultadoImpacto } from '../hooks/resultado-impacto.hook.tsx';
import type { CompareDiff } from '../hooks/compare.hook.tsx';

export const ResultComparisonTable = ({
  reference,
  obj,
  diff,
}: {
  reference: ResultadoImpacto['datos']['impacto_total'];
  obj?: ResultadoImpacto['datos']['impacto_total'];
  diff?: CompareDiff['impacto_total'];
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="table table-md">
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Cantidad referencia</th>
            {obj && <th>Cantidad objetivo</th>}
            <th>Unidad</th>
            {diff && <th>Diferencia</th>}
          </tr>
        </thead>
        <tbody>
          {reference.map((i, index) => (
            <tr key={index}>
              <th>{i.category}</th>
              <th>{i.amount.toFixed(4)}</th>
              {obj && <th>{obj[index].amount.toFixed(4)}</th>}
              <th>{i.unit}</th>
              {diff && (
                <th
                  className={`${diff[index].diff >= 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {diff[index].diff} %
                </th>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
