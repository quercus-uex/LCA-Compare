import { useTranslation } from 'react-i18next';
import { FiBarChart2 } from 'react-icons/fi';
import { Link } from 'react-router';
import { formatCampaignDate, formatQuantity } from '../../common/format.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import type { CultivoConImpacto } from '../../hooks/parcela.hook.tsx';

// Columnas que se ocultan al estrechar la pantalla, para que la tabla quepa sin scroll lateral
const SM = 'hidden sm:table-cell';
const LG = 'hidden lg:table-cell';

/** Todas las campañas de la parcela, de la más reciente a la más antigua */
export const CampaniasTable = ({ cultivos }: { cultivos: CultivoConImpacto[] }) => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3" aria-labelledby="historial-title">
      <h2 id="historial-title" className="text-2xl font-bold">{t('parcelas.detail.history')}</h2>
      <div className="overflow-x-auto rounded-box bg-base-100 shadow-sm">
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
                    {i === 0 && <span className="badge badge-primary badge-sm">{t('parcelas.detail.current')}</span>}
                  </div>
                </td>
                <td><CropTypeBadge tipo={c.tipo} /></td>
                <td className={`${SM} text-right tabular-nums`}>{formatQuantity(c.superficieCultivada)}</td>
                <td className={`${SM} text-right tabular-nums`}>{formatQuantity(c.produccion)}</td>
                <td className={`${LG} text-right tabular-nums`}>{formatQuantity(c.consumoAgua)}</td>
                <td className={`${LG} text-right tabular-nums`}>{formatQuantity(c.ciclo, 0)}</td>
                <td className="text-right">
                  {c.idResultadoImpacto ? (
                    <Link
                      to={`/resultados/${c.idResultadoImpacto}`}
                      className="btn btn-outline btn-primary btn-xs whitespace-nowrap"
                      aria-label={t('parcelas.viewImpacts')}
                      title={t('parcelas.viewImpacts')}
                    >
                      <FiBarChart2 aria-hidden />
                      <span className="hidden sm:inline">{t('parcelas.viewImpacts')}</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-base-content/70">{t('parcelas.noImpactResult')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
