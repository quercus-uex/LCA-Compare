import { createContext, useCallback, useContext, useMemo } from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import { toast } from 'sonner';
import type { Pais, Provincia, Poblacion } from 'common/location';
import { useTranslation } from 'react-i18next';

export type { Pais, Provincia, Poblacion } from 'common/location';

type LocationContextType = {
  getProvincias: () => Promise<Provincia[]>;
  getPoblacionesFromProvinciaId: (id: string) => Promise<Poblacion[]>;
  getPoblacionesByName: (name: string) => Promise<Poblacion[]>;
  getPaises: () => Promise<Pais[]>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  const getProvincias = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/provincia`, {
      method: 'GET',
    });

    if (!response.ok) {
      toast.error(t('location.provincesError'));
      throw new Error();
    }

    const json = await response.json();
    return json.data as Provincia[];
  }, [t]);

  const getPoblacionesByName = useCallback(async (name: string) => {
    const response = await fetch(
      `${API_BASE_URL}/poblacion?nombre=${name}`,
      {
        method: 'GET',
      },
    );

    const json = await response.json();
    return json.data as Poblacion[];
  }, []);

  const getPoblacionesFromProvinciaId = useCallback(async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/provincia/${id}/poblaciones`, {
      method: 'GET',
    });

    if (!response.ok) {
      toast.error(t('location.townsError'));
      throw new Error();
    }

    const json = await response.json();
    return json.data as Poblacion[];
  }, [t]);

  const getPaises = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/pais`, { method: 'GET' });

    if (!response.ok) {
      toast.error(t('location.countriesError'));
      throw new Error();
    }

    const json = await response.json();
    return json.data as Pais[];
  }, [t]);

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
