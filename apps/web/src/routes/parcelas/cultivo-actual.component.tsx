import { useTranslation } from 'react-i18next';
import { formatCampaignDate } from '../../common/format.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import { ButtonLink } from '../../components/ui/index.ts';
import type { CultivoConImpacto } from '../../hooks/parcela.hook.tsx';
import { CultivoMetricas } from './cultivo-metricas.component.tsx';

export const CultivoActual = ({ cultivo }: { cultivo: CultivoConImpacto }) => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3" aria-labelledby="cultivo-actual-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="cultivo-actual-title" className="text-xl font-semibold">{t('parcelas.currentCrop')}</h2>
          <CropTypeBadge tipo={cultivo.tipo} />
        </div>
        {cultivo.idResultadoImpacto ? (
          <ButtonLink variant="primary" size="sm" to={`/resultados/${cultivo.idResultadoImpacto}`}>
            {t('parcelas.viewImpacts')}
          </ButtonLink>
        ) : (
          <span className="text-sm text-muted">{t('parcelas.noImpactResult')}</span>
        )}
      </div>
      <div className="text-sm text-muted">
        {t('parcelas.campaignStarted', { date: formatCampaignDate(cultivo.fechaInicioCampania) })}
      </div>
      <CultivoMetricas cultivo={cultivo} />
    </section>
  );
};
