"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUserDto, Role } from "@/lib/types/auth";

interface AuthState {
  user: AuthUserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: AuthUserDto, accessToken: string) => void;
  updateProfile: (profile: Partial<Pick<AuthUserDto, "fullName" | "avatarUrl">>) => void;
  hasRole: (role: Role) => boolean;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setSession: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      updateProfile: (profile) =>
        set((state) => ({ user: state.user ? { ...state.user, ...profile } : null })),
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
      clearSession: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: "culinary-blog-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ user, accessToken, isAuthenticated }) => ({ user, accessToken, isAuthenticated }),
    },
  ),
);
