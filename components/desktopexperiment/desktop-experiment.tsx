"use client"

import { useState } from "react"

import { QrLabControls } from "@/components/desktopexperiment/qr-lab-controls"
import { QrLabHeader } from "@/components/desktopexperiment/qr-lab-header"
import { QrLabLayouts } from "@/components/desktopexperiment/qr-lab-layouts"
import { QrLabPreview } from "@/components/desktopexperiment/qr-lab-preview"
import type { QrLabLayoutId } from "@/components/desktopexperiment/qr-lab-types"
import { createDefaultQrStudioState } from "@/features/qr-code/model/state"

import "./desktop-experiment.css"

export function DesktopExperiment() {
  const [state, setState] = useState(createDefaultQrStudioState)
  const [activeLayout, setActiveLayout] = useState<QrLabLayoutId>("studio")

  return (
    <main className="qr-lab-root" data-layout={activeLayout}>
      <QrLabHeader activeLayout={activeLayout} onLayoutChange={setActiveLayout} onReset={() => setState(createDefaultQrStudioState())} />
      <QrLabLayouts
        controls={<QrLabControls setState={setState} state={state} />}
        layout={activeLayout}
        preview={<QrLabPreview state={state} />}
      />
    </main>
  )
}
