import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../common/api.ts';
import type { EfCategoryId } from 'common/impact';
import type { GlobalStatsDto } from 'common/stats';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      const response = await apiRequest(`/stats/global${qs}`);
      if (!response.ok) {
        throw new Error(t('stats.chart.loadError'));
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('stats.chart.unknownError'));
    } finally {
      setLoading(false);
    }
  }, [anio, categoria, tipoCultivo, idProvinciaPoblacion, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
