import { DateTime } from 'luxon';
import { i18n, toSupportedLanguage } from '../i18n/index.ts';

const locale = () => toSupportedLanguage(i18n.language);

/** Cantidad con hasta `maxDigits` decimales y separadores del idioma activo */
export const formatQuantity = (value: number, maxDigits = 2) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: maxDigits }).format(value);

export const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat(locale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

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

/** Fecha de inicio de campaña (se guarda a medianoche UTC) en formato medio: «5 nov 2025» */
export const formatCampaignDate = (iso: string) =>
  DateTime.fromISO(iso, { zone: 'utc' }).setLocale(locale()).toLocaleString(DateTime.DATE_MED);

/** Mes y año de una campaña, para ejes de gráficas: «nov 2025» */
export const formatCampaignMonth = (iso: string) =>
  DateTime.fromISO(iso, { zone: 'utc' }).setLocale(locale()).toLocaleString({ month: 'short', year: 'numeric' });

/** Fecha guardada a medianoche UTC en formato numérico: «05/11/2025»; `null` si no es válida */
export const formatNumericDate = (iso: string) => {
  const date = DateTime.fromISO(iso, { zone: 'utc' });
  return date.isValid
    ? date.setLocale(locale()).toLocaleString({ day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;
};
