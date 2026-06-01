import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../common/constants.ts';

export type KpiDto = {
  totalParcelas: number;
  totalCultivos: number;
  superficieTotal: number;
  consumoAguaMedio: number;
  produccionMedia: number;
  impactoTotalMedio: number;
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
  eficiencia: number;
};

export type PoblacionRankingItemDto = {
  idPoblacion: string;
  nombrePoblacion: string;
  nombreProvincia: string;
  numParcelas: number;
  impactoTotalMedio: number;
};

export type EvolucionTemporalItemDto = {
  anio: number;
  impactoFertilizantes: number;
  impactoManejoCultivo: number;
  impactoPesticidas: number;
  impactoSistemaRiego: number;
  impactoTotal: number;
  numCultivos: number;
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

export function useStats(anio?: number) {
  const [data, setData] = useState<GlobalStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = anio ? `?anio=${anio}` : '';
      const response = await fetch(`${API_BASE_URL}/stats/global${params}`);
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
  }, [anio]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
