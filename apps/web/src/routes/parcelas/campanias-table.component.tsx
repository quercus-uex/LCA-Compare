import { useTranslation } from 'react-i18next';
import { FiBarChart2 } from 'react-icons/fi';
import { formatCampaignDate, formatQuantity } from '../../common/format.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import { Badge, ButtonLink, Card, SectionHeader } from '../../components/ui/index.ts';
import type { CultivoConImpacto } from '../../hooks/parcela.hook.tsx';

// Columnas que se ocultan al estrechar la pantalla, para que la tabla quepa sin scroll lateral
const SM = 'hidden sm:table-cell';
const LG = 'hidden lg:table-cell';

/** Todas las campañas de la parcela, de la más reciente a la más antigua */
type Props = {
  cultivos: CultivoConImpacto[];
  /** Estado de navegación que se pasa al resultado, para que sus migas vuelvan por el mismo camino */
  linkState?: unknown;
};

export const CampaniasTable = ({ cultivos, linkState }: Props) => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3" aria-labelledby="historial-title">
      <SectionHeader level="page" id="historial-title" title={t('parcelas.detail.history')} />
      <Card flush className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>{t('parcelas.detail.campaign')}</th>
              <th>{t('common.fields.crop')}</th>
              <th className={`${SM} text-right`}>{t('parcelas.columns.area')} ({t('common.units.hectares')})</th>
              <th className={`${SM} text-right`}>{t('common.fields.production')} ({t('common.units.kilograms')})</th>
              <th className={`${LG} text-right`}>{t('parcelas.columns.water')} ({t('common.units.cubicMeters')})</th>
              <th className={`${LG} text-right`}>{t('parcelas.columns.cycle')} ({t('common.units.days')})</th>
              <th><span className="sr-only">{t('common.fields.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {cultivos.map((c, i) => (
              <tr key={c.id} className={i === 0 ? 'bg-base-200' : undefined}>
                <td>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 whitespace-nowrap">
                    {formatCampaignDate(c.fechaInicioCampania)}
                    {i === 0 && <Badge tone="primary" size="sm">{t('parcelas.detail.current')}</Badge>}
                  </div>
                </td>
                <td><CropTypeBadge tipo={c.tipo} /></td>
                <td className={`${SM} text-right tabular-nums`}>{formatQuantity(c.superficieCultivada)}</td>
                <td className={`${SM} text-right tabular-nums`}>{formatQuantity(c.produccion)}</td>
                <td className={`${LG} text-right tabular-nums`}>{formatQuantity(c.consumoAgua)}</td>
                <td className={`${LG} text-right tabular-nums`}>{formatQuantity(c.ciclo, 0)}</td>
                <td className="text-right">
                  {c.idResultadoImpacto ? (
                    <ButtonLink
                      variant="outline"
                      size="xs"
                      icon={FiBarChart2}
                      to={`/resultados/${c.idResultadoImpacto}`}
                      state={linkState}
                      className="whitespace-nowrap"
                      aria-label={t('parcelas.viewImpacts')}
                      title={t('parcelas.viewImpacts')}
                    >
                      <span className="hidden sm:inline">{t('parcelas.viewImpacts')}</span>
                    </ButtonLink>
                  ) : (
                    <span className="text-sm text-muted">{t('parcelas.noImpactResult')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
};
