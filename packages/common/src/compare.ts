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
  /**
   * Percentage change of the target with respect to the reference (baseline):
   * `(tarAmount - refAmount) / |refAmount| * 100`. Positive means the target
   * has a higher impact. `null` when the reference is zero or the category is
   * missing from the target (then `tarAmount` is absent too); absent when
   * there is no target set.
   */
  diff?: number | null;
};

export type CompareResultDto = Record<ImpactKey, CompareResultItemDto[]>;
