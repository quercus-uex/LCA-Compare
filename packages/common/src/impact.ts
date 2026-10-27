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
    englishNames: ['Eutrophication: freshwater', 'Eutrophication, freshwater'],
    spanishName: 'Eutrofizaci\u00f3n (agua dulce)',
    unit: 'kg P eq',
    color: '#22c55e',
  },
  {
    id: 'eutrophication_marine',
    englishNames: ['Eutrophication: marine', 'Eutrophication, marine'],
    spanishName: 'Eutrofizaci\u00f3n (marina)',
    unit: 'kg N eq',
    color: '#14b8a6',
  },
  {
    id: 'eutrophication_terrestrial',
    englishNames: [
      'Eutrophication: terrestrial',
      'Eutrophication, terrestrial',
    ],
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
    englishNames: ['Particulate matter formation', 'Particulate matter'],
    spanishName: 'Part\u00edculas',
    unit: 'disease inc.',
    color: '#6b7280',
  },
  {
    id: 'ecotoxicity',
    englishNames: ['Ecotoxicity: freshwater', 'Ecotoxicity, freshwater'],
    spanishName: 'Ecotoxicidad',
    unit: 'CTUe',
    color: '#a855f7',
  },
  // Cancerígena y no cancerígena se presentan por separado, como en EF 3.1
  {
    id: 'human_toxicity_cancer',
    englishNames: ['Human toxicity: carcinogenic', 'Human toxicity, cancer'],
    spanishName: 'Toxicidad humana (cancerígena)',
    unit: 'CTUh',
    color: '#f97316',
  },
  {
    id: 'human_toxicity_non_cancer',
    englishNames: [
      'Human toxicity: non-carcinogenic',
      'Human toxicity, non-cancer',
    ],
    spanishName: 'Toxicidad humana (no cancerígena)',
    unit: 'CTUh',
    color: '#ec4899',
  },
] as const;

export type EfCategoryId = (typeof EF_CATEGORIES)[number]['id'];

/**
 * Normaliza un nombre de categoría para compararlo: openLCA lo escribe de
 * formas distintas según la base de datos ("Eutrophication: freshwater",
 * "Eutrophication, freshwater", "Eutrophication freshwater"). Los
 * subindicadores ("Human toxicity, cancer (organics)") no coinciden con su
 * categoría, así que no se cuentan dos veces.
 */
export const normalizeEfName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const EF_NAME_LOOKUP = new Map<string, EfCategoryId>(
  EF_CATEGORIES.flatMap((c) =>
    [...c.englishNames, c.spanishName].map(
      (name) => [normalizeEfName(name), c.id] as const,
    ),
  ),
);

// Resuelve el nombre de una categoría tal como llega de openLCA (o su nombre
// en español heredado) a su categoría EF; undefined si no se conoce
export const getEfCategoryId = (name: string): EfCategoryId | undefined =>
  EF_NAME_LOOKUP.get(normalizeEfName(name));

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
