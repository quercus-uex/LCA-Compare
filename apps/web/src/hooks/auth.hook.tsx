import { useMemo, createContext, useEffect, useState, useContext, useCallback } from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type Usuario = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  fechaRegistro: string;
  fechaActualizacion: string;
}

type AuthContextType = {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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
      return false;
    }

    const json = await response.json();
    localStorage.setItem('token', json.data.accessToken);
    return true;
  }, [t]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    window.location.reload();
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
