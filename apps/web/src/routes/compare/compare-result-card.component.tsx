import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImpactKey } from '../../common/constants.ts';
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
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label={t('compare.result.tabs.total')}
            defaultChecked
            onClick={() => setImpact('impacto_total')}
          />
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label={t('compare.result.tabs.pesticides')}
            onClick={() => setImpact('impacto_pesticidas')}
          />
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label={t('compare.result.tabs.fertilizers')}
            onClick={() => setImpact('impacto_fertilizantes')}
          />
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label={t('compare.result.tabs.irrigationSystem')}
            onClick={() => setImpact('impacto_sistema_riego')}
          />
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label={t('compare.result.tabs.cropManagement')}
            onClick={() => setImpact('impacto_manejo_cultivo')}
          />
        </div>
        <ResultComparisonTable
          result={result}
          selectedImpact={impact}
        />
      </div>
    </div>
  );
}
