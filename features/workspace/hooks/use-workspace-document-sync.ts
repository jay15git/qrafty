"use client"

import { useEffect } from "react"

import { designDocumentFromWorkspacePane } from "@/features/workspace/model/design-document"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import { useWorkspaceCanvasStore } from "@/features/workspace/model/workspace-canvas-store"

export function useWorkspaceDocumentSync({
  activeNodeId,
  document,
  height,
  width,
}: {
  activeNodeId: string
  document: DraftingWorkspaceDocumentV1
  height: number
  width: number
}) {
  const setDocument = useWorkspaceCanvasStore((state) => state.setDocument)

  useEffect(() => {
    const designDocument = designDocumentFromWorkspacePane({
      document,
      nodeId: activeNodeId,
      height,
      width,
    })

    setDocument(designDocument)
  }, [activeNodeId, document, height, setDocument, width])
}
