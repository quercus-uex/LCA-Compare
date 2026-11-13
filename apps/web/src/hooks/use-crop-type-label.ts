import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { GiCherry, GiGrainBundle, GiGrapes, GiOlive, GiPeach, GiSprout, GiTomato } from 'react-icons/gi';

// Valores de tipo de cultivo tal como se almacenan y viajan por la API; solo
// se traduce la etiqueta que se muestra. El color y el icono identifican el
// cultivo igual en todas las vistas (parcelas, mapa y estadísticas)
export const CROP_TYPE_OPTIONS = [
  { value: 'Tomate', labelKey: 'cropTypes.tomate', color: '#dc2626', icon: GiTomato },
  { value: 'Olivo', labelKey: 'cropTypes.olivo', color: '#65a30d', icon: GiOlive },
  { value: 'Ciruelo', labelKey: 'cropTypes.ciruelo', color: '#c026d3', icon: GiCherry },
  { value: 'Viñedo', labelKey: 'cropTypes.vinedo', color: '#7c3aed', icon: GiGrapes },
  { value: 'Arroz', labelKey: 'cropTypes.arroz', color: '#ca8a04', icon: GiGrainBundle },
  { value: 'Melocotonero', labelKey: 'cropTypes.melocotonero', color: '#ea580c', icon: GiPeach },
] as const;

const CROP_TYPE_BY_VALUE = new Map<string, (typeof CROP_TYPE_OPTIONS)[number]>(
  CROP_TYPE_OPTIONS.map((option) => [option.value, option]),
);

// Cultivos sin estilo propio: color estable derivado del nombre, distinto de los
// anteriores, para que no se confundan entre sí en gráficas y mapas
const FALLBACK_COLORS = ['#0891b2', '#1d4ed8', '#059669', '#475569', '#92400e'];

const fallbackColor = (tipo: string) => {
  let hash = 0;
  for (const char of tipo) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0]!;
};

export const getCropTypeStyle = (tipo: string): { color: string; icon: IconType } =>
  CROP_TYPE_BY_VALUE.get(tipo) ?? { color: fallbackColor(tipo), icon: GiSprout };

export const useCropTypeLabel = () => {
  const { t } = useTranslation();

  return (tipo: string): string => {
    const option = CROP_TYPE_BY_VALUE.get(tipo);
    return option ? t(option.labelKey) : tipo;
  };
};
