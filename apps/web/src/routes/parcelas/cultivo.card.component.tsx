import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { Cultivo } from '../../hooks/parcela.hook.tsx';

export const CultivoCard = ({ cultivo }: { cultivo: Cultivo }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="card card-side bg-base-200 shadow-sm grow">
      <div className="card-body">
        <div className="flex gap-5 justify-between flex-col md:flex-row">
          <div className="flex flex-col">
            <p className="text-lg">{t('common.fields.cropType')}: {cultivo.tipo}</p>
            <p className="text-lg">
              {t('common.fields.campaignStartDate')}:{' '}
              {DateTime.fromISO(cultivo.fechaInicioCampania, { zone: 'utc' }).toFormat("dd/LL/yyyy")}
            </p>
            <p className="text-lg">
              {t('common.fields.cultivatedArea')}: {cultivo.superficieCultivada} {t('common.units.hectares')}
            </p>
            <p className="text-lg">{t('common.fields.production')}: {cultivo.produccion} {t('common.units.tonsPerHectare')}</p>
            <p className="text-lg">
              {t('common.fields.waterConsumption')}: {cultivo.consumoAgua} {t('common.units.litersPerHectare')}
            </p>
            <p className="text-lg">{t('common.fields.cropCycle')}: {cultivo.ciclo} {t('common.units.days')}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => void navigate(`/resultados/${cultivo.idResultadoImpacto}`)}
          >
            {t('parcelas.viewImpacts')}
          </button>
        </div>
      </div>
    </div>
  );  
}
