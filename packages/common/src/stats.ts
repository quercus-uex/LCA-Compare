import type { EfCategoryId } from './impact.js';

export type CategoryValues = Record<EfCategoryId, number>;

/**
 * Parcelas mínimas para que una provincia o población aparezca en los
 * rankings. Evita rankings decididos por una sola explotación y que la página
 * pública muestre los datos de una explotación concreta.
 */
export const STATS_MIN_PARCELAS = 3;

export type GlobalStatsQuery = {
  anio?: number;
  tipoCultivo?: string;
};

export type KpiDto = {
  totalParcelas: number;
  totalCultivos: number;
  /** Cultivos con resultado de impacto; son la muestra de las medias */
  cultivosConImpacto: number;
  /** Hectáreas */
  superficieTotal: number;
  /** Media por cultivo de cada categoría */
  impactosPorCategoria: CategoryValues;
  /**
   * Variación (%) de la media de cada categoría frente al año anterior. Es
   * `null` sin año seleccionado o sin datos del año anterior, y cada categoría
   * es `null` si su media del año anterior es 0.
   */
  variacionInteranual: Record<EfCategoryId, number | null> | null;
};

type ZonaStats = {
  numParcelas: number;
  numCultivos: number;
  /** Hectáreas */
  superficieTotal: number;
  /** Media por cultivo de cada categoría */
  impactosPorCategoria: CategoryValues;
};

export type ProvinciaRankingItemDto = ZonaStats & {
  idProvincia: string;
  nombreProvincia: string;
  /** kg/ha; `null` sin superficie */
  rendimiento: number | null;
  /** m³/ha; `null` sin superficie */
  dotacionAgua: number | null;
  /** kg/m³; `null` sin consumo de agua */
  productividadAgua: number | null;
};

export type PoblacionRankingItemDto = ZonaStats & {
  idPoblacion: string;
  nombrePoblacion: string;
  idProvincia: string;
  nombreProvincia: string;
};

export type EvolucionTemporalItemDto = {
  anio: number;
  numCultivos: number;
  categorias: CategoryValues;
};

export type DistribucionCultivoItemDto = {
  tipo: string;
  count: number;
  superficieTotal: number;
};

export type GlobalStatsDto = {
  kpis: KpiDto;
  /**
   * Zonas con al menos `STATS_MIN_PARCELAS` parcelas, de menor a mayor impacto
   * en la categoría por defecto
   */
  rankingProvincias: ProvinciaRankingItemDto[];
  rankingPoblaciones: PoblacionRankingItemDto[];
  /** Zonas con datos que no llegan a `STATS_MIN_PARCELAS` parcelas */
  zonasOcultas: { provincias: number; poblaciones: number };
  /** Todos los años; solo aplica el filtro de cultivo */
  evolucionTemporal: EvolucionTemporalItemDto[];
  /** Solo aplica el filtro de año */
  distribucionCultivos: DistribucionCultivoItemDto[];
  /** Sin filtros, para que las opciones no dependan de la selección */
  aniosDisponibles: number[];
  tiposCultivoDisponibles: string[];
};
