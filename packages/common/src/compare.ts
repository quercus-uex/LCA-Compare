import type { ImpactKey } from './impact.js';

export type CompareReportLanguage = 'es' | 'en' | 'pt';

export type CompareFilterDto = {
  idPais?: string;
  idsPoblacion?: string[];
  idsProvincia?: string[];
  idsParcela?: string[];
  lat?: number;
  long?: number;
  range?: number;
  tipoCultivo?: string;
  anioCampaniaInicio?: number;
  anioCampaniaFin?: number;
  soloParcelasReferencia?: boolean;
};

export type CompareQueryItemDto = CompareFilterDto;

export type CompareQueryDto = {
  reference: CompareQueryItemDto;
  target?: CompareQueryItemDto;
  language?: CompareReportLanguage;
};

export type CompareResultItemDto = {
  category: string;
  refAmount: number;
  tarAmount?: number;
  unit: string;
  diff?: number | null;
};

export type CompareResultDto = Record<ImpactKey, CompareResultItemDto[]>;
