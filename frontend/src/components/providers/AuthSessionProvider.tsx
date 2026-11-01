"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { type ReactNode, useEffect } from "react";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider><SessionRefreshGuard />{children}</SessionProvider>;
}

function SessionRefreshGuard() {
  const { data: session } = useSession();

  useEffect(() => {
    // Xoá session Zustand cũ từng lưu access token trong localStorage.
    localStorage.removeItem("culinary-blog-auth");
  }, []);

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      void signOut({ callbackUrl: "/login" });
    }
  }, [session?.error]);

  return null;
}
