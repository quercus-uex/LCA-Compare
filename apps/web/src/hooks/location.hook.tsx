import type { Pais, Provincia, Poblacion } from 'common/location';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { ApiError, apiRequest } from '../common/api.ts';

export type { Pais, Provincia, Poblacion } from 'common/location';

type LocationContextType = {
  getProvincias: () => Promise<Provincia[]>;
  getPoblacionesFromProvinciaId: (id: string) => Promise<Poblacion[]>;
  getPoblacionesByName: (name: string) => Promise<Poblacion[]>;
  getPaises: () => Promise<Pais[]>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const throwIfNotOk = async (response: Response): Promise<void> => {
  if (!response.ok) {
    throw new ApiError(response.status, await response.text().catch(() => response.statusText));
  }
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const getProvincias = useCallback(async () => {
    const response = await apiRequest('/provincia');
    await throwIfNotOk(response);
    const json = (await response.json()) as { data: Provincia[] };
    return json.data;
  }, []);

  const getPoblacionesByName = useCallback(async (name: string) => {
    const response = await apiRequest(`/poblacion?nombre=${name}`);
    await throwIfNotOk(response);
    const json = (await response.json()) as { data: Poblacion[] };
    return json.data;
  }, []);

  const getPoblacionesFromProvinciaId = useCallback(async (id: string) => {
    const response = await apiRequest(`/provincia/${id}/poblaciones`);
    await throwIfNotOk(response);
    const json = (await response.json()) as { data: Poblacion[] };
    return json.data;
  }, []);

  const getPaises = useCallback(async () => {
    const response = await apiRequest('/pais');
    await throwIfNotOk(response);
    const json = (await response.json()) as { data: Pais[] };
    return json.data;
  }, []);

  const value = useMemo(() => ({ getProvincias, getPoblacionesFromProvinciaId, getPoblacionesByName, getPaises }), [getProvincias, getPoblacionesFromProvinciaId, getPoblacionesByName, getPaises]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation debe usarse dentro de LocationProvider');
  }
  return context;
}
