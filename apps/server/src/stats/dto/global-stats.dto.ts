import { EfCategoryId } from '../../compare/compare.types';

export class KpiDto {
  totalParcelas: number;
  totalCultivos: number;
  superficieTotal: number;
  impactosPorCategoria: Record<EfCategoryId, number>;
  variacionInteranual: number | null;
}

export class ProvinciaRankingItemDto {
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
}

export class PoblacionRankingItemDto {
  idPoblacion: string;
  nombrePoblacion: string;
  nombreProvincia: string;
  numParcelas: number;
  impactoTotalMedio: number;
  impactosPorCategoria: Record<EfCategoryId, number>;
}

export class EvolucionTemporalItemDto {
  anio: number;
  numCultivos: number;
  categorias: Record<EfCategoryId, number>;
  totalImpacto: number;
}

export class DistribucionCultivoItemDto {
  tipo: string;
  count: number;
  superficieTotal: number;
}

export class GlobalStatsDto {
  kpis: KpiDto;
  rankingProvincias: ProvinciaRankingItemDto[];
  rankingPoblaciones: PoblacionRankingItemDto[];
  evolucionTemporal: EvolucionTemporalItemDto[];
  distribucionCultivos: DistribucionCultivoItemDto[];
  aniosDisponibles: number[];
}
