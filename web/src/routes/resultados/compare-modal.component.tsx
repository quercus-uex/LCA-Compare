import type { ResultadoImpactoComparison } from '../../hooks/resultado-impacto.hook.tsx';

export const CompareModal = ({ comparison }: { comparison?: ResultadoImpactoComparison }) => {

  if (!comparison) return <dialog id="compare-modal" className="modal" />;
  const impactos = comparison.resultado.datos.impacto_total.map((i) => i.category);

  const pesticidas = comparison.nearbyMean.impacto_pesticidas;
  const fertilizantes = comparison.nearbyMean.impacto_fertilizantes;
  const sistemaRiego = comparison.nearbyMean.impacto_sistema_riego;
  const manejoCultivo = comparison.nearbyMean.impacto_manejo_cultivo;
  const total = comparison.nearbyMean.impacto_total;

  const DiffFormatted = ({ diff }: { diff: string }) => {
    return (
      <span
        className={diff.startsWith('-') ? 'text-green-400' : 'text-red-400'}
      >{diff}</span>
    );
  }

  return (
    <dialog id="compare-modal" className="modal">
      <div className="modal-box h-11/12 w-11/12 max-w-6xl overflow-hidden">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
            ✕
          </button>
        </form>

        <div className="overflow-x-auto h-full m-2">
          <table className="table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Pesticidas</th>
                <th>Fertilizantes</th>
                <th>Sistema de riego</th>
                <th>Manejo de cultivo</th>
                <th>Total</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {impactos.map((impacto) => (
                <tr key={impacto}>
                  <th>{impacto}</th>
                  <th>
                    {pesticidas
                      .find((i) => i.category === impacto)!
                      .amount.toFixed(5)}
                    <DiffFormatted
                      diff={
                        pesticidas.find((i) => i.category === impacto)!.diff
                      }
                    />
                  </th>
                  <th>
                    {fertilizantes
                      .find((i) => i.category === impacto)!
                      .amount.toFixed(5)}
                    <DiffFormatted
                      diff={
                        fertilizantes.find((i) => i.category === impacto)!.diff
                      }
                    />
                  </th>
                  <th>
                    {sistemaRiego
                      .find((i) => i.category === impacto)!
                      .amount.toFixed(5)}
                    <DiffFormatted
                      diff={
                        sistemaRiego.find((i) => i.category === impacto)!.diff
                      }
                    />
                  </th>
                  <th>
                    {manejoCultivo
                      .find((i) => i.category === impacto)!
                      .amount.toFixed(5)}
                    <DiffFormatted
                      diff={
                        manejoCultivo.find((i) => i.category === impacto)!.diff
                      }
                    />
                  </th>
                  <th>
                    {total
                      .find((i) => i.category === impacto)!
                      .amount.toFixed(5)}
                    <DiffFormatted
                      diff={total.find((i) => i.category === impacto)!.diff}
                    />
                  </th>
                  <th>{total.find((i) => i.category === impacto)!.unit}</th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  );
}