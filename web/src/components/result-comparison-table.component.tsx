import type { CompareResult } from '../hooks/compare.hook.tsx';

export const ResultComparisonTable = ({
  result,
  selectedImpact,
}: {
  result: CompareResult;
  selectedImpact:
    | 'impacto_total'
    | 'impacto_pesticidas'
    | 'impacto_sistema_riego'
    | 'impacto_fertilizantes'
    | 'impacto_manejo_cultivo';
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="table table-md">
        <thead>
          <tr>
            <th>Catdegoría</th>
            <th>Cantidad referencia</th>
            {result.impacto_total[0].tarAmount && <th>Cantidad objetivo</th>}
            <th>Unidad</th>
            {result.impacto_total[0].tarAmount && <th>Diferencia</th>}
          </tr>
        </thead>
        <tbody>
          {result[selectedImpact].map((i, index) => (
            <tr key={index}>
              <th>{i.category}</th>
              <th>{i.refAmount.toFixed(4)}</th>
              {i.tarAmount && <th>{i.tarAmount.toFixed(4)}</th>}
              <th>{i.unit}</th>
              {i.tarAmount && (
                <th
                  className={`${i.diff >= 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {i.diff.toFixed(2)} %
                </th>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
