"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { setWorkspaces, setCurrentWorkspace, currentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    // Wait until Zustand has rehydrated user from localStorage
    if (!_hasHydrated) return;

    if (!user) {
      router.push("/login");
      return;
    }

    fetch("/api/workspace")
      .then((r) => r.json())
      .then((j) => {
        const workspaces = j.data ?? [];
        setWorkspaces(workspaces);
        if (!currentWorkspace && workspaces.length > 0) {
          setCurrentWorkspace(workspaces[0]);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, user]);

  // Block render until localStorage has been read so we never flash a redirect
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080811]">
        <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#080811] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
