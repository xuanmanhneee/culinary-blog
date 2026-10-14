"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { AuthStoreProvider } from "@/lib/stores/auth-store";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthStoreProvider>{children}</AuthStoreProvider>
    </SessionProvider>
  );
}
