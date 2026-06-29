import type { CompareReportLanguage } from 'common/compare';
import type { EfCategoryId } from 'common/impact';
import { EF_CATEGORIES } from 'common/impact';

export const COMPARE_REPORT_DEFAULT_LANGUAGE: CompareReportLanguage = 'es';

export const COMPARE_REPORT_LANGUAGES: readonly CompareReportLanguage[] = [
  'es',
  'en',
  'pt',
];

export const isCompareReportLanguage = (
  value: unknown,
): value is CompareReportLanguage =>
  typeof value === 'string' &&
  (COMPARE_REPORT_LANGUAGES as readonly string[]).includes(value);

type ReportLabels = {
  readonly htmlLang: string;
  readonly dateLocale: string;
  readonly documentTitle: string;
  readonly reportTitle: string;
  readonly comparisonDate: string;
  readonly selectedFilters: string;
  readonly referenceSet: string;
  readonly targetSet: string;
  readonly results: string;
  readonly countries: string;
  readonly provinces: string;
  readonly towns: string;
  readonly location: string;
  readonly range: string;
  readonly cropType: string;
  readonly campaignDate: string;
  readonly from: string;
  readonly to: string;
  readonly unchosenFilters: string;
  readonly keyResults: string;
  readonly summary: string;
  readonly recommendations: string;
  readonly aiDisclaimer: string;
  readonly impactTotal: string;
  readonly impactPesticides: string;
  readonly impactFertilizers: string;
  readonly impactIrrigationSystem: string;
  readonly impactCropManagement: string;
  readonly category: string;
  readonly referenceAmount: string;
  readonly targetAmount: string;
  readonly unit: string;
  readonly difference: string;
  readonly notAvailable: string;
};

const LABELS_BY_LANGUAGE: Record<CompareReportLanguage, ReportLabels> = {
  es: {
    htmlLang: 'es',
    dateLocale: 'es-ES',
    documentTitle: 'Informe de comparativa',
    reportTitle: 'Informe de comparativa de ACV',
    comparisonDate: 'Fecha de comparativa',
    selectedFilters: 'FILTROS SELECCIONADOS',
    referenceSet: 'Conjunto de referencia',
    targetSet: 'Conjunto objetivo',
    results: 'resultados',
    countries: 'Países',
    provinces: 'Provincias',
    towns: 'Poblaciones',
    location: 'Ubicación',
    range: 'Rango',
    cropType: 'Tipo de cultivo',
    campaignDate: 'Fecha de campaña',
    from: 'Desde',
    to: 'Hasta',
    unchosenFilters: 'Filtros no escogidos por el usuario',
    keyResults: 'RESULTADOS CLAVE',
    summary: 'RESUMEN',
    recommendations: 'RECOMENDACIONES',
    aiDisclaimer: '* Contenido generado por IA. Puede ser inexacto.',
    impactTotal: 'IMPACTO TOTAL',
    impactPesticides: 'IMPACTO DE PESTICIDAS',
    impactFertilizers: 'IMPACTO DE FERTILIZANTES',
    impactIrrigationSystem: 'IMPACTO DEL SISTEMA DE RIEGO',
    impactCropManagement: 'IMPACTO DEL MANEJO DEL CULTIVO',
    category: 'Categoría',
    referenceAmount: 'Cantidad referencia',
    targetAmount: 'Cantidad objetivo',
    unit: 'Unidad',
    difference: 'Diferencia',
    notAvailable: 'n/a',
  },
  en: {
    htmlLang: 'en',
    dateLocale: 'en-GB',
    documentTitle: 'Comparison report',
    reportTitle: 'LCA comparison report',
    comparisonDate: 'Comparison date',
    selectedFilters: 'SELECTED FILTERS',
    referenceSet: 'Reference set',
    targetSet: 'Target set',
    results: 'results',
    countries: 'Countries',
    provinces: 'Provinces',
    towns: 'Towns',
    location: 'Location',
    range: 'Range',
    cropType: 'Crop type',
    campaignDate: 'Campaign date',
    from: 'From',
    to: 'To',
    unchosenFilters: 'Filters not chosen by the user',
    keyResults: 'KEY RESULTS',
    summary: 'SUMMARY',
    recommendations: 'RECOMMENDATIONS',
    aiDisclaimer: '* AI-generated content. May be inaccurate.',
    impactTotal: 'TOTAL IMPACT',
    impactPesticides: 'PESTICIDE IMPACT',
    impactFertilizers: 'FERTILIZER IMPACT',
    impactIrrigationSystem: 'IRRIGATION SYSTEM IMPACT',
    impactCropManagement: 'CROP MANAGEMENT IMPACT',
    category: 'Category',
    referenceAmount: 'Reference amount',
    targetAmount: 'Target amount',
    unit: 'Unit',
    difference: 'Difference',
    notAvailable: 'n/a',
  },
  pt: {
    htmlLang: 'pt',
    dateLocale: 'pt-PT',
    documentTitle: 'Relatório de comparativa',
    reportTitle: 'Relatório de comparativa de ACV',
    comparisonDate: 'Data de comparação',
    selectedFilters: 'FILTROS SELECIONADOS',
    referenceSet: 'Conjunto de referência',
    targetSet: 'Conjunto alvo',
    results: 'resultados',
    countries: 'Países',
    provinces: 'Províncias',
    towns: 'Localidades',
    location: 'Localização',
    range: 'Raio',
    cropType: 'Tipo de cultura',
    campaignDate: 'Data da campanha',
    from: 'Desde',
    to: 'Até',
    unchosenFilters: 'Filtros não escolhidos pelo utilizador',
    keyResults: 'RESULTADOS-CHAVE',
    summary: 'RESUMO',
    recommendations: 'RECOMENDAÇÕES',
    aiDisclaimer: '* Conteúdo gerado por IA. Pode ser impreciso.',
    impactTotal: 'IMPACTO TOTAL',
    impactPesticides: 'IMPACTO DE PESTICIDAS',
    impactFertilizers: 'IMPACTO DE FERTILIZANTES',
    impactIrrigationSystem: 'IMPACTO DO SISTEMA DE REGA',
    impactCropManagement: 'IMPACTO DO MANEJO DA CULTURA',
    category: 'Categoria',
    referenceAmount: 'Quantidade de referência',
    targetAmount: 'Quantidade alvo',
    unit: 'Unidade',
    difference: 'Diferença',
    notAvailable: 'n/a',
  },
};

