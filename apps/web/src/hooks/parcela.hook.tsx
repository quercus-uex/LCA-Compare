import type { Cultivo as CultivoBase, Parcela as ParcelaBase } from 'common/parcela';
import type { Polygon } from 'geojson';
import { createContext, useContext, useMemo } from 'react';
import * as React from 'react';
import { apiFetch } from '../common/api.ts';

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

  const getFromToken = async () => apiFetch<Parcela[]>('/parcela');

  const getById = async (id: string) => apiFetch<Parcela>(`/parcela/${id}`);

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
