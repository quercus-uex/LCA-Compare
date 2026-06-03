import type { ResultadoImpacto } from '../../hooks/resultado-impacto.hook.tsx';

export const ResultadoTable = ({ resultado }: { resultado: ResultadoImpacto }) => {
  const impactos = resultado.datos.impacto_total.map(i => i.category);
  const pesticidas = resultado.datos.impacto_pesticidas;
  const fertilizantes = resultado.datos.impacto_fertilizantes;
  const sistemaRiego = resultado.datos.impacto_sistema_riego;
  const manejoCultivo = resultado.datos.impacto_manejo_cultivo;
  const total = resultado.datos.impacto_total;
  
  return (
    <div className="overflow-x-auto">
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
              </th>
              <th>
                {fertilizantes
                  .find((i) => i.category === impacto)!
                  .amount.toFixed(5)}
              </th>
              <th>
                {sistemaRiego
                  .find((i) => i.category === impacto)!
                  .amount.toFixed(5)}
              </th>
              <th>
                {manejoCultivo
                  .find((i) => i.category === impacto)!
                  .amount.toFixed(5)}
              </th>
              <th>
                {total.find((i) => i.category === impacto)!.amount.toFixed(5)}
              </th>
              <th>
                {total.find((i) => i.category === impacto)!.unit}
              </th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}