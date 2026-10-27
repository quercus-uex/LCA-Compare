import { useTranslation } from 'react-i18next';
import type { ImpactKey } from '../common/constants.ts';
import { hasTargetSet, translateEfCategory } from '../common/utils.ts';
import type { CompareResult } from '../hooks/compare.hook.tsx';
import { formatImpactValue } from '../stats/stats-formatters.ts';

export const ResultComparisonTable = ({
  result,
  selectedImpact,
}: {
  result: CompareResult;
  selectedImpact: ImpactKey;
}) => {
  const { t } = useTranslation();
  const hasTarget = hasTargetSet(result);

  return (
    <div className="overflow-x-auto">
      <table className="table table-md">
        <thead>
          <tr>
            <th>{t('common.fields.category')}</th>
            <th>{t('common.fields.referenceAmount')}</th>
            {hasTarget && <th>{t('common.fields.targetAmount')}</th>}
            <th>{t('common.fields.unit')}</th>
            {hasTarget && <th>{t('common.fields.difference')}</th>}
          </tr>
        </thead>
        <tbody>
          {result[selectedImpact].map((i, index) => (
            <tr key={index}>
              <th>{translateEfCategory(i.category)}</th>
              <th>{formatImpactValue(i.refAmount, '0')}</th>
              {hasTarget && (
                <th>{i.tarAmount != null ? formatImpactValue(i.tarAmount, '0') : '—'}</th>
              )}
              <th>{i.unit}</th>
              {hasTarget && (
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
      <p className="text-xs text-base-content/60 mt-2">{t('compare.result.meanNote')}</p>
      {hasTarget && (
        <p className="text-xs text-base-content/60 mt-1">{t('compare.result.differenceNote')}</p>
      )}
    </div>
  );
};
