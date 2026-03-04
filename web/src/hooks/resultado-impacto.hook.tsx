import { createContext, useContext, useMemo } from 'react';
import type { Cultivo } from './parcela.hook.tsx';
import { API_BASE_URL } from '../common/constants.ts';

type MetodoImpacto = {
  id: string;
  nombre: string;
}

export type ResultadoImpactoItem = {
  unit: string;
  amount: number;
  category: string;
}

export type ResultadoImpacto = {
  id: string;
  datos: {
    impacto_total: ResultadoImpactoItem[],
    impacto_pesticidas: ResultadoImpactoItem[],
    impacto_fertilizantes: ResultadoImpactoItem[],
    impacto_sistema_riego: ResultadoImpactoItem[],
    impacto_manejo_cultivo: ResultadoImpactoItem[],
  };
  impacto: MetodoImpacto;
  cultivo: Cultivo;
}

export type ResultadoImpactoComparison = {
  resultado: ResultadoImpacto;
  nearbyMean: {
    impacto_total: [ResultadoImpactoItem & { diff: string }];
    impacto_pesticidas: [ResultadoImpactoItem & { diff: string }];
    impacto_fertilizantes: [ResultadoImpactoItem & { diff: string }];
    impacto_sistema_riego: [ResultadoImpactoItem & { diff: string }];
    impacto_manejo_cultivo: [ResultadoImpactoItem & { diff: string }];
  };
};

type ResultadoImpactoContextType = {
  getById: (id: string) => Promise<ResultadoImpacto>;
  compareById: (id: string, range: number) => Promise<ResultadoImpactoComparison>;
}

const ResultadoImpactoContext = createContext<ResultadoImpactoContextType | undefined>(undefined);

export function ResultadoImpactoProvider({ children }: { children: React.ReactNode }) {

  const getById = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/resultado/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error();

    const json = await response.json();
    return json.data as ResultadoImpacto;
  }

  const compareById = async (id: string, range: number) => {
    const response = await fetch(`${API_BASE_URL}/resultado/${id}/compare?range=${range}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error();

    const json = await response.json();
    return json.data as ResultadoImpactoComparison;
  }

  const value = useMemo(() => ({ getById, compareById }), []);
  return (
    <ResultadoImpactoContext.Provider value={value}>{children}</ResultadoImpactoContext.Provider>
  )
}

export function useResultadoImpacto() {
  const context = useContext(ResultadoImpactoContext);
  if (!context) {
    throw new Error('useResultadoImpacto debe usarse dentro de ResultadoImpactoProvider');
  }
  return context;
}