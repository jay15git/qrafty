"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { writeDraftingWorkspaceDraft } from "@/features/workspace/model/storage"
import { writeWorkspaceBootstrapSnapshot } from "@/features/workspace/model/workspace-bootstrap"
import {
  buildDesktopEditorUrl,
  type StudioNavigationIntent,
  writeStudioSession,
} from "@/features/studio-hub/model/navigation"
import { createDocumentFromHubIntent } from "@/features/studio-hub/model/bootstrap-document"

export type HubTransitionItem = {
  id: string
  thumbnailUrl?: string
  title?: string
}

type StudioNavigationContextValue = {
  transitionItem: HubTransitionItem | null
  openEditor: (intent: StudioNavigationIntent, item?: HubTransitionItem) => Promise<void>
  clearTransition: () => void
}

const StudioNavigationContext = React.createContext<StudioNavigationContextValue | null>(null)

export function StudioNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [transitionItem, setTransitionItem] = React.useState<HubTransitionItem | null>(null)

  const clearTransition = React.useCallback(() => {
    setTransitionItem(null)
  }, [])

  const openEditor = React.useCallback(
    async (intent: StudioNavigationIntent, item?: HubTransitionItem) => {
      const document = await createDocumentFromHubIntent(intent)
      writeWorkspaceBootstrapSnapshot(document)
      await writeDraftingWorkspaceDraft(document)

      writeStudioSession({
        source: intent.source,
        returnTab: intent.returnTab ?? "create",
        designId: intent.designId,
        templateId: intent.templateId,
        transitionId: intent.transitionId ?? item?.id,
        prompt: intent.prompt,
      })

      if (item) {
        setTransitionItem(item)
      }

      router.push(buildDesktopEditorUrl(intent))
    },
    [router],
  )

  const value = React.useMemo(
    () => ({
      transitionItem,
      openEditor,
      clearTransition,
    }),
    [transitionItem, openEditor, clearTransition],
  )

  return (
    <StudioNavigationContext.Provider value={value}>{children}</StudioNavigationContext.Provider>
  )
}

export function useStudioNavigation() {
  const context = React.useContext(StudioNavigationContext)
  if (!context) {
    throw new Error("useStudioNavigation must be used within StudioNavigationProvider")
  }

  return context
}

export function useStudioNavigationOptional() {
  return React.useContext(StudioNavigationContext)
}
