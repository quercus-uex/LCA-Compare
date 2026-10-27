import { exportCSV, translateEfCategory } from '../../common/utils.ts';
import type { ResultadoImpacto } from '../../hooks/resultado-impacto.hook.tsx';

type Translator = (key: string) => string;

export const buildResultadoCSV = (
  resultado: ResultadoImpacto,
  parcelaNombre: string,
  t: Translator,
): void => {
  // Sin redondear, para no exportar como 0 los indicadores pequeños
  const find = (
    arr: typeof resultado.datos.impacto_pesticidas,
    category: string,
  ) => arr.find((i) => i.category === category)?.amount ?? '';
  const rows = resultado.datos.impacto_total.map(({ category, amount, unit }) => [
    translateEfCategory(category),
    find(resultado.datos.impacto_pesticidas, category),
    find(resultado.datos.impacto_fertilizantes, category),
    find(resultado.datos.impacto_sistema_riego, category),
    find(resultado.datos.impacto_manejo_cultivo, category),
    amount,
    unit,
  ]);
  exportCSV(`impacto-${parcelaNombre}.csv`, [
    [
      t('common.fields.category'),
      t('common.fields.pesticides'),
      t('common.fields.fertilizers'),
      t('common.fields.irrigationSystem'),
      t('common.fields.cropManagement'),
      t('common.fields.total'),
      t('common.fields.unit'),
    ],
    ...rows,
  ]);
};