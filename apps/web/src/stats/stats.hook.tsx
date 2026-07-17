import type { EfCategoryId } from 'common/impact';
import type { GlobalStatsDto } from 'common/stats';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../common/api.ts';

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
    try {
      const params = new URLSearchParams();
      if (anio) params.set('anio', String(anio));
      if (categoria) params.set('categoria', categoria);
      if (tipoCultivo) params.set('tipoCultivo', tipoCultivo);
      if (idProvinciaPoblacion) params.set('idProvinciaPoblacion', idProvinciaPoblacion);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await apiRequest(`/stats/global${qs}`);
      setError(null);
      if (!response.ok) {
        throw new Error(t('stats.chart.loadError'));
      }
      const json = (await response.json()) as GlobalStatsDto;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('stats.chart.unknownError'));
    } finally {
      setLoading(false);
    }
  }, [anio, categoria, tipoCultivo, idProvinciaPoblacion, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
