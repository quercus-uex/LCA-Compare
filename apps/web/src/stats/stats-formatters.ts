export const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatInteger = (value: number) =>
  new Intl.NumberFormat('es-ES').format(value);

export const formatImpactValue = (value: number, zeroLabel = '—') => {
  if (value === 0) return zeroLabel;
  if (Math.abs(value) < 0.001) return value.toExponential(2);
  if (Math.abs(value) < 10) return value.toFixed(4);
  return value.toFixed(2);
};

export const formatPercent = (value: number, digits = 1) =>
  `${value.toFixed(digits)}%`;
