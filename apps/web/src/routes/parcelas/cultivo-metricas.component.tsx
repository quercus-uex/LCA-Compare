import { useTranslation } from 'react-i18next';
import { formatQuantity } from '../../common/format.ts';
import type { Cultivo } from '../../hooks/parcela.hook.tsx';

const Metrica = ({ title, value, unit, desc }: { title: string; value: number; unit: string; desc?: string }) => (
  <div className="flex flex-col gap-0.5 bg-base-200 px-4 py-3">
    <div className="text-xs text-muted">{title}</div>
    <div className="text-2xl font-bold tabular-nums">
      {formatQuantity(value)} <span className="text-base font-normal">{unit}</span>
    </div>
    {desc && <div className="text-xs text-muted">{desc}</div>}
  </div>
);

/** Superficie, producción (con rendimiento), agua y ciclo de un cultivo */
export const CultivoMetricas = ({ cultivo }: { cultivo: Cultivo }) => {
  const { t } = useTranslation();
  const rendimiento = cultivo.superficieCultivada > 0 ? cultivo.produccion / cultivo.superficieCultivada : undefined;

  return (
    // gap-px sobre bg-base-300 dibuja los separadores entre métricas
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-box bg-base-300 xl:grid-cols-4">
      <Metrica title={t('common.fields.cultivatedArea')} value={cultivo.superficieCultivada} unit={t('common.units.hectares')} />
      <Metrica
        title={t('common.fields.production')}
        value={cultivo.produccion}
        unit={t('common.units.kilograms')}
        desc={rendimiento !== undefined
          ? `${t('parcelas.detail.yield')}: ${formatQuantity(rendimiento, 0)} ${t('common.units.kilogramsPerHectare')}`
          : undefined}
      />
      <Metrica title={t('common.fields.waterConsumption')} value={cultivo.consumoAgua} unit={t('common.units.cubicMeters')} />
      <Metrica title={t('common.fields.cropCycle')} value={cultivo.ciclo} unit={t('common.units.days')} />
    </div>
  );
};
