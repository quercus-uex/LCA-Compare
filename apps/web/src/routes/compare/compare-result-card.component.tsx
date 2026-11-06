import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IMPACT_LABEL_KEYS, IMPACT_STAGE_KEYS, type ImpactKey } from '../../common/constants.ts';
import { ResultComparisonTable } from '../../components/result-comparison-table.component.tsx';
import type { CompareResult } from '../../hooks/compare.hook.tsx';

export const CompareResultCard = ({ result }: { result?: CompareResult }) => {
  const { t } = useTranslation();
  const [impact, setImpact] = useState<ImpactKey>('impacto_total');

  if (!result) return (
    <div className="card bg-base-100">
      <div className="card-body">
        <p>{t('compare.result.empty')}</p>
      </div>
    </div>
  );

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <div className="flex w-full justify-between">
          <h2 className="card-title text-xl">{t('compare.result.title')}</h2>
        </div>
        <div className="tabs tabs-box w-fit">
          {(['impacto_total', ...IMPACT_STAGE_KEYS] as const).map((key) => (
            <input
              key={key}
              type="radio"
              name="impact"
              className="tab"
              aria-label={t(IMPACT_LABEL_KEYS[key])}
              checked={impact === key}
              onChange={() => setImpact(key)}
            />
          ))}
        </div>
        <ResultComparisonTable
          result={result}
          selectedImpact={impact}
        />
      </div>
    </div>
  );
}
