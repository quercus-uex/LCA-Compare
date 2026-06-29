export {
  EF_CATEGORIES,
  IMPACT_KEYS,
  type EfCategoryId,
  type ImpactKey,
} from './impact.js';

export type {
  KpiDto,
  ProvinciaRankingItemDto,
  PoblacionRankingItemDto,
  EvolucionTemporalItemDto,
  DistribucionCultivoItemDto,
  GlobalStatsDto,
} from './stats.js';

export type {
  CompareFilterDto,
  CompareQueryItemDto,
  CompareQueryDto,
  CompareReportLanguage,
  CompareResultItemDto,
  CompareResultDto,
} from './compare.js';

export type { Pais, Provincia, Poblacion } from './location.js';

export type { Cultivo, Parcela } from './parcela.js';

export type { Usuario } from './usuario.js';

export type { LoginSuccessDto, LoginDto } from './auth.js';

export type {
  ApiResponse,
  ApiResponseArray,
  ApiErrorDto,
  ResultadoImpactoItemDto,
  ResultadoImpactoDto,
} from './api.js';
