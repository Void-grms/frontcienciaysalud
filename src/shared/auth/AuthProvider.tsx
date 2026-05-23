import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { apiInternals } from '@shared/api/client';
import { authApi } from '@features/auth/api';

import { SessionExpiringDialog } from './SessionExpiringDialog';
import { useIdleTimer } from './useIdleTimer';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Mantenemos el access token en una ref ademas del state, para que el
  // interceptor de Axios pueda leerlo de forma sincrona via apiInternals.
  const accessTokenRef = useRef<string | null>(null);
  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
  }, []);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const result = await authApi.refresh();
      setAccessToken(result.accessToken);
      setUser(result.user);
      return result.user;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, [setAccessToken]);

  const login = useCallback(
    async (identifier: string, password: string): Promise<AuthUser> => {
      const result = await authApi.login(identifier, password);
      setAccessToken(result.accessToken);
      setUser(result.user);
      return result.user;
    },
    [setAccessToken],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // si el server ya invalido la sesion, no nos importa
    }
    setAccessToken(null);
    setUser(null);
  }, [setAccessToken]);

  // Cableamos la "API publica" del cliente HTTP con los handlers reales.
  // Esto sucede una sola vez y antes del primer render util.
  useEffect(() => {
    apiInternals.setAccessTokenGetter(() => accessTokenRef.current);
    apiInternals.setOnRefresh(async () => {
      try {
        const result = await authApi.refresh();
        setAccessToken(result.accessToken);
        setUser(result.user);
        return result.accessToken;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      }
    });
    apiInternals.setOnAuthFailure(() => {
      setAccessToken(null);
      setUser(null);
    });
  }, [setAccessToken]);

  // Bootstrap: al primer mount intentamos refrescar la sesion para que un
  // F5 no expulse al usuario si la cookie de refresh sigue viva.
  useEffect(() => {
    let mounted = true;
    refresh().finally(() => {
      if (mounted) setIsAuthenticating(false);
    });
    return () => {
      mounted = false;
    };
  }, [refresh]);

  // Logout disparado por idle (no por el usuario): cierra sesion sin esperar
  // confirmacion y muestra toast para que el usuario sepa por que volvio al login.
  const handleIdleTimeout = useCallback(() => {
    void logout().finally(() => {
      toast.info('Tu sesion expiro por inactividad. Vuelve a iniciar sesion.');
    });
  }, [logout]);

  const idle = useIdleTimer(!!user, handleIdleTimeout);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticating,
      isAuthenticated: !!user,
      login,
      logout,
      refresh,
    }),
    [user, isAuthenticating, login, logout, refresh],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiringDialog
        open={idle.showWarning && !!user}
        secondsToLogout={idle.secondsToLogout}
        onExtend={() => void idle.extend()}
        onLogoutNow={() => void logout()}
      />
    </AuthContext.Provider>
  );
}
