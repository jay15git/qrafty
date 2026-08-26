"use client"

import { useEffect } from "react"

import { previewDrawerResize } from "@/features/workspace/preview/preview-drawer-resize"

const INSET_PADDING_PROPERTIES = new Set(["padding", "padding-bottom"])

export function MobileWorkspaceInsetTransitionBridge() {
  useEffect(() => {
    const inset = document.querySelector<HTMLElement>(
      '[data-slot="drafting-workspace-inset"]',
    )

    if (!inset) {
      return
    }

    function handleTransitionEnd(event: TransitionEvent) {
      if (event.target !== inset) {
        return
      }

      if (!INSET_PADDING_PROPERTIES.has(event.propertyName)) {
        return
      }

      previewDrawerResize.endResize()
    }

    inset.addEventListener("transitionend", handleTransitionEnd)

    return () => {
      inset.removeEventListener("transitionend", handleTransitionEnd)
    }
  }, [])

  return null
}
