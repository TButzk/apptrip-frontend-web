import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren
} from "react";
import { AUTH_STORAGE_KEY, SESSION_STORAGE_KEY } from "services/http";
import type { UserLoginDto } from "types/domain";

type AuthContextValue = {
  session: UserLoginDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setSession: (session: UserLoginDto) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSessionState] = useState<UserLoginDto | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ?JSON.parse(stored) as UserLoginDto : null;
    } catch {
      return null;
    }
  });

  const setSession = useCallback((newSession: UserLoginDto) => {
    localStorage.setItem(AUTH_STORAGE_KEY, newSession.token);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    setSessionState(newSession);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionState(null);
  }, []);

  useEffect(() => {
    window.addEventListener("apptrip:session-expired", logout);
    return () => window.removeEventListener("apptrip:session-expired", logout);
  }, [logout]);

  const value = useMemo(() => ({
    session,
    token: session?.token ?? null,
    isAuthenticated: Boolean(session?.token),
    isAdmin: session?.role === "ADMIN",
    setSession,
    logout
  }), [logout, session, setSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
