import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      _hasHydrated: false,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "nexusai-auth",
      // Only persist user to localStorage (not accessToken or loading flags)
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Called after localStorage is read — now it's safe to check auth
        state?.setHasHydrated(true);
      },
    }
  )
);
