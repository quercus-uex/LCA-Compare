import { useMemo, createContext, useEffect, useState, useContext, useCallback } from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import type { Usuario } from 'common/usuario';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type AuthContextType = {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Usuario | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      new Promise(() => setLoading(false));
      return;
    }

    fetch(`${API_BASE_URL}/usuario`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(u => {
        setUsuario(u.data);
        setLoading(false);
      })
      .catch(() => { setLoading(false) })
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      toast.error(t('auth.login.invalidCredentials'));
      return null;
    }

    const json = await response.json();
    const token = json.data.accessToken as string;
    localStorage.setItem('token', token);

    try {
      const userRes = await fetch(`${API_BASE_URL}/usuario`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!userRes.ok) throw new Error();
      const userJson = await userRes.json();
      const u = userJson.data as Usuario;
      setUsuario(u);
      return u;
    } catch {
      return null;
    }
  }, [t]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
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
