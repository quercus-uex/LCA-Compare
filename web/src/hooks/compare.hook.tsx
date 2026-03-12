import type { Poblacion, Provincia } from './location.hook.tsx';
import type { Parcela } from './parcela.hook.tsx';
import { createContext, useContext, useMemo } from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import { toast } from 'sonner';

export type CompareFilterType = {
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

export type CompareResultItem = {
  category: string;
  unit: string;
  refAmount: number;
  tarAmount?: number;
  diff: number;
}

export type CompareResult = {
  impacto_total: CompareResultItem[];
  impacto_fertilizantes: CompareResultItem[];
  impacto_sistema_riego: CompareResultItem[];
  impacto_manejo_cultivo: CompareResultItem[];
  impacto_pesticidas: CompareResultItem[];
}

type CompareContextType = {
  compareSingle: (filters: CompareFilterType) => Promise<CompareResult>;
  compare: (left: CompareFilterType, right: CompareFilterType) => Promise<CompareResult>;
  generateReport: (left: CompareFilterType, right: CompareFilterType) => Promise<void>;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const transformFilters = (filters: CompareFilterType) => {
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
    return json.data as CompareResult;

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
    return json.data as CompareResult;
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