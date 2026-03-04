import type { Poblacion, Provincia } from './location.hook.tsx';
import type { Parcela } from './parcela.hook.tsx';
import type { ResultadoImpacto } from './resultado-impacto.hook.tsx';
import { createContext, useContext, useMemo } from 'react';
import { API_BASE_URL } from '../common/constants.ts';

export type CompareFilterType = {
  poblacion?: Poblacion;
  provincia?: Provincia;
  parcela?: Parcela;
  lat?: number;
  long?: number;
  range?: number;
  tipoCultivo?: string;
};

type CompareDiff = {
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
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const transformFilters = (filters: CompareFilterType) => {
    return {
      idProvincia: filters.provincia?.id,
      idPoblacion: filters.poblacion?.id,
      idParcela: filters.parcela?.id,
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
    console.log(json.data.diff);
    return json.data as CompareResult;
  }

  const value = useMemo(() => ({ compare, compareSingle }), []);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare debe usarse dentro de CompareProvider');
  }
  return context;
}