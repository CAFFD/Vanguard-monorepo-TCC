import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, UNAUTHORIZED_EVENT } from '../../../lib/api';
import type { User, UserRole } from '../../users/types';

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGestor: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const body = await res.json();
        setUser(body?.data?.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiFetch('/auth/me')
      .then(async (res) => {
        if (!isMounted) return;
        if (res.ok) {
          const body = await res.json();
          setUser(body?.data?.user ?? null);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          return {
            ok: false,
            error: body?.message || 'Muitas tentativas de login. Aguarde 1 minuto e tente novamente.',
          };
        }
        return {
          ok: false,
          error: body?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.',
        };
      }

      const loggedUser: User | null = body?.data?.user ?? null;
      setUser(loggedUser);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Servidor indisponível no momento. Verifique sua conexão ou se a API está em execução.',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignora falha de rede ao encerrar sessão local
    } finally {
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isGestor: user?.role === 'GESTOR',
        hasRole,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}

