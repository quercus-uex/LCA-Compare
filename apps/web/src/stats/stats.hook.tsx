import type { GlobalStatsDto, GlobalStatsQuery } from 'common/stats';
import { useCallback, useEffect, useState } from 'react';
import { apiFetchRaw } from '../common/api.ts';

export type {
  GlobalStatsDto,
  KpiDto,
  ProvinciaRankingItemDto,
  PoblacionRankingItemDto,
  EvolucionTemporalItemDto,
  DistribucionCultivoItemDto,
} from 'common/stats';

type StatsState = {
  /** Petición a la que corresponden `data`/`failed`; `null` antes de la primera */
  requestKey: string | null;
  data: GlobalStatsDto | null;
  failed: boolean;
};

const buildQueryString = ({ anio, tipoCultivo }: GlobalStatsQuery) => {
  const params = new URLSearchParams();
  if (anio) params.set('anio', String(anio));
  if (tipoCultivo) params.set('tipoCultivo', tipoCultivo);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

/**
 * Carga las estadísticas globales. Al cambiar los filtros conserva los datos
 * anteriores mientras llega la respuesta (`isFetching`) y aborta la petición
 * en curso, para que una respuesta lenta no pise a otra más reciente.
 */
export function useStats(query: GlobalStatsQuery) {
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<StatsState>({
    requestKey: null,
    data: null,
    failed: false,
  });

  const queryString = buildQueryString(query);
  const requestKey = `${queryString}#${reloadCount}`;

  useEffect(() => {
    const controller = new AbortController();

    apiFetchRaw<GlobalStatsDto>(`/stats/global${queryString}`, { signal: controller.signal })
      .then((data) => setState({ requestKey, data, failed: false }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setState((prev) => ({ requestKey, data: prev.data, failed: true }));
      });

    return () => controller.abort();
  }, [queryString, requestKey]);

  const refetch = useCallback(() => setReloadCount((n) => n + 1), []);

  return {
    data: state.data,
    failed: state.failed,
    isFetching: state.requestKey !== requestKey,
    refetch,
  };
}
