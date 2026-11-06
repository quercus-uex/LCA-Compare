import type { Pais, Provincia, Poblacion } from 'common/location';
import { createContext, useContext } from 'react';
import { apiFetch } from '../common/api.ts';

export type { Pais, Provincia, Poblacion } from 'common/location';

type LocationContextType = {
  getProvincias: () => Promise<Provincia[]>;
  getPoblacionesByName: (name: string) => Promise<Poblacion[]>;
  getPaises: () => Promise<Pais[]>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Sin estado: las funciones son estables y el valor del contexto también
const value: LocationContextType = {
  getProvincias: () => apiFetch<Provincia[]>('/provincia'),
  getPoblacionesByName: (name) => apiFetch<Poblacion[]>(`/poblacion?nombre=${encodeURIComponent(name)}`),
  getPaises: () => apiFetch<Pais[]>('/pais'),
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation debe usarse dentro de LocationProvider');
  }
  return context;
}
