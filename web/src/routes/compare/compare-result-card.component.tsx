import type { CompareResult } from '../../hooks/compare.hook.tsx';
import type { ResultadoImpacto } from '../../hooks/resultado-impacto.hook.tsx';

export const CompareResultCard = ({ result }: { result?: CompareResult }) => {
  if (!result || !result.left) return (
    <div className="card bg-base-100 grow">
      <div className="card-body">
        <p>Aquí aparecerá el resultado de la comparativa</p>
      </div>
    </div>
  );

  const exportResult = (r: ResultadoImpacto['datos']) => {
    const json = JSON.stringify(r, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card bg-base-100 grow">
      <div className="card-body">
        <div className="flex w-full justify-between">
          <h2 className="card-title text-xl">Resultado</h2>
          <div className="flex gap-2">
            {result.right && result.left && (
              <button className="btn btn-accent">Exportar comparativa</button>
            )}
            {result.left && (
              <button
                className="btn btn-accent"
                onClick={() => exportResult(result.left!)}
              >
                Exportar referencia
              </button>
            )}
            {result.right && (
              <button
                className="btn btn-accent"
                onClick={() => exportResult(result.right!)}
              >
                Exportar objetivo
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-md">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Cantidad referencia</th>
                {result.right && <th>Cantidad objetivo</th>}
                <th>Unidad</th>
                {result.right && <th>Diferencia</th>}
              </tr>
            </thead>
            <tbody>
              {result.left.impacto_total.map((i, index) => (
                <tr key={index}>
                  <th>{i.category}</th>
                  <th>{i.amount}</th>
                  {result.right && (
                    <th>{result.right.impacto_total[index].amount}</th>
                  )}
                  <th>{i.unit}</th>
                  {result.right && (
                    <th>{result.diff?.impacto_total[index].diff} %</th>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}