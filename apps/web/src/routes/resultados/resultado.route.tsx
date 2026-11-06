import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiMapPin } from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { formatCampaignDate } from '../../common/format.ts';
import { exportJSON } from '../../common/utils.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import { MapPreview } from '../../components/map-preview.component.tsx';
import { PAGE_CLASS } from '../../components/page-header.component.tsx';
import { type ParcelaDetalle, useParcela } from '../../hooks/parcela.hook.tsx';
import {
  type ResultadoImpacto,
  useResultadoImpacto,
} from '../../hooks/resultado-impacto.hook.tsx';
import { CompararParcelaDropdown } from '../parcelas/comparar-parcela.component.tsx';
import { CultivoMetricas } from '../parcelas/cultivo-metricas.component.tsx';
import { LoadErrorAlert, ParcelaDetailSkeleton } from '../parcelas/parcelas-states.component.tsx';
import { formatPoblacion } from '../parcelas/parcelas.utils.ts';
import { buildResultadoCSV } from './resultado-export.utils.ts';
import { ResultadoTable } from './resultado-table.component.tsx';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; resultado: ResultadoImpacto; parcela: ParcelaDetalle };

export const ResultadoRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const resultadoImpacto = useResultadoImpacto();
  const p = useParcela();
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    if (!id) return;
    setState({ status: 'loading' });
    resultadoImpacto.getById(id)
      .then(async (resultado) => {
        const parcela = await p.getById(resultado.cultivo.parcela!.id);
        setState({ status: 'ready', resultado, parcela });
      })
      .catch((e: unknown) => {
        // Un resultado de una parcela ajena se trata igual que uno inexistente
        if (e instanceof ApiError && (e.status === 404 || e.status === 401)) {
          void navigate('/404', { replace: true });
        } else {
          setState({ status: 'error' });
        }
      });
  }, [id, navigate, p, resultadoImpacto]);

  useEffect(load, [load]);

  if (state.status === 'loading') return <ParcelaDetailSkeleton />;

  if (state.status === 'error') {
    return (
      <div className={PAGE_CLASS}>
        <nav className="breadcrumbs text-sm [&>ul]:flex-wrap [&>ul]:whitespace-normal" aria-label={t('parcelas.detail.breadcrumb')}>
          <ul><li><Link to="/parcelas">{t('parcelas.title')}</Link></li></ul>
        </nav>
        <LoadErrorAlert message={t('resultados.loadError')} onRetry={load} />
      </div>
    );
  }

  const { resultado, parcela } = state;
  const { cultivo } = resultado;
  const fecha = formatCampaignDate(cultivo.fechaInicioCampania);

  return (
    <div className={PAGE_CLASS}>
      <nav className="breadcrumbs text-sm [&>ul]:flex-wrap [&>ul]:whitespace-normal" aria-label={t('parcelas.detail.breadcrumb')}>
        <ul>
          <li><Link to="/parcelas">{t('parcelas.title')}</Link></li>
          <li><Link to={`/parcelas/${parcela.id}`}>{parcela.nombre}</Link></li>
          <li aria-current="page">{t('resultados.campaign', { date: fecha })}</li>
        </ul>
      </nav>

      <div className="card bg-base-100 shadow-sm lg:card-side">
        <figure className="lg:w-96 lg:shrink-0 lg:self-stretch">
          <MapPreview
            polygon={parcela.geom ?? undefined}
            satellite
            className="h-64 w-full sm:h-80 lg:h-full lg:min-h-96"
          />
        </figure>
        <div className="card-body gap-5 min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
                {t('resultados.title')}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold break-words">{parcela.nombre}</h1>
                {parcela.esParcelaReferencia && (
                  <span className="badge badge-success">{t('parcelas.referenceBadge')}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-base-content/70">
                <FiMapPin aria-hidden />
                {formatPoblacion(parcela.poblacion, t)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <CompararParcelaDropdown parcela={parcela} />
              <div className="dropdown dropdown-end">
                <button type="button" tabIndex={0} className="btn btn-outline btn-sm">
                  <FiDownload aria-hidden />
                  {t('common.actions.export')}
                </button>
                <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-[1000] mt-2 w-40 p-2 shadow-sm">
                  <li><button type="button" onClick={() => exportJSON(resultado.datos)}>JSON</button></li>
                  <li><button type="button" onClick={() => buildResultadoCSV(resultado, parcela.nombre, t)}>CSV</button></li>
                </ul>
              </div>
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <CropTypeBadge tipo={cultivo.tipo} />
            <span className="text-base-content/70">{t('parcelas.campaignStarted', { date: fecha })}</span>
            <span className="badge badge-ghost">{t('resultados.method')}: {resultado.impacto.nombre}</span>
          </div>

          <CultivoMetricas cultivo={cultivo} />
        </div>
      </div>

      <ResultadoTable resultado={resultado} />
    </div>
  );
};
