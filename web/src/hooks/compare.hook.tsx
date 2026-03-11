import type { Poblacion, Provincia } from './location.hook.tsx';
import type { Parcela } from './parcela.hook.tsx';
import type { ResultadoImpacto } from './resultado-impacto.hook.tsx';
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
};

export type CompareDiff = {
  impacto_total: { category: string, diff: number }[];
  impacto_pesticidas: { category: string, diff: number }[];
  impacto_fertilizantes: { category: string, diff: number }[];
  impacto_sistema_riego: { category: string, diff: number }[];
  impacto_manejo_cultivo: { category: string, diff: number }[];
}

export type CompareResult = {
  left?: ResultadoImpacto['datos'];
  right?: ResultadoImpacto['datos'];
  diff?: CompareDiff;
};

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
    }
  }

  const compareSingle = async (filters: CompareFilterType) => {
    const response = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        left: transformFilters(filters),
      }),
    });

    const json = await response.json();
    return json.data as CompareResult;

  }

  const compare = async (left: CompareFilterType, right: CompareFilterType) => {
    const response = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        left: transformFilters(left),
        right: transformFilters(right),
      }),
    });

    const json = await response.json();
    return json.data as CompareResult;
  }

  const generateReport = async (left: CompareFilterType, right: CompareFilterType) => {
    toast.info('Generando informe...');

    const response = await fetch(`${API_BASE_URL}/compare/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        left: transformFilters(left),
        right: transformFilters(right),
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