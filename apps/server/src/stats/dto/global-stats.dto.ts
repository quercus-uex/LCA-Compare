import { ApiProperty } from '@nestjs/swagger';
import type { EfCategoryId } from 'common/impact';
import type {
  CategoryValues,
  DistribucionCultivoItemDto as DistribucionCultivoItemShape,
  EvolucionTemporalItemDto as EvolucionTemporalItemShape,
  GlobalStatsDto as GlobalStatsShape,
  KpiDto as KpiShape,
  PoblacionRankingItemDto as PoblacionRankingItemShape,
  ProvinciaRankingItemDto as ProvinciaRankingItemShape,
} from 'common/stats';

export class KpiDto implements KpiShape {
  totalParcelas: number;
  totalCultivos: number;
  cultivosConImpacto: number;
  superficieTotal: number;
  impactosPorCategoria: CategoryValues;
  variacionInteranual: Record<EfCategoryId, number | null> | null;
  parcelasComparables: number | null;
}

export class ProvinciaRankingItemDto implements ProvinciaRankingItemShape {
  idProvincia: string;
  nombreProvincia: string;
  numParcelas: number;
  numCultivos: number;
  superficieTotal: number;
  impactosPorCategoria: CategoryValues;
  rendimiento: number | null;
  dotacionAgua: number | null;
  productividadAgua: number | null;
}

export class PoblacionRankingItemDto implements PoblacionRankingItemShape {
  idPoblacion: string;
  nombrePoblacion: string;
  idProvincia: string;
  nombreProvincia: string;
  numParcelas: number;
  numCultivos: number;
  superficieTotal: number;
  impactosPorCategoria: CategoryValues;
}

export class EvolucionTemporalItemDto implements EvolucionTemporalItemShape {
  anio: number;
  numCultivos: number;
  categorias: CategoryValues;
}

export class DistribucionCultivoItemDto implements DistribucionCultivoItemShape {
  tipo: string;
  count: number;
  superficieTotal: number;
}

export class ZonasOcultasDto {
  provincias: number;
  poblaciones: number;
}

export class GlobalStatsDto implements GlobalStatsShape {
  kpis: KpiDto;
  @ApiProperty({ type: [ProvinciaRankingItemDto] })
  rankingProvincias: ProvinciaRankingItemDto[];
  @ApiProperty({ type: [PoblacionRankingItemDto] })
  rankingPoblaciones: PoblacionRankingItemDto[];
  zonasOcultas: ZonasOcultasDto;
  @ApiProperty({ type: [EvolucionTemporalItemDto] })
  evolucionTemporal: EvolucionTemporalItemDto[];
  @ApiProperty({ type: [DistribucionCultivoItemDto] })
  distribucionCultivos: DistribucionCultivoItemDto[];
  aniosDisponibles: number[];
  tiposCultivoDisponibles: string[];
}
