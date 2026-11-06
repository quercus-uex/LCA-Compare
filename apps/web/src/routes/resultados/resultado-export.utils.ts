import { IMPACT_LABEL_KEYS, IMPACT_STAGE_KEYS } from '../../common/constants.ts';
import { exportCSV, translateEfCategory } from '../../common/utils.ts';
import type { ResultadoImpacto } from '../../hooks/resultado-impacto.hook.tsx';

type Translator = (key: string) => string;

export const buildResultadoCSV = (
  resultado: ResultadoImpacto,
  parcelaNombre: string,
  t: Translator,
): void => {
  const { datos } = resultado;
  // Sin redondear, para no exportar como 0 los indicadores pequeños
  const rows = datos.impacto_total.map(({ category, amount, unit }) => [
    translateEfCategory(category),
    ...IMPACT_STAGE_KEYS.map((key) => datos[key].find((i) => i.category === category)?.amount ?? ''),
    amount,
    unit,
  ]);
  exportCSV(`impacto-${parcelaNombre}.csv`, [
    [
      t('common.fields.category'),
      ...IMPACT_STAGE_KEYS.map((key) => t(IMPACT_LABEL_KEYS[key])),
      t(IMPACT_LABEL_KEYS.impacto_total),
      t('common.fields.unit'),
    ],
    ...rows,
  ]);
};
