import type { Usuario } from 'common/usuario';
import { useMemo, createContext, useEffect, useState, useContext, useCallback } from 'react';
import { ApiError, apiFetch, apiRequest } from '../common/api.ts';
import { clearToken, getToken, setToken } from '../common/auth.ts';

type AuthContextType = {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Usuario | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [loading, setLoading] = useState(() => !!getToken());
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    apiFetch<Usuario>('/usuario')
      .then(u => {
        setUsuario(u);
        setLoading(false);
      })
      .catch(() => { void setLoading(false) });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text().catch(() => response.statusText));
    }

    const json = (await response.json()) as { data: { accessToken: string } };
    const token = json.data.accessToken;
    setToken(token);

    try {
      const u = await apiFetch<Usuario>('/usuario');
      setUsuario(u);
      return u;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUsuario(null);
  }, []);

  const value = useMemo(() => ({ usuario, loading, login, logout }), [usuario, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
