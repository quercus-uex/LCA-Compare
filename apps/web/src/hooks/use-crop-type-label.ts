import { useTranslation } from 'react-i18next';

// Valores de tipo de cultivo tal como se almacenan y viajan por la API; solo
// se traduce la etiqueta que se muestra
export const CROP_TYPE_OPTIONS = [
  { value: 'Tomate', labelKey: 'cropTypes.tomate' },
  { value: 'Olivo', labelKey: 'cropTypes.olivo' },
  { value: 'Ciruelo', labelKey: 'cropTypes.ciruelo' },
  { value: 'Viñedo', labelKey: 'cropTypes.vinedo' },
  { value: 'Arroz', labelKey: 'cropTypes.arroz' },
  { value: 'Melocotonero', labelKey: 'cropTypes.melocotonero' },
] as const;

const CROP_TYPE_LABEL_KEYS = new Map<string, string>(
  CROP_TYPE_OPTIONS.map(({ value, labelKey }) => [value, labelKey]),
);

export const useCropTypeLabel = () => {
  const { t } = useTranslation();

  return (tipo: string): string => {
    const labelKey = CROP_TYPE_LABEL_KEYS.get(tipo);
    return labelKey ? t(labelKey) : tipo;
  };
};
