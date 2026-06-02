export const API_BASE_URL = '/api';

export const EF_CATEGORIES = [
  {
    id: 'climate_change',
    spanishName: 'Cambio Climático',
    unit: 'kg CO2 eq',
    color: '#ef4444',
  },
  {
    id: 'acidification',
    spanishName: 'Acidificación',
    unit: 'mol H+ eq',
    color: '#eab308',
  },
  {
    id: 'eutrophication',
    spanishName: 'Eutrofización',
    unit: 'agregado',
    color: '#22c55e',
  },
  {
    id: 'water_use',
    spanishName: 'Uso de Agua',
    unit: 'm³ world Eq',
    color: '#3b82f6',
  },
  {
    id: 'land_use',
    spanishName: 'Uso del Suelo',
    unit: 'Pt',
    color: '#92400e',
  },
  {
    id: 'particulate_matter',
    spanishName: 'Partículas',
    unit: 'disease inc.',
    color: '#6b7280',
  },
  {
    id: 'ecotoxicity',
    spanishName: 'Ecotoxicidad',
    unit: 'CTUe',
    color: '#a855f7',
  },
  {
    id: 'human_toxicity',
    spanishName: 'Toxicidad Humana',
    unit: 'CTUh',
    color: '#f97316',
  },
] as const;

export type EfCategoryId = (typeof EF_CATEGORIES)[number]['id'];