export const getReportLabels = (
  language?: CompareReportLanguage,
): ReportLabels =>
  LABELS_BY_LANGUAGE[
    language && isCompareReportLanguage(language)
      ? language
      : COMPARE_REPORT_DEFAULT_LANGUAGE
  ];

const CROP_TYPE_LABELS_BY_LANGUAGE: Record<
  CompareReportLanguage,
  Record<string, string>
> = {
  es: {
    Tomate: 'Tomate',
    Olivo: 'Olivo',
    Ciruelo: 'Ciruelo',
    Viñedo: 'Viñedo',
    Arroz: 'Arroz',
    Melocotonero: 'Melocotonero',
  },
  en: {
    Tomate: 'Tomato',
    Olivo: 'Olive',
    Ciruelo: 'Plum',
    Viñedo: 'Vineyard',
    Arroz: 'Rice',
    Melocotonero: 'Peach',
  },
  pt: {
    Tomate: 'Tomate',
    Olivo: 'Oliveira',
    Ciruelo: 'Ameixeira',
    Viñedo: 'Vinha',
    Arroz: 'Arroz',
    Melocotonero: 'Pessegueiro',
  },
};

export const translateCropType = (
  tipoCultivo: string | undefined,
  language: CompareReportLanguage,
): string | undefined => {
  if (!tipoCultivo) return tipoCultivo;
  return CROP_TYPE_LABELS_BY_LANGUAGE[language]?.[tipoCultivo] ?? tipoCultivo;
};

const EF_CATEGORY_LABELS_BY_LANGUAGE: Record<
  CompareReportLanguage,
  Record<EfCategoryId, string>
> = {
  es: {
    climate_change: 'Cambio Climático',
    acidification: 'Acidificación',
    eutrophication: 'Eutrofización',
    water_use: 'Uso de Agua',
    land_use: 'Uso del Suelo',
    particulate_matter: 'Partículas',
    ecotoxicity: 'Ecotoxicidad',
    human_toxicity: 'Toxicidad Humana',
  },
  en: {
    climate_change: 'Climate change',
    acidification: 'Acidification',
    eutrophication: 'Eutrophication',
    water_use: 'Water use',
    land_use: 'Land use',
    particulate_matter: 'Particulate matter',
    ecotoxicity: 'Ecotoxicity',
    human_toxicity: 'Human toxicity',
  },
  pt: {
    climate_change: 'Alterações climáticas',
    acidification: 'Acidificação',
    eutrophication: 'Eutrofização',
    water_use: 'Uso de Água',
    land_use: 'Uso do Solo',
    particulate_matter: 'Partículas',
    ecotoxicity: 'Ecotoxicidade',
    human_toxicity: 'Toxicidade Humana',
  },
};

const buildCategoryAliasMap = (
  language: CompareReportLanguage,
): Map<string, string> => {
  const map = new Map<string, string>();
  for (const [id, label] of Object.entries(
    EF_CATEGORY_LABELS_BY_LANGUAGE[language],
  )) {
    const typedId = id as EfCategoryId;
    map.set(typedId, label);
    const efCategory = EF_CATEGORIES.find((c) => c.id === typedId);
    if (efCategory) {
      map.set(efCategory.spanishName, label);
      for (const name of efCategory.englishNames) map.set(name, label);
    }
  }
  return map;
};

const categoryAliasCache = new Map<
  CompareReportLanguage,
  Map<string, string>
>();

export const translateCategory = (
  category: string | undefined,
  language: CompareReportLanguage,
): string => {
  if (!category) return '';
  let aliasMap = categoryAliasCache.get(language);
  if (!aliasMap) {
    aliasMap = buildCategoryAliasMap(language);
    categoryAliasCache.set(language, aliasMap);
  }
  return aliasMap.get(category) ?? category;
};
