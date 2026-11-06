import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDownload } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { formatCampaignDate } from '../../common/format.ts';
import { exportJSON } from '../../common/utils.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import { Dropdown } from '../../components/dropdown.component.tsx';
import { LoadErrorAlert } from '../../components/load-error-alert.component.tsx';
import { PAGE_CLASS } from '../../components/page-header.component.tsx';
import { type ParcelaDetalle, useParcela } from '../../hooks/parcela.hook.tsx';
import {
  type ResultadoImpacto,
  useResultadoImpacto,
} from '../../hooks/resultado-impacto.hook.tsx';
import { CompararParcelaDropdown } from '../parcelas/comparar-parcela.component.tsx';
import { CultivoMetricas } from '../parcelas/cultivo-metricas.component.tsx';
import { ParcelaBreadcrumbs, ParcelaHeroCard } from '../parcelas/parcela-hero.component.tsx';
import { ParcelaDetailSkeleton } from '../parcelas/parcelas-states.component.tsx';
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
        <ParcelaBreadcrumbs />
        <LoadErrorAlert message={t('resultados.loadError')} onRetry={load} />
      </div>
    );
  }

  const { resultado, parcela } = state;
  const { cultivo } = resultado;
  const fecha = formatCampaignDate(cultivo.fechaInicioCampania);

  return (
    <div className={PAGE_CLASS}>
      <ParcelaBreadcrumbs
        items={[
          { label: parcela.nombre, to: `/parcelas/${parcela.id}` },
          { label: t('resultados.campaign', { date: fecha }) },
        ]}
      />

      <ParcelaHeroCard
        parcela={parcela}
        eyebrow={t('resultados.title')}
        actions={
          <div className="flex flex-wrap gap-2">
            <CompararParcelaDropdown parcela={parcela} />
            <Dropdown
              triggerClassName="btn btn-outline btn-sm"
              contentClassName="w-40"
              trigger={<><FiDownload aria-hidden />{t('common.actions.export')}</>}
            >
              <ul className="menu w-full p-0">
                <li><button type="button" onClick={() => exportJSON(resultado.datos)}>JSON</button></li>
                <li><button type="button" onClick={() => buildResultadoCSV(resultado, parcela.nombre, t)}>CSV</button></li>
              </ul>
            </Dropdown>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <CropTypeBadge tipo={cultivo.tipo} />
          <span className="text-base-content/70">{t('parcelas.campaignStarted', { date: fecha })}</span>
          <span className="badge badge-ghost">{t('resultados.method')}: {resultado.impacto.nombre}</span>
        </div>

        <CultivoMetricas cultivo={cultivo} />
      </ParcelaHeroCard>

      <ResultadoTable resultado={resultado} />
    </div>
  );
};
