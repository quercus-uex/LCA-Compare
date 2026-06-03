import type { Pais, Poblacion, Provincia } from 'common/location';
import type { Parcela } from 'common/parcela';
import type { CompareFilterDto, CompareResultDto } from 'common/compare';
import { createContext, useContext, useMemo } from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import { toast } from 'sonner';

export type { CompareFilterDto, CompareResultDto } from 'common/compare';
export type { CompareResultItemDto } from 'common/compare';
export type CompareResult = CompareResultDto;

export type CompareFilterType = {
  pais?: Pais;
  poblaciones?: Poblacion[];
  provincias?: Provincia[];
  parcelas?: Parcela[];
  lat?: number;
  long?: number;
  range?: number;
  tipoCultivo?: string;
  anioCampaniaInicio?: number;
  anioCampaniaFin?: number;
};

type CompareContextType = {
  compareSingle: (filters: CompareFilterType) => Promise<CompareResultDto>;
  compare: (left: CompareFilterType, right: CompareFilterType) => Promise<CompareResultDto>;
  generateReport: (left: CompareFilterType, right: CompareFilterType) => Promise<void>;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const transformFilters = (filters: CompareFilterType): CompareFilterDto => {
    return {
      idsProvincia: filters.provincias?.map(p => p.id),
      idsPoblacion: filters.poblaciones?.map(p => p.id),
      idsParcela: filters.parcelas?.map(p => p.id),
      lat: filters.lat,
      long: filters.long,
      range: filters.range,
      tipoCultivo: filters.tipoCultivo,
      anioCampaniaInicio: filters.anioCampaniaInicio,
      anioCampaniaFin: filters.anioCampaniaFin,
      idPais: filters.pais?.id
    }
  }

  const compareSingle = async (filters: CompareFilterType) => {
    const response = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: transformFilters(filters),
      }),
    });

    if (!response.ok) {
      toast.error(
        'No existen datos suficientes con los filtros proporcionados',
      );
    }

    const json = await response.json();
    return json.data as CompareResultDto;

  }

  const compare = async (reference: CompareFilterType, target: CompareFilterType) => {
    const response = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: transformFilters(reference),
        target: transformFilters(target),
      }),
    });

    if (!response.ok) {
      toast.error(
        'No existen datos suficientes con los filtros proporcionados',
      );
    }

    const json = await response.json();
    return json.data as CompareResultDto;
  }

  const generateReport = async (reference: CompareFilterType, target: CompareFilterType) => {
    toast.info('Generando informe...');

    const response = await fetch(`${API_BASE_URL}/compare/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: transformFilters(reference),
        target: transformFilters(target),
      }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Report.pdf';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Informe generado');
  }

  const value = useMemo(() => ({ compare, compareSingle, generateReport }), []);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare debe usarse dentro de CompareProvider');
  }
  return context;
}
