import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IMPACT_LABEL_KEYS, IMPACT_STAGE_KEYS, type ImpactKey } from '../../common/constants.ts';
import { ResultComparisonTable } from '../../components/result-comparison-table.component.tsx';
import { Card, TabPanel, Tabs } from '../../components/ui/index.ts';
import type { CompareResult } from '../../hooks/compare.hook.tsx';

export const CompareResultCard = ({ result }: { result?: CompareResult }) => {
  const { t } = useTranslation();
  const [impact, setImpact] = useState<ImpactKey>('impacto_total');
  const tabsId = useId();

  if (!result) return (
    <Card>
      <p>{t('compare.result.empty')}</p>
    </Card>
  );

  const tabs = (['impacto_total', ...IMPACT_STAGE_KEYS] as const).map((key) => ({ id: key, label: t(IMPACT_LABEL_KEYS[key]) }));

  return (
    <Card>
      <h2 className="text-xl font-semibold">{t('compare.result.title')}</h2>
      <Tabs id={tabsId} label={t('compare.result.title')} items={tabs} value={impact} onChange={setImpact} />
      <TabPanel tabsId={tabsId} value={impact}>
        <ResultComparisonTable
          result={result}
          selectedImpact={impact}
        />
      </TabPanel>
    </Card>
  );
}
