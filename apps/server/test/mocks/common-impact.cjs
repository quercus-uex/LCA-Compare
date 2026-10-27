const EF_CATEGORIES = [
  {
    id: 'climate_change',
    englishNames: ['Climate change'],
    spanishName: 'Cambio Climatico',
    unit: 'kg CO2 eq',
    color: '#ef4444',
  },
  {
    id: 'acidification',
    englishNames: ['Acidification'],
    spanishName: 'Acidificacion',
    unit: 'mol H+ eq',
    color: '#eab308',
  },
  {
    id: 'eutrophication_freshwater',
    englishNames: ['Eutrophication: freshwater', 'Eutrophication, freshwater'],
    spanishName: 'Eutrofizacion (agua dulce)',
    unit: 'kg P eq',
    color: '#22c55e',
  },
  {
    id: 'eutrophication_marine',
    englishNames: ['Eutrophication: marine', 'Eutrophication, marine'],
    spanishName: 'Eutrofizacion (marina)',
    unit: 'kg N eq',
    color: '#14b8a6',
  },
  {
    id: 'eutrophication_terrestrial',
    englishNames: [
      'Eutrophication: terrestrial',
      'Eutrophication, terrestrial',
    ],
    spanishName: 'Eutrofizacion (terrestre)',
    unit: 'mol N eq',
    color: '#84cc16',
  },
  {
    id: 'water_use',
    englishNames: ['Water use'],
    spanishName: 'Uso de Agua',
    unit: 'm3 world Eq',
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
    spanishName: 'Particulas',
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
  {
    id: 'human_toxicity_cancer',
    englishNames: ['Human toxicity: carcinogenic', 'Human toxicity, cancer'],
    spanishName: 'Toxicidad humana (cancerigena)',
    unit: 'CTUh',
    color: '#f97316',
  },
  {
    id: 'human_toxicity_non_cancer',
    englishNames: [
      'Human toxicity: non-carcinogenic',
      'Human toxicity, non-cancer',
    ],
    spanishName: 'Toxicidad humana (no cancerigena)',
    unit: 'CTUh',
    color: '#ec4899',
  },
];

const IMPACT_KEYS = [
  'impacto_fertilizantes',
  'impacto_manejo_cultivo',
  'impacto_pesticidas',
  'impacto_sistema_riego',
  'impacto_total',
];

const DEFAULT_EF_CATEGORY = 'climate_change';

const normalizeEfName = (name) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const EF_NAME_LOOKUP = new Map(
  EF_CATEGORIES.flatMap((c) =>
    [...c.englishNames, c.spanishName].map((name) => [
      normalizeEfName(name),
      c.id,
    ]),
  ),
);

const getEfCategoryId = (name) => EF_NAME_LOOKUP.get(normalizeEfName(name));

const getEfCategory = (id) => EF_CATEGORIES.find((c) => c.id === id);

module.exports = {
  EF_CATEGORIES,
  IMPACT_KEYS,
  DEFAULT_EF_CATEGORY,
  normalizeEfName,
  getEfCategoryId,
  getEfCategory,
};
