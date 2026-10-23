import { i18n } from '../i18n/index.ts';

const locale = () => i18n.language ?? 'es';

export const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat(locale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatInteger = (value: number) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(value);

// Los impactos EF abarcan muchos órdenes de magnitud (de 1e-9 a 1e4), así que
// los valores muy pequeños se muestran en notación científica
export const formatImpactValue = (value: number, zeroLabel = '—') => {
  if (value === 0) return zeroLabel;
  const abs = Math.abs(value);
  if (abs < 0.001) {
    return new Intl.NumberFormat(locale(), {
      notation: 'scientific',
      maximumFractionDigits: 2,
    }).format(value);
  }
  const digits = abs < 10 ? 4 : 2;
  return new Intl.NumberFormat(locale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

// Para ejes: sin ceros de relleno, que alargan las marcas ("0,8000")
export const formatAxisValue = (value: number) => {
  if (value === 0) return '0';
  if (Math.abs(value) < 0.001) {
    return new Intl.NumberFormat(locale(), {
      notation: 'scientific',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat(locale(), { maximumSignificantDigits: 3 }).format(value);
};

export const formatPercent = (value: number, digits = 1) =>
  `${formatNumber(value, digits)} %`;

