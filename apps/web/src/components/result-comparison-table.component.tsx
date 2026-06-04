import type { CompareResult } from '../hooks/compare.hook.tsx';
import { useTranslation } from 'react-i18next';

export const ResultComparisonTable = ({
  result,
  selectedImpact,
}: {
  result: CompareResult;
  selectedImpact:
    | 'impacto_total'
    | 'impacto_pesticidas'
    | 'impacto_sistema_riego'
    | 'impacto_fertilizantes'
    | 'impacto_manejo_cultivo';
}) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="table table-md">
        <thead>
          <tr>
            <th>{t('common.fields.category')}</th>
            <th>{t('common.fields.referenceAmount')}</th>
            {result.impacto_total[0].tarAmount != null && (
              <th>{t('common.fields.targetAmount')}</th>
            )}
            <th>{t('common.fields.unit')}</th>
            {result.impacto_total[0].tarAmount != null && result.impacto_total[0].diff != null && <th>{t('common.fields.difference')}</th>}
          </tr>
        </thead>
        <tbody>
          {result[selectedImpact].map((i, index) => (
            <tr key={index}>
              <th>{i.category}</th>
              <th>{i.refAmount.toFixed(4)}</th>
              {i.tarAmount != null && <th>{i.tarAmount.toFixed(4)}</th>}
              <th>{i.unit}</th>
              {i.tarAmount != null && i.diff != null && (
                <th
                  className={`${i.diff >= 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {i.diff.toFixed(2)} %
                </th>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
