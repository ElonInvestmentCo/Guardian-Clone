import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getApiBase } from "@/lib/api";

export interface AuthUser {
  email: string;
  status: string;
  kycComplete: boolean;
  completedSteps: number[];
  totalSteps: number;
  role: string;
  profilePicture: string | null;
  settings: {
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    state: string;
    city: string;
  };
  notificationPreferences: Record<string, boolean>;
  twoFAEnabled: boolean;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/me`, {
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json() as AuthUser;
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      const base = getApiBase();
      await fetch(`${base}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* continue regardless */
    }
    setUser(null);
    sessionStorage.clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
