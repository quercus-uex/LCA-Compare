import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { exportJSON } from '../../common/utils.ts';
import { MapPreview } from '../../components/map-preview.component.tsx';
import  { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import {
  type ResultadoImpacto,
  useResultadoImpacto,
} from '../../hooks/resultado-impacto.hook.tsx';
import { buildResultadoCSV } from './resultado-export.utils.ts';
import { ResultadoTable } from './resultado-table.component.tsx';

export const ResultadoRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const resultadoImpacto = useResultadoImpacto();
  const p = useParcela();
  const { t } = useTranslation();

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
      <h1 className="text-3xl font-bold">{t('resultados.title')}</h1>

      <div className="flex gap-2 h-96 flex-wrap w-full">
        <div className="flex flex-col gap-2 grow">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">{t('resultados.method')}</h2>
              <p className="text-xl">{resultado.impacto.nombre}</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm grow">
            <div className="card-body">
              <h2 className="card-title">{resultado.cultivo.tipo}</h2>
              <div className="flex flex-col gap-1">
                <p>
                  {t('common.fields.campaignStartDate')}:{' '}
                  {DateTime.fromISO(resultado.cultivo.fechaInicioCampania, {
                    zone: 'utc',
                  }).toFormat('dd/LL/yyyy')}
                </p>
                <p>
                  {t('common.fields.cultivatedArea')}: {resultado.cultivo.superficieCultivada}{' '}
                  {t('common.units.hectares')}
                </p>
                <p>{t('common.fields.production')}: {resultado.cultivo.produccion} {t('common.units.tonsPerHectare')}</p>
                <p>{t('common.fields.waterConsumption')}: {resultado.cultivo.consumoAgua} {t('common.units.litersPerHectare')}</p>
                <p>{t('common.fields.cropCycle')}: {resultado.cultivo.ciclo} {t('common.units.days')}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <button
              className="btn btn-secondary flex-1"
              onClick={() => exportJSON(resultado.datos)}
            >
              {t('common.actions.export')} JSON
            </button>
            <button
              className="btn btn-secondary flex-1"
              onClick={() => buildResultadoCSV(resultado, parcela.nombre, t)}
            >
              {t('common.actions.export')} CSV
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 grow">
          <div className="card bg-base-100 shadow-sm grow">
            <div className="card-body">
              <h2 className="card-title">{parcela.nombre}</h2>
              <p>SIGPAC: {parcela.sigpac ?? '-'}</p>
              <p>{t('common.fields.cadastralReference')}: {parcela.refCat ?? '-'}</p>
              <p>{t('common.fields.portugalId')}: {parcela.ptIdParcela ?? '-'}</p>
            </div>
          </div>

          <div className="dropdown dropdown-end w-full">
            <button
              type="button"
              className="btn btn-primary w-full"
              tabIndex={0}
            >
              {t('resultados.addToComparison')}
            </button>
            <ul
              tabIndex={-1}
              className="dropdown-content menu bg-base-100 rounded-box z-50 w-full p-2 shadow-sm"
            >
              <li>
                <button
                  type="button"
                  onClick={() => void navigate('/compare', { state: { parcelaObjetivo: parcela } })}
                >
                  {t('compare.filters.target')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => void navigate('/compare', { state: { parcelaReferencia: parcela } })}
                >
                  {t('compare.filters.reference')}
                </button>
              </li>
            </ul>
          </div>
        </div>
        <MapPreview
          className="h-full rounded-box aspect-square"
          polygon={parcela.geom}
        />
      </div>
      <ResultadoTable resultado={resultado} />
    </div>
  );
}
