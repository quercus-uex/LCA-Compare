export const EF_CATEGORIES = [
  {
    id: 'climate_change',
    englishNames: ['Climate change'],
    spanishName: 'Cambio Clim\u00e1tico',
    unit: 'kg CO2 eq',
    color: '#ef4444',
  },
  {
    id: 'acidification',
    englishNames: ['Acidification'],
    spanishName: 'Acidificaci\u00f3n',
    unit: 'mol H+ eq',
    color: '#eab308',
  },
  // Los tres indicadores de eutrofizaci\u00f3n tienen unidades distintas, por lo
  // que se tratan como categor\u00edas separadas y nunca se suman entre s\u00ed
  {
    id: 'eutrophication_freshwater',
    englishNames: ['Eutrophication: freshwater'],
    spanishName: 'Eutrofizaci\u00f3n (agua dulce)',
    unit: 'kg P eq',
    color: '#22c55e',
  },
  {
    id: 'eutrophication_marine',
    englishNames: ['Eutrophication: marine'],
    spanishName: 'Eutrofizaci\u00f3n (marina)',
    unit: 'kg N eq',
    color: '#14b8a6',
  },
  {
    id: 'eutrophication_terrestrial',
    englishNames: ['Eutrophication: terrestrial'],
    spanishName: 'Eutrofizaci\u00f3n (terrestre)',
    unit: 'mol N eq',
    color: '#84cc16',
  },
  {
    id: 'water_use',
    englishNames: ['Water use'],
    spanishName: 'Uso de Agua',
    unit: 'm\u00b3 world Eq',
    color: '#3b82f6',
  },
  {
    id: 'land_use',
    englishNames: ['Land use'],
    spanishName: 'Uso del Suelo',
    unit: 'Pt',
    color: '#92400e',
  },
  {
    id: 'particulate_matter',
    englishNames: ['Particulate matter formation'],
    spanishName: 'Part\u00edculas',
    unit: 'disease inc.',
    color: '#6b7280',
  },
  {
    id: 'ecotoxicity',
    englishNames: ['Ecotoxicity: freshwater'],
    spanishName: 'Ecotoxicidad',
    unit: 'CTUe',
    color: '#a855f7',
  },
  {
    id: 'human_toxicity',
    englishNames: [
      'Human toxicity: carcinogenic',
      'Human toxicity: non-carcinogenic',
    ],
    spanishName: 'Toxicidad Humana',
    unit: 'CTUh',
    color: '#f97316',
  },
] as const;

export type EfCategoryId = (typeof EF_CATEGORIES)[number]['id'];

// Indicadores que comparten categor\u00eda EF agregada pero se muestran como filas
// propias en las tablas de resultados, cada uno con su etiqueta
export const EF_INDICATORS = [
  { id: 'human_toxicity_cancer', englishName: 'Human toxicity: carcinogenic' },
  {
    id: 'human_toxicity_non_cancer',
    englishName: 'Human toxicity: non-carcinogenic',
  },
] as const;

export type EfIndicatorId = (typeof EF_INDICATORS)[number]['id'];

// Identificador de la etiqueta traducible de una fila de resultados
export type EfLabelId = EfCategoryId | EfIndicatorId;

// Resuelve el nombre de una categor\u00eda tal como llega de openLCA (o su nombre
// en espa\u00f1ol heredado) a su etiqueta traducible; undefined si no se conoce
export const getEfLabelId = (name: string): EfLabelId | undefined =>
  EF_INDICATORS.find((i) => i.englishName === name)?.id ??
  EF_CATEGORIES.find(
    (c) =>
      c.spanishName === name ||
      (c.englishNames as readonly string[]).includes(name),
  )?.id;

// Categoría usada por defecto en rankings y evolución temporal. Las categorías
// tienen unidades distintas, así que nunca se suman en un impacto "total"
export const DEFAULT_EF_CATEGORY: EfCategoryId = 'climate_change';

export const IMPACT_KEYS = [
  'impacto_fertilizantes',
  'impacto_manejo_cultivo',
  'impacto_pesticidas',
  'impacto_sistema_riego',
  'impacto_total',
] as const;

export type ImpactKey = (typeof IMPACT_KEYS)[number];

export const getEfCategory = (id: EfCategoryId) =>
  EF_CATEGORIES.find((c) => c.id === id);
