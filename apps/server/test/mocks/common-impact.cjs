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
    englishNames: ['Eutrophication: freshwater'],
    spanishName: 'Eutrofizacion (agua dulce)',
    unit: 'kg P eq',
    color: '#22c55e',
  },
  {
    id: 'eutrophication_marine',
    englishNames: ['Eutrophication: marine'],
    spanishName: 'Eutrofizacion (marina)',
    unit: 'kg N eq',
    color: '#14b8a6',
  },
  {
    id: 'eutrophication_terrestrial',
    englishNames: ['Eutrophication: terrestrial'],
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
    englishNames: ['Particulate matter formation'],
    spanishName: 'Particulas',
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
];

const IMPACT_KEYS = [
  'impacto_fertilizantes',
  'impacto_manejo_cultivo',
  'impacto_pesticidas',
  'impacto_sistema_riego',
  'impacto_total',
];

const DEFAULT_EF_CATEGORY = 'climate_change';

const EF_INDICATORS = [
  { id: 'human_toxicity_cancer', englishName: 'Human toxicity: carcinogenic' },
  {
    id: 'human_toxicity_non_cancer',
    englishName: 'Human toxicity: non-carcinogenic',
  },
];

const getEfLabelId = (name) =>
  EF_INDICATORS.find((i) => i.englishName === name)?.id ??
  EF_CATEGORIES.find(
    (c) => c.spanishName === name || c.englishNames.includes(name),
  )?.id;

module.exports = {
  EF_CATEGORIES,
  EF_INDICATORS,
  IMPACT_KEYS,
  DEFAULT_EF_CATEGORY,
  getEfLabelId,
};
