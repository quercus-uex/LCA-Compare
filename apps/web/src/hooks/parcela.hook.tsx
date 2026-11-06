import type {
  Cultivo as CultivoBase,
  Parcela as ParcelaBase,
  ParcelaDetalle as ParcelaDetalleBase,
  ParcelaResumen as ParcelaResumenBase,
} from 'common/parcela';
import type { Polygon } from 'geojson';
import { createContext, useContext, useMemo } from 'react';
import * as React from 'react';
import { apiFetch } from '../common/api.ts';

export type { CultivoConImpacto, ParcelaPoblacion } from 'common/parcela';

export type Parcela = ParcelaBase & {
  geom?: Polygon | null;
  cultivos?: Cultivo[];
};

export type Cultivo = CultivoBase & {
  parcela?: Parcela;
};

export type ParcelaResumen = ParcelaResumenBase & { geom: Polygon | null };

export type ParcelaDetalle = ParcelaDetalleBase & { geom: Polygon | null };

type ParcelaContextType = {
  getFromToken: () => Promise<ParcelaResumen[]>;
  getById: (id: string) => Promise<ParcelaDetalle>;
}

const ParcelaContext = createContext<ParcelaContextType | undefined>(undefined);

export function ParcelaProvider({ children }: { children: React.ReactNode }) {

  const getFromToken = async () => apiFetch<ParcelaResumen[]>('/parcela');

  const getById = async (id: string) => apiFetch<ParcelaDetalle>(`/parcela/${id}`);

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
