import type { ImpactKey } from './impact.js';

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
};

export type CompareQueryItemDto = CompareFilterDto;

export type CompareQueryDto = {
  reference: CompareQueryItemDto;
  target?: CompareQueryItemDto;
};

export type CompareResultItemDto = {
  category: string;
  refAmount: number;
  tarAmount?: number;
  unit: string;
  diff?: number;
};

export type CompareResultDto = Record<ImpactKey, CompareResultItemDto[]>;
