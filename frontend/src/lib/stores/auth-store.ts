"use client";

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { Role } from "@/lib/types/auth";

export interface AuthStoreUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: Role[];
}

interface AuthStoreValue {
  user: AuthStoreUser | null;
  isLoading: boolean;
  setUser: (user: AuthStoreUser | null) => void;
  clearUser: () => void;
}

const AuthStoreContext = createContext<AuthStoreValue | null>(null);

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthStoreUser | null>(null);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user) {
      setUser(null);
      return;
    }

    setUser({
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      roles: session.user.roles,
    });
  }, [session, status]);

  const clearUser = useCallback(() => setUser(null), []);
  const value = useMemo(
    () => ({ user, isLoading: status === "loading", setUser, clearUser }),
    [user, status, clearUser],
  );

  return createElement(AuthStoreContext.Provider, { value }, children);
}

export function useAuthStore(): AuthStoreValue {
  const store = useContext(AuthStoreContext);
  if (!store) {
    throw new Error("useAuthStore must be used within AuthStoreProvider.");
  }
  return store;
}
