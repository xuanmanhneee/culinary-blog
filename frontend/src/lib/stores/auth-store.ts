"use client";

import { createElement, createContext, useContext, useMemo } from "react";
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
}

const AuthStoreContext = createContext<AuthStoreValue | null>(null);

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const value = useMemo(() => {
    const user: AuthStoreUser | null = session?.user
      ? {
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
          roles: session.user.roles,
        }
      : null;

    return { user, isLoading: status === "loading" };
  }, [session, status]);

  return createElement(AuthStoreContext.Provider, { value }, children);
}

export function useAuthStore(): AuthStoreValue {
  const store = useContext(AuthStoreContext);
  if (!store) {
    throw new Error("useAuthStore must be used within AuthStoreProvider.");
  }
  return store;
}
