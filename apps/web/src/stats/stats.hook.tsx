import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import type { EfCategoryId } from 'common/impact';
import type { GlobalStatsDto } from 'common/stats';

export type { GlobalStatsDto } from 'common/stats';
export type {
  KpiDto,
  ProvinciaRankingItemDto,
  PoblacionRankingItemDto,
  EvolucionTemporalItemDto,
  DistribucionCultivoItemDto,
} from 'common/stats';

export function useStats(
  anio?: number,
  categoria?: EfCategoryId,
  tipoCultivo?: string,
  idProvinciaPoblacion?: string,
) {
  const [data, setData] = useState<GlobalStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (anio) params.set('anio', String(anio));
      if (categoria) params.set('categoria', categoria);
      if (tipoCultivo) params.set('tipoCultivo', tipoCultivo);
      if (idProvinciaPoblacion) params.set('idProvinciaPoblacion', idProvinciaPoblacion);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${API_BASE_URL}/stats/global${qs}`);
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [anio, categoria, tipoCultivo, idProvinciaPoblacion]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
