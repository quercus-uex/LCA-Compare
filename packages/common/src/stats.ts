import type { EfCategoryId } from './impact.js';

export type KpiDto = {
  totalParcelas: number;
  totalCultivos: number;
  superficieTotal: number;
  impactosPorCategoria: Record<EfCategoryId, number>;
  variacionInteranual: number | null;
};

export type ProvinciaRankingItemDto = {
  idProvincia: string;
  nombreProvincia: string;
  numParcelas: number;
  numCultivos: number;
  superficieTotal: number;
  produccionMedia: number;
  consumoAguaMedio: number;
  impactoTotalMedio: number;
  impactosPorCategoria: Record<EfCategoryId, number>;
  eficiencia: number;
};

export type PoblacionRankingItemDto = {
  idPoblacion: string;
  nombrePoblacion: string;
  nombreProvincia: string;
  numParcelas: number;
  impactoTotalMedio: number;
  impactosPorCategoria: Record<EfCategoryId, number>;
};

export type EvolucionTemporalItemDto = {
  anio: number;
  numCultivos: number;
  categorias: Record<EfCategoryId, number>;
  totalImpacto: number;
};

export type DistribucionCultivoItemDto = {
  tipo: string;
  count: number;
  superficieTotal: number;
};

export type GlobalStatsDto = {
  kpis: KpiDto;
  rankingProvincias: ProvinciaRankingItemDto[];
  rankingPoblaciones: PoblacionRankingItemDto[];
  evolucionTemporal: EvolucionTemporalItemDto[];
  distribucionCultivos: DistribucionCultivoItemDto[];
  aniosDisponibles: number[];
};
