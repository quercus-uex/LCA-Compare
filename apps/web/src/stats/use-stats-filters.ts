import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  DEFAULT_EF_CATEGORY,
  EF_CATEGORIES,
  type EfCategoryId,
} from '../common/constants.ts';

export type StatsFilters = {
  anio?: number;
  tipoCultivo?: string;
  categoria: EfCategoryId;
  /** Provincia del ranking de poblaciones; solo filtra en el cliente */
  provincia?: string;
};

// Nombres de los parámetros en la URL, para que una vista filtrada se pueda
// compartir o recargar
const PARAMS = {
  anio: 'anio',
  tipoCultivo: 'cultivo',
  categoria: 'categoria',
  provincia: 'provincia',
} as const satisfies Record<keyof StatsFilters, string>;

const isEfCategoryId = (value: string | null): value is EfCategoryId =>
  EF_CATEGORIES.some((cat) => cat.id === value);

const parseYear = (value: string | null) => {
  if (!value || !/^\d{4}$/.test(value)) return undefined;
  return Number(value);
};

export function useStatsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<StatsFilters>(() => {
    const categoria = searchParams.get(PARAMS.categoria);
    return {
      anio: parseYear(searchParams.get(PARAMS.anio)),
      tipoCultivo: searchParams.get(PARAMS.tipoCultivo) || undefined,
      categoria: isEfCategoryId(categoria) ? categoria : DEFAULT_EF_CATEGORY,
      provincia: searchParams.get(PARAMS.provincia) || undefined,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<StatsFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const param = PARAMS[key as keyof StatsFilters];
            const isDefault =
              key === 'categoria' && value === DEFAULT_EF_CATEGORY;
            if (value === undefined || value === '' || isDefault) {
              next.delete(param);
            } else {
              next.set(param, String(value));
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(
    () => setSearchParams(new URLSearchParams(), { replace: true }),
    [setSearchParams],
  );

  const hasActiveFilters =
    filters.anio !== undefined ||
    filters.tipoCultivo !== undefined ||
    filters.categoria !== DEFAULT_EF_CATEGORY ||
    filters.provincia !== undefined;

  return { filters, setFilters, resetFilters, hasActiveFilters };
}
