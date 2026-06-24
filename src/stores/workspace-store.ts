import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkspaceWithMeta } from "@/types";

interface WorkspaceState {
  workspaces: WorkspaceWithMeta[];
  currentWorkspace: WorkspaceWithMeta | null;
  setWorkspaces: (workspaces: WorkspaceWithMeta[]) => void;
  setCurrentWorkspace: (workspace: WorkspaceWithMeta | null) => void;
  addWorkspace: (workspace: WorkspaceWithMeta) => void;
  removeWorkspace: (workspaceId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      currentWorkspace: null,
      setWorkspaces: (workspaces) => set({ workspaces }),
      setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
      addWorkspace: (workspace) =>
        set((state) => ({ workspaces: [...state.workspaces, workspace] })),
      removeWorkspace: (workspaceId) =>
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? state.workspaces[0] ?? null
              : state.currentWorkspace,
        })),
    }),
    {
      name: "nexusai-workspace",
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);
