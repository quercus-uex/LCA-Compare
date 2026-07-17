import { useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import {
  type ResultadoImpacto,
  useResultadoImpacto,
} from '../../hooks/resultado-impacto.hook.tsx';
import { ResultadoTable } from './resultado-table.component.tsx';
import  { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import { DateTime } from 'luxon';
import { MapPreview } from '../../components/map-preview.component.tsx';
import { exportCSV, exportJSON } from '../../common/utils.ts';
import { useTranslation } from 'react-i18next';

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
              onClick={() => {
                const find = (
                  arr: typeof resultado.datos.impacto_pesticidas,
                  category: string,
                ) => arr.find(i => i.category === category)!.amount.toFixed(5);
                const rows = resultado.datos.impacto_total.map(
                  ({ category, amount, unit }) => [
                    category,
                    find(resultado.datos.impacto_pesticidas, category),
                    find(resultado.datos.impacto_fertilizantes, category),
                    find(resultado.datos.impacto_sistema_riego, category),
                    find(resultado.datos.impacto_manejo_cultivo, category),
                    amount.toFixed(5),
                    unit,
                  ],
                );
                exportCSV(
                  `impacto-${parcela.nombre}.csv`,
                  [
                    [
                      t('common.fields.category'),
                      t('common.fields.pesticides'),
                      t('common.fields.fertilizers'),
                      t('common.fields.irrigationSystem'),
                      t('common.fields.cropManagement'),
                      t('common.fields.total'),
                      t('common.fields.unit'),
                    ],
                    ...rows,
                  ],
                );
              }}
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
                  onClick={() => navigate('/compare', { state: { parcelaObjetivo: parcela } })}
                >
                  {t('compare.filters.target')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/compare', { state: { parcelaReferencia: parcela } })}
                >
                  {t('compare.filters.reference')}
                </button>
              </li>
            </ul>
          </div>
        </div>
        <MapPreview
          className="h-full rounded-box aspect-square"
          polygon={parcela.geom!}
        />
      </div>
      <ResultadoTable resultado={resultado} />
    </div>
  );
}
