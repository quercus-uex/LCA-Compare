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
    id: 'eutrophication',
    englishNames: [
      'Eutrophication: freshwater',
      'Eutrophication: marine',
      'Eutrophication: terrestrial',
    ],
    spanishName: 'Eutrofizacion',
    unit: 'agregado',
    color: '#22c55e',
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

module.exports = { EF_CATEGORIES, IMPACT_KEYS };
