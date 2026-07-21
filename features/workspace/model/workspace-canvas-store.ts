"use client"

import { create } from "zustand"
import { temporal } from "zundo"

import {
  createDesignDocument,
  type DesignDocument,
} from "@/features/workspace/model/design-document"

type WorkspaceCanvasState = {
  document: DesignDocument | null
  selectedLayerIds: string[]
  setDocument: (document: DesignDocument | null) => void
  patchDocument: (patch: Partial<DesignDocument>) => void
  setSelectedLayerIds: (layerIds: string[]) => void
}

export const useWorkspaceCanvasStore = create<WorkspaceCanvasState>()(
  temporal(
    (set) => ({
      document: null,
      selectedLayerIds: [],
      setDocument: (document) => set({ document }),
      patchDocument: (patch) =>
        set((state) => {
          if (!state.document) {
            return state
          }

          return {
            document: createDesignDocument({
              ...state.document,
              ...patch,
            }),
          }
        }),
      setSelectedLayerIds: (selectedLayerIds) => set({ selectedLayerIds }),
    }),
    {
      limit: 100,
      partialize: (state) => ({
        document: state.document,
      }),
    },
  ),
)

export function useWorkspaceCanvasUndo() {
  const undo = useWorkspaceCanvasStore.temporal.getState().undo
  const redo = useWorkspaceCanvasStore.temporal.getState().redo
  const pastStates = useWorkspaceCanvasStore.temporal((state) => state.pastStates)
  const futureStates = useWorkspaceCanvasStore.temporal((state) => state.futureStates)

  return {
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    undo,
    redo,
  }
}
