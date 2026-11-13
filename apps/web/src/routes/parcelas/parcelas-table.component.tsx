import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { formatCampaignDate, formatQuantity } from '../../common/format.ts';
import { CropTypeBadge } from '../../components/crop-type-badge.component.tsx';
import { Badge, Card } from '../../components/ui/index.ts';
import type { ParcelaResumen } from '../../hooks/parcela.hook.tsx';
import { formatPoblacion, getIdentificadores, type ParcelaLinkState } from './parcelas.utils.ts';

// Columnas que se ocultan al estrechar la pantalla, para que la tabla quepa sin scroll lateral
const SM = 'hidden sm:table-cell';
const MD = 'hidden md:table-cell';
const LG = 'hidden lg:table-cell';

export const ParcelasTable = ({ parcelas, linkState }: { parcelas: ParcelaResumen[]; linkState: ParcelaLinkState }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card flush className="w-full overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>{t('parcelas.columns.name')}</th>
            <th className={MD}>{t('parcelas.columns.location')}</th>
            <th>{t('parcelas.currentCrop')}</th>
            <th className={SM}>{t('parcelas.columns.lastCampaign')}</th>
            <th className={`${SM} text-right`}>{t('parcelas.columns.area')}</th>
            <th className={`${LG} text-right`}>{t('parcelas.columns.campaigns')}</th>
            <th className={LG}>{t('parcelas.columns.identifiers')}</th>
          </tr>
        </thead>
        <tbody>
          {parcelas.map((p) => (
            <tr
              key={p.id}
              className="cursor-pointer hover:bg-base-200"
              // La fila entera es clicable; el enlace del nombre la hace accesible por teclado
              onClick={() => void navigate(`/parcelas/${p.id}`, { state: linkState })}
            >
              <td>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    to={`/parcelas/${p.id}`}
                    state={linkState}
                    className="link link-hover font-semibold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.nombre}
                  </Link>
                  {p.esParcelaReferencia && (
                    <Badge tone="success" size="sm">{t('parcelas.referenceBadge')}</Badge>
                  )}
                </div>
              </td>
              <td className={MD}>{formatPoblacion(p.poblacion, t)}</td>
              <td>
                {p.ultimoCultivo
                  ? <CropTypeBadge tipo={p.ultimoCultivo.tipo} />
                  : <span className="text-muted">{t('parcelas.noCrops')}</span>}
              </td>
              <td className={`${SM} whitespace-nowrap`}>
                {p.ultimoCultivo ? formatCampaignDate(p.ultimoCultivo.fechaInicioCampania) : '—'}
              </td>
              <td className={`${SM} text-right tabular-nums whitespace-nowrap`}>
                {p.ultimoCultivo
                  ? `${formatQuantity(p.ultimoCultivo.superficieCultivada)} ${t('common.units.hectares')}`
                  : '—'}
              </td>
              <td className={`${LG} text-right tabular-nums`}>{p.numCultivos}</td>
              <td className={`${LG} font-mono text-xs`}>
                {getIdentificadores(p, t).map((id) => (
                  <div key={id.key} title={id.label}>{id.value}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};
