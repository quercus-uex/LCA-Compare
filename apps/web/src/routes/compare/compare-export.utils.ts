import { IMPACT_KEYS, type ImpactKey } from '../../common/constants.ts';
import type { CompareResult } from '../../hooks/compare.hook.tsx';

export type CompareExportMode = 'full' | 'reference' | 'target';

type Translator = (key: string) => string;

const IMPACT_LABEL_KEYS: Readonly<Record<ImpactKey, string>> = {
  impacto_total: 'common.fields.total',
  impacto_pesticidas: 'common.fields.pesticides',
  impacto_sistema_riego: 'common.fields.irrigationSystem',
  impacto_fertilizantes: 'common.fields.fertilizers',
  impacto_manejo_cultivo: 'common.fields.cropManagement',
};

const num = (n: number | null | undefined) => (n == null ? '' : n.toFixed(4));

type ExportItem = { unit: string; category: string; amount: number | undefined };
type ExportPayload = Record<ImpactKey, ExportItem[]>;

export const buildCompareExportPayload = (
  result: CompareResult,
  mode: CompareExportMode,
): CompareResult | ExportPayload => {
  if (mode === 'full') return result;
  const pickAmount = (i: { refAmount: number; tarAmount?: number }): number | undefined =>
    mode === 'target' ? i.tarAmount : i.refAmount;
  const payload = {} as ExportPayload;
  for (const key of IMPACT_KEYS) {
    payload[key] = result[key].map((i) => ({
      unit: i.unit,
      category: i.category,
      amount: pickAmount(i),
    }));
  }
  return payload;
};

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
  for (const key of IMPACT_KEYS) {
    const label = t(IMPACT_LABEL_KEYS[key]);
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
