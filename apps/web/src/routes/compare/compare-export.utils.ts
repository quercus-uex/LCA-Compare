import type { CompareResult } from '../../hooks/compare.hook.tsx';

export type CompareExportMode = 'full' | 'reference' | 'target';

type Translator = (key: string) => string;

const IMPACTS: ReadonlyArray<{ key: keyof CompareResult; labelKey: string }> = [
  { key: 'impacto_total', labelKey: 'common.fields.total' },
  { key: 'impacto_pesticidas', labelKey: 'common.fields.pesticides' },
  { key: 'impacto_sistema_riego', labelKey: 'common.fields.irrigationSystem' },
  { key: 'impacto_fertilizantes', labelKey: 'common.fields.fertilizers' },
  { key: 'impacto_manejo_cultivo', labelKey: 'common.fields.cropManagement' },
];

const num = (n: number | null | undefined) => (n == null ? '' : n.toFixed(4));

export const buildCompareCSV = (
  result: CompareResult,
  mode: CompareExportMode,
  t: Translator,
): (string | number)[][] => {
  const header: (string | number)[] =
    mode === 'full'
      ? [
          t('common.fields.impactArea'),
          t('common.fields.category'),
          t('common.fields.referenceAmount'),
          t('common.fields.targetAmount'),
          t('common.fields.unit'),
          t('common.fields.difference'),
        ]
      : [
          t('common.fields.impactArea'),
          t('common.fields.category'),
          t(mode === 'target' ? 'common.fields.targetAmount' : 'common.fields.referenceAmount'),
          t('common.fields.unit'),
        ];

  const rows: (string | number)[][] = [];
  for (const { key, labelKey } of IMPACTS) {
    const label = t(labelKey);
    for (const item of result[key]) {
      if (mode === 'full') {
        rows.push([
          label,
          item.category,
          num(item.refAmount),
          num(item.tarAmount ?? null),
          item.unit,
          item.diff == null ? '' : item.diff.toFixed(2),
        ]);
      } else {
        const amount = mode === 'target' ? item.tarAmount : item.refAmount;
        rows.push([label, item.category, num(amount ?? null), item.unit]);
      }
    }
  }
  return [header, ...rows];
};
