import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDownload } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { formatCampaignDate } from '../../common/format.ts';
import { exportJSON } from '../../common/utils.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import { Badge, Dropdown, ErrorAlert, Menu, MenuItem, Page } from '../../components/ui/index.ts';
import { type ParcelaDetalle, useParcela } from '../../hooks/parcela.hook.tsx';
import {
  type ResultadoImpacto,
  useResultadoImpacto,
} from '../../hooks/resultado-impacto.hook.tsx';
import { CompararParcelaDropdown } from '../parcelas/comparar-parcela.component.tsx';
import { CultivoMetricas } from '../parcelas/cultivo-metricas.component.tsx';
import {
  AccesoNote,
  ParcelaBreadcrumbs,
  ParcelaHeroCard,
  useAccesoCrumbs,
  useAccesoEyebrow,
} from '../parcelas/parcela-hero.component.tsx';
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
  const acceso = state.status === 'ready' ? state.parcela.acceso : undefined;
  const accesoCrumbs = useAccesoCrumbs(acceso);
  const accesoEyebrow = useAccesoEyebrow(acceso);

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
      <Page>
        <ParcelaBreadcrumbs />
        <ErrorAlert message={t('resultados.loadError')} onRetry={load} />
      </Page>
    );
  }

  const { resultado, parcela } = state;
  const { cultivo } = resultado;
  const fecha = formatCampaignDate(cultivo.fechaInicioCampania);

  return (
    <Page>
      <ParcelaBreadcrumbs
        root={accesoCrumbs}
        items={[
          { label: parcela.nombre, to: `/parcelas/${parcela.id}` },
          { label: t('resultados.campaign', { date: fecha }) },
        ]}
      />

      <ParcelaHeroCard
        parcela={parcela}
        eyebrow={accesoEyebrow ? `${t('resultados.title')} · ${accesoEyebrow}` : t('resultados.title')}
        actions={
          <div className="flex flex-wrap gap-2">
            {/* Comparar por parcela usaría todas sus campañas, también las no consentidas */}
            {!acceso && <CompararParcelaDropdown parcela={parcela} />}
            <Dropdown
              variant="outline"
              size="sm"
              width="w-40"
              trigger={<><FiDownload aria-hidden />{t('common.actions.export')}</>}
            >
              <Menu>
                <MenuItem onClick={() => exportJSON(resultado.datos)}>JSON</MenuItem>
                <MenuItem onClick={() => buildResultadoCSV(resultado, parcela.nombre, t)}>CSV</MenuItem>
              </Menu>
            </Dropdown>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <CropTypeBadge tipo={cultivo.tipo} />
          <span className="text-muted">{t('parcelas.campaignStarted', { date: fecha })}</span>
          <Badge tone="neutral">{t('resultados.method')}: {resultado.impacto.nombre}</Badge>
        </div>

        <CultivoMetricas cultivo={cultivo} />

        {acceso && <AccesoNote acceso={acceso} />}
      </ParcelaHeroCard>

      <ResultadoTable resultado={resultado} />
    </Page>
  );
};
