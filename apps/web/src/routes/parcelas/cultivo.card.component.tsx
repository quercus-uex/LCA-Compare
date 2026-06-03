import type { Cultivo } from '../../hooks/parcela.hook.tsx';
import { DateTime } from 'luxon';
import { useNavigate } from 'react-router';

export const CultivoCard = ({ cultivo }: { cultivo: Cultivo }) => {
  const navigate = useNavigate();

  return (
    <div className="card card-side bg-base-200 shadow-sm grow">
      <div className="card-body">
        <div className="flex gap-5 justify-between flex-col md:flex-row">
          <div className="flex flex-col">
            <p className="text-lg">Tipo: {cultivo.tipo}</p>
            <p className="text-lg">
              Fecha de inicio de campaña:{' '}
              {DateTime.fromISO(cultivo.fechaInicioCampania, { zone: 'utc' }).toFormat("dd/LL/yyyy")}
            </p>
            <p className="text-lg">
              Superficie cultivada: {cultivo.superficieCultivada} ha
            </p>
            <p className="text-lg">Producción: {cultivo.produccion} T/ha</p>
            <p className="text-lg">
              Consumo de agua: {cultivo.consumoAgua} L/ha
            </p>
            <p className="text-lg">Ciclo de cultivo: {cultivo.ciclo} días</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/resultados/${cultivo.idResultadoImpacto}`)}
          >
            Ver impactos
          </button>
        </div>
      </div>
    </div>
  );  
}