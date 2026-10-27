import type { CompareReportLanguage } from 'common/compare';
import type { EfCategoryId } from 'common/impact';
import { getEfCategoryId } from 'common/impact';

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
  readonly fromData: string;
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
  readonly differenceNote: string;
  readonly notAvailable: string;
  readonly referenceOnly: string;
  readonly yes: string;
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
    range: 'Radio',
    cropType: 'Tipo de cultivo',
    campaignDate: 'Fecha de campaña',
    from: 'Desde',
    to: 'Hasta',
    fromData: '(según los datos)',
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
    referenceAmount: 'Cantidad de referencia',
    targetAmount: 'Cantidad objetivo',
    unit: 'Unidad',
    difference: 'Diferencia',
    differenceNote:
      'Diferencia = (objetivo − referencia) / referencia × 100. Un valor positivo indica que el conjunto objetivo tiene más impacto que el de referencia; uno negativo, menos.',
    notAvailable: 'n/a',
    referenceOnly: 'Solo parcelas de referencia',
    yes: 'Sí',
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
    range: 'Radius',
    cropType: 'Crop type',
    campaignDate: 'Season',
    from: 'From',
    to: 'To',
    fromData: '(from the data)',
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
    differenceNote:
      'Difference = (target − reference) / reference × 100. A positive value means the target set has a higher impact than the reference set; a negative value, a lower one.',
    notAvailable: 'n/a',
    referenceOnly: 'Only reference plots',
    yes: 'Yes',
  },
  pt: {
    htmlLang: 'pt',
    dateLocale: 'pt-PT',
    documentTitle: 'Relatório de comparação',
    reportTitle: 'Relatório de comparação de ACV',
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
    fromData: '(segundo os dados)',
    unchosenFilters: 'Filtros não escolhidos pelo utilizador',
    keyResults: 'RESULTADOS-CHAVE',
    summary: 'RESUMO',
    recommendations: 'RECOMENDAÇÕES',
    aiDisclaimer: '* Conteúdo gerado por IA. Pode ser impreciso.',
    impactTotal: 'IMPACTO TOTAL',
    impactPesticides: 'IMPACTO DE PESTICIDAS',
    impactFertilizers: 'IMPACTO DE FERTILIZANTES',
    impactIrrigationSystem: 'IMPACTO DO SISTEMA DE REGA',
    impactCropManagement: 'IMPACTO DO MANEIO DA CULTURA',
    category: 'Categoria',
    referenceAmount: 'Quantidade de referência',
    targetAmount: 'Quantidade alvo',
    unit: 'Unidade',
    difference: 'Diferença',
    differenceNote:
      'Diferença = (alvo − referência) / referência × 100. Um valor positivo indica que o conjunto alvo tem mais impacto do que o de referência; um negativo, menos.',
    notAvailable: 'n/a',
    referenceOnly: 'Apenas parcelas de referência',
    yes: 'Sim',
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

const EF_LABELS_BY_LANGUAGE: Record<
  CompareReportLanguage,
  Record<EfCategoryId, string>
> = {
  es: {
    climate_change: 'Cambio climático',
    acidification: 'Acidificación',
    eutrophication_freshwater: 'Eutrofización (agua dulce)',
    eutrophication_marine: 'Eutrofización (marina)',
    eutrophication_terrestrial: 'Eutrofización (terrestre)',
    water_use: 'Uso del agua',
    land_use: 'Uso del suelo',
    particulate_matter: 'Partículas en suspensión',
    ecotoxicity: 'Ecotoxicidad',
    human_toxicity_cancer: 'Toxicidad humana (cancerígena)',
    human_toxicity_non_cancer: 'Toxicidad humana (no cancerígena)',
  },
  en: {
    climate_change: 'Climate change',
    acidification: 'Acidification',
    eutrophication_freshwater: 'Eutrophication, freshwater',
    eutrophication_marine: 'Eutrophication, marine',
    eutrophication_terrestrial: 'Eutrophication, terrestrial',
    water_use: 'Water use',
    land_use: 'Land use',
    particulate_matter: 'Particulate matter',
    ecotoxicity: 'Ecotoxicity',
    human_toxicity_cancer: 'Human toxicity, cancer',
    human_toxicity_non_cancer: 'Human toxicity, non-cancer',
  },
  pt: {
    climate_change: 'Alterações climáticas',
    acidification: 'Acidificação',
    eutrophication_freshwater: 'Eutrofização (água doce)',
    eutrophication_marine: 'Eutrofização (marinha)',
    eutrophication_terrestrial: 'Eutrofização (terrestre)',
    water_use: 'Uso da água',
    land_use: 'Uso do solo',
    particulate_matter: 'Partículas em suspensão',
    ecotoxicity: 'Ecotoxicidade',
    human_toxicity_cancer: 'Toxicidade humana (cancerígena)',
    human_toxicity_non_cancer: 'Toxicidade humana (não cancerígena)',
  },
};

export const translateCategory = (
  category: string | undefined,
  language: CompareReportLanguage,
): string => {
  if (!category) return '';
  const id = getEfCategoryId(category);
  return id ? EF_LABELS_BY_LANGUAGE[language][id] : category;
};
