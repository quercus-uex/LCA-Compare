import { createContext, useContext, useMemo } from 'react';
import * as React from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import type { Polygon } from 'geojson';
import type { Cultivo as CultivoBase, Parcela as ParcelaBase } from 'common/parcela';

export type { CultivoBase };

export type Parcela = ParcelaBase & {
  geom?: Polygon;
  cultivos?: Cultivo[];
};

export type Cultivo = CultivoBase & {
  parcela?: Parcela;
};

type ParcelaContextType = {
  getFromToken: () => Promise<Parcela[]>;
  getById: (id: string) => Promise<Parcela>;
}

const ParcelaContext = createContext<ParcelaContextType | undefined>(undefined);

export function ParcelaProvider({ children }: { children: React.ReactNode }) {

  const getFromToken = async () => {
    const response = await fetch(`${API_BASE_URL}/parcela`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error();

    const json = await response.json();
    return json.data as Parcela[];
  }

  const getById = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/parcela/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error();

    const json = await response.json();
    return json.data as Parcela;
  }

  const value = useMemo(() => ({ getFromToken, getById }), []);
  return (
    <ParcelaContext.Provider value={value}>{children}</ParcelaContext.Provider>
  );
}

export function useParcela() {
  const context = useContext(ParcelaContext);
  if (!context) {
    throw new Error('useParcela debe usarse dentro de ParcelaProvider');
  }
  return context;
}
