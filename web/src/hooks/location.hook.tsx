import { createContext, useContext, useMemo } from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import { toast } from 'sonner';

export type Provincia = {
  id: string;
  nombre: string;
  idCatastro: number;
}

export type Poblacion = {
  id: string;
  idProvincia: string;
  idCatastro: number;
  nombre: string;
}

type LocationContextType = {
  getProvincias: () => Promise<Provincia[]>;
  getPoblacionesFromProvinciaId: (id: string) => Promise<Poblacion[]>;
  getPoblacionesByName: (name: string) => Promise<Poblacion[]>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const getProvincias = async () => {
    const response = await fetch(`${API_BASE_URL}/provincia`, {
      method: 'GET',
    });

    if (!response.ok) {
      toast.error("Error al obtener la lista de provincias");
      throw new Error();
    }

    const json = await response.json();
    return json.data as Provincia[];
  }

  const getPoblacionesByName = async (name: string) => {
    const response = await fetch(
      `${API_BASE_URL}/poblacion?nombre=${name}`,
      {
        method: 'GET',
      },
    );

    const json = await response.json();
    return json.data as Poblacion[];
  }

  const getPoblacionesFromProvinciaId = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/provincia/${id}/poblaciones`, {
      method: 'GET',
    });

    if (!response.ok) {
      toast.error('Error al obtener la lista de poblaciones');
      throw new Error();
    }

    const json = await response.json();
    return json.data as Poblacion[];
  }

  const value = useMemo(() => ({ getProvincias, getPoblacionesFromProvinciaId, getPoblacionesByName }), []);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation debe usarse dentro de LocationProvider');
  }
  return context;
}