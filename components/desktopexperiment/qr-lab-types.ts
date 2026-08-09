import type { Dispatch, SetStateAction } from "react"

import type { QrStudioState } from "@/features/qr-code/model/state"

export const QR_LAB_LAYOUTS = ["studio", "gallery", "focus", "split"] as const

export type QrLabLayoutId = (typeof QR_LAB_LAYOUTS)[number]

export type QrLabLayoutDefinition = {
  description: string
  id: QrLabLayoutId
  label: string
}

export const QR_LAB_LAYOUT_DEFINITIONS: QrLabLayoutDefinition[] = [
  { id: "studio", label: "Studio", description: "Settings left, preview centered" },
  { id: "gallery", label: "Gallery", description: "Rail, canvas, settings sheet" },
  { id: "focus", label: "Focus", description: "Wide canvas, floating settings" },
  { id: "split", label: "Split", description: "Balanced two-panel workspace" },
]

export type QrLabControlsProps = {
  setState: Dispatch<SetStateAction<QrStudioState>>
  state: QrStudioState
}
