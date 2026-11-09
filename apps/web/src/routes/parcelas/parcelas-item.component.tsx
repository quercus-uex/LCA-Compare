import { useTranslation } from 'react-i18next';
import { FiMapPin } from 'react-icons/fi';
import { formatCampaignDate, formatQuantity } from '../../common/format.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import { Badge, CardLink } from '../../components/ui/index.ts';
import type { ParcelaResumen } from '../../hooks/parcela.hook.tsx';
import { formatPoblacion, getIdentificadores, type ParcelaLinkState } from './parcelas.utils.ts';

export const ParcelasItem = ({ parcela, linkState }: { parcela: ParcelaResumen; linkState: ParcelaLinkState }) => {
  const { t } = useTranslation();
  const cultivo = parcela.ultimoCultivo;
  const identificadores = getIdentificadores(parcela, t);

  return (
    <CardLink to={`/parcelas/${parcela.id}`} state={linkState} label={t('parcelas.openPlot', { nombre: parcela.nombre })}>
        {/* Sin <p>: DaisyUI les da flex-grow dentro del cuerpo de la tarjeta y, al estirarse las de una fila, se descuadra el espaciado */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold break-words">{parcela.nombre}</h2>
            {parcela.esParcelaReferencia && (
              <Badge tone="success" size="sm" className="mt-1 shrink-0">{t('parcelas.referenceBadge')}</Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted">
            <FiMapPin aria-hidden className="shrink-0" />
            {formatPoblacion(parcela.poblacion, t)}
          </div>

          {cultivo ? (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <CropTypeBadge tipo={cultivo.tipo} />
                <span className="text-sm text-muted">
                  {formatCampaignDate(cultivo.fechaInicioCampania)}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-semibold tabular-nums">
                  {formatQuantity(cultivo.superficieCultivada)} {t('common.units.hectares')}
                </span>
                <span className="text-muted"> · {t('parcelas.campaigns', { count: parcela.numCultivos })}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">{t('parcelas.noCrops')}</div>
          )}

          {identificadores.length > 0 && (
            <dl className="flex flex-col gap-0.5 text-xs text-muted">
              {identificadores.map((id) => (
                // La etiqueta y el valor usan fuentes distintas: se alinean por la línea base
                <div key={id.key} className="flex items-baseline gap-1">
                  <dt>{id.label}:</dt>
                  <dd className="font-mono break-all">{id.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
    </CardLink>
  );
};
