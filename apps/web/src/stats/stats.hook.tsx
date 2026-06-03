import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, type EfCategoryId } from '../common/constants.ts';

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
