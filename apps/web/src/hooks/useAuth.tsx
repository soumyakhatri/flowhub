import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, login as loginRequest, logout as logoutRequest, refresh, register as registerRequest, type RegisterInput } from "../api/auth";
import { ApiError, clearSession, getAccessToken } from "../api/client";
import type { User } from "../types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    async function restore() {
      await refresh();
      if (!getAccessToken()) {
        if (active) {
          setUser(null);
          setStatus("anonymous");
        }
        return;
      }

      try {
        const me = await getMe();
        if (!active) return;
        setUser(me);
        setStatus("authenticated");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) clearSession();
        if (!active) return;
        setUser(null);
        setStatus("anonymous");
      }
    }

    void restore();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login: async (email, password) => {
        const next = await loginRequest({ email, password });
        setUser(next);
        setStatus("authenticated");
      },
      register: async (input) => {
        const next = await registerRequest(input);
        setUser(next);
        setStatus("authenticated");
      },
      logout: async () => {
        await logoutRequest();
        queryClient.clear();
        setUser(null);
        setStatus("anonymous");
      },
    }),
    [queryClient, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}