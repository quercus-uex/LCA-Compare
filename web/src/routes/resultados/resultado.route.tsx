import { useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import {
  type ResultadoImpacto,
  useResultadoImpacto,
} from '../../hooks/resultado-impacto.hook.tsx';
import { ResultadoTable } from './resultado-table.component.tsx';
import  { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import { DateTime } from 'luxon';
import type { LatLngExpression } from 'leaflet';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import { exportJSON } from '../../common/utils.ts';

export const ResultadoRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const resultadoImpacto = useResultadoImpacto();
  const p = useParcela();

  const [resultado, setResultado] = useState<ResultadoImpacto | undefined>();
  const [parcela, setParcela] = useState<Parcela | undefined>();

  useEffect(() => {
    if (!id) return;
    resultadoImpacto.getById(id)
      .then(r => {
        setResultado(r);
        p.getById(r.cultivo.parcela!.id)
          .then((p) => setParcela(p))
          .catch(() => navigate('/404'));
      })
      .catch(() => navigate('/404'));
  }, [navigate, id, resultadoImpacto, p])

  if (!resultado || !parcela) return <div className="skeleton w-full h-full" />

  return (
    <div className="flex flex-col items-center gap-2 flex-wrap">
      <h1 className="text-3xl font-bold">Resultado de impacto</h1>

      <div className="flex gap-2 h-96 flex-wrap w-full">
        <div className="flex flex-col gap-2 grow">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Método utilizado</h2>
              <p className="text-xl">{resultado.impacto.nombre}</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm grow">
            <div className="card-body">
              <h2 className="card-title">{resultado.cultivo.tipo}</h2>
              <div className="flex flex-col gap-1">
                <p>
                  Fecha de inicio de campaña:{' '}
                  {DateTime.fromISO(resultado.cultivo.fechaInicioCampania, {
                    zone: 'utc',
                  }).toFormat('dd/LL/yyyy')}
                </p>
                <p>
                  Superficie cultivada: {resultado.cultivo.superficieCultivada}{' '}
                  ha
                </p>
                <p>Producción: {resultado.cultivo.produccion} T/ha</p>
                <p>Consumo de agua: {resultado.cultivo.consumoAgua} L/ha</p>
                <p>Ciclo de cultivo: {resultado.cultivo.ciclo} días</p>
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => exportJSON(resultado.datos)}
          >
            Exportar
          </button>
        </div>

        <div className="flex flex-col gap-2 grow">
          <div className="card bg-base-100 shadow-sm grow">
            <div className="card-body">
              <h2 className="card-title">{parcela.nombre}</h2>
              <p>SIGPAC: {parcela.sigpac}</p>
              <p>Referencia catastral: {parcela.refCat}</p>
              <p>ID Portugal: {parcela.ptIdParcela}</p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/compare', { state: { parcelaObjetivo: parcela } })}
          >
            Añadir a comparativa
          </button>
        </div>
        <MapContainer
          className="h-full rounded-box aspect-square"
          center={
            [
              parcela.geom!.coordinates[0][0][1],
              parcela.geom!.coordinates[0][0][0],
            ] as LatLngExpression
          }
          zoom={16}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON data={parcela.geom!} />
        </MapContainer>
      </div>
      <ResultadoTable resultado={resultado} />
    </div>
  );
}