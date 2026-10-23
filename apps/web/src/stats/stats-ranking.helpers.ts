import type { CategoryValues } from 'common/stats';
import type { EfCategoryId } from '../common/constants.ts';
import type { Poblacion, Provincia } from '../hooks/location.hook.tsx';
import type {
  PoblacionRankingItemDto,
  ProvinciaRankingItemDto,
} from './stats.hook.tsx';

export const RANKING_PAGE_SIZE = 10;

export type RankedEntry<T> = {
  item: T;
  /** Posición en el ranking completo, de menor a mayor impacto */
  position: number;
};

/** De menor a mayor impacto en una sola categoría: nunca se suman categorías */
export function rankByCategory<T extends { impactosPorCategoria: CategoryValues }>(
  items: T[],
  categoria: EfCategoryId,
): RankedEntry<T>[] {
  return [...items]
    .sort(
      (a, b) =>
        (a.impactosPorCategoria[categoria] ?? 0) -
        (b.impactosPorCategoria[categoria] ?? 0),
    )
    .map((item, index) => ({ item, position: index + 1 }));
}

// La vista de comparación solo usa id y nombre de la zona de referencia
export const provinciaToCompareState = (item: ProvinciaRankingItemDto) => ({
  provinciaReferencia: {
    id: item.idProvincia,
    nombre: item.nombreProvincia,
    idCatastro: 0,
    idPais: '',
  } satisfies Provincia,
});

export const poblacionToCompareState = (item: PoblacionRankingItemDto) => ({
  poblacionReferencia: {
    id: item.idPoblacion,
    nombre: item.nombrePoblacion,
    idProvincia: item.idProvincia,
    idCatastro: 0,
    provincia: {
      id: item.idProvincia,
      nombre: item.nombreProvincia,
      idCatastro: 0,
      idPais: '',
    },
  } satisfies Poblacion,
});
