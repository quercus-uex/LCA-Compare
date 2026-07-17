import { useTranslation } from 'react-i18next';
import type { ImpactKey } from '../common/constants.ts';
import type { CompareResult } from '../hooks/compare.hook.tsx';

export const ResultComparisonTable = ({
  result,
  selectedImpact,
}: {
  result: CompareResult;
  selectedImpact: ImpactKey;
}) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="table table-md">
        <thead>
          <tr>
            <th>{t('common.fields.category')}</th>
            <th>{t('common.fields.referenceAmount')}</th>
            {result.impacto_total[0]?.tarAmount != null && (
              <th>{t('common.fields.targetAmount')}</th>
            )}
            <th>{t('common.fields.unit')}</th>
            {result.impacto_total[0]?.tarAmount != null && <th>{t('common.fields.difference')}</th>}
          </tr>
        </thead>
        <tbody>
          {result[selectedImpact].map((i, index) => (
            <tr key={index}>
              <th>{i.category}</th>
              <th>{i.refAmount.toFixed(4)}</th>
              {i.tarAmount != null && <th>{i.tarAmount.toFixed(4)}</th>}
              <th>{i.unit}</th>
              {i.tarAmount != null && (
                <th
                  className={
                    i.diff != null
                      ? i.diff >= 0
                        ? 'text-red-400'
                        : 'text-green-400'
                      : ''
                  }
                >
                  {i.diff != null ? `${i.diff.toFixed(2)} %` : 'n/a'}
                </th>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
