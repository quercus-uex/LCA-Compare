import { createContext, useContext, useMemo } from 'react';
import type { Cultivo } from './parcela.hook.tsx';
import { API_BASE_URL } from '../common/constants.ts';
import type { ResultadoImpactoDto } from 'common/api';

type MetodoImpacto = {
  id: string;
  nombre: string;
}

export type ResultadoImpacto = {
  id: string;
  datos: ResultadoImpactoDto;
  impacto: MetodoImpacto;
  cultivo: Cultivo;
}

type ResultadoImpactoContextType = {
  getById: (id: string) => Promise<ResultadoImpacto>;
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

  const value = useMemo(() => ({ getById }), []);
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
