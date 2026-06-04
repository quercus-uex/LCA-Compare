import type { ResultadoImpacto } from '../../hooks/resultado-impacto.hook.tsx';
import { useTranslation } from 'react-i18next';

export const ResultadoTable = ({ resultado }: { resultado: ResultadoImpacto }) => {
  const { t } = useTranslation();
  const impactos = resultado.datos.impacto_total.map(i => i.category);
  const pesticidas = resultado.datos.impacto_pesticidas;
  const fertilizantes = resultado.datos.impacto_fertilizantes;
  const sistemaRiego = resultado.datos.impacto_sistema_riego;
  const manejoCultivo = resultado.datos.impacto_manejo_cultivo;
  const total = resultado.datos.impacto_total;
  
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>{t('common.fields.category')}</th>
            <th>{t('common.fields.pesticides')}</th>
            <th>{t('common.fields.fertilizers')}</th>
            <th>{t('common.fields.irrigationSystem')}</th>
            <th>{t('common.fields.cropManagement')}</th>
            <th>{t('common.fields.total')}</th>
            <th>{t('common.fields.unit')}</th>
          </tr>
        </thead>
        <tbody>
          {impactos.map((impacto) => (
            <tr key={impacto}>
              <th>{impacto}</th>
              <th>
                {pesticidas
                  .find((i) => i.category === impacto)!
                  .amount.toFixed(5)}
              </th>
              <th>
                {fertilizantes
                  .find((i) => i.category === impacto)!
                  .amount.toFixed(5)}
              </th>
              <th>
                {sistemaRiego
                  .find((i) => i.category === impacto)!
                  .amount.toFixed(5)}
              </th>
              <th>
                {manejoCultivo
                  .find((i) => i.category === impacto)!
                  .amount.toFixed(5)}
              </th>
              <th>
                {total.find((i) => i.category === impacto)!.amount.toFixed(5)}
              </th>
              <th>
                {total.find((i) => i.category === impacto)!.unit}
              </th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
