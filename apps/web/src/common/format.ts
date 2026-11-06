import { DateTime } from 'luxon';
import { i18n } from '../i18n/index.ts';

const locale = () => i18n.language ?? 'es';

/** Cantidad con hasta `maxDigits` decimales y separadores del idioma activo */
export const formatQuantity = (value: number, maxDigits = 2) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: maxDigits }).format(value);

/** Fecha de inicio de campaña (se guarda a medianoche UTC) en formato medio: «5 nov 2025» */
export const formatCampaignDate = (iso: string) =>
  DateTime.fromISO(iso, { zone: 'utc' }).setLocale(locale()).toLocaleString(DateTime.DATE_MED);

/** Mes y año de una campaña, para ejes de gráficas: «nov 2025» */
export const formatCampaignMonth = (iso: string) =>
  DateTime.fromISO(iso, { zone: 'utc' }).setLocale(locale()).toLocaleString({ month: 'short', year: 'numeric' });
