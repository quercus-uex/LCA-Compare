import { useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import {
  type ResultadoImpacto,
  type ResultadoImpactoComparison,
  useResultadoImpacto,
} from '../../hooks/resultado-impacto.hook.tsx';
import { ResultadoTable } from './resultado-table.component.tsx';
import  { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import { DateTime } from 'luxon';
import type { LatLngExpression } from 'leaflet';
import { Circle, MapContainer, Polygon, TileLayer } from 'react-leaflet';
import { centroidOfPolygon } from '../../utils/centroid-of-polygon.ts';
import { CompareModal } from './compare-modal.component.tsx';

export const ResultadoRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const resultadoImpacto = useResultadoImpacto();
  const p = useParcela();

  const [resultado, setResultado] = useState<ResultadoImpacto | undefined>();
  const [parcela, setParcela] = useState<Parcela | undefined>();
  const [comparisonResult, setComparisonResult] = useState<ResultadoImpactoComparison | undefined>();
  const [range, setRange] = useState(0);

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

  const compare = async () => {
    const comparison = await resultadoImpacto.compareById(id!, range);
    setComparisonResult(comparison);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    document.getElementById('compare-modal')!.showModal();
  }

  if (!resultado || !parcela) return <div className="skeleton w-full h-full" />

  return (
    <div className="flex flex-col items-center gap-2 flex-wrap">
      <h1 className="text-3xl font-bold">Resultado de impacto</h1>

      <div className="flex gap-2 h-96 flex-wrap">
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

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Comparar</h2>
              <p>Rango: {range} m</p>
              <input
                type="range"
                min={10}
                max={5000}
                value={range}
                className="range"
                step={10}
                onChange={(e) => {
                  setRange(parseInt(e.target.value));
                }}
              />

              <button className="btn btn-primary" onClick={compare}>Comparar cultivo</button>
            </div>
          </div>
        </div>
        <MapContainer
          className="h-full rounded-box aspect-square"
          center={parcela.geom![0] as LatLngExpression}
          zoom={16}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={centroidOfPolygon(parcela.geom!) as LatLngExpression}
            radius={range}
          />
          <Polygon positions={parcela.geom as LatLngExpression[]} />
        </MapContainer>
      </div>

      <ResultadoTable resultado={resultado} />
      <CompareModal comparison={comparisonResult} />
    </div>
  );
}