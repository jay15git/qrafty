"use client"

import { NewQrCode } from "@new-qr/qr/react"
import { useSyncExternalStore } from "react"

import { toPortableQrConfig } from "@/features/qr-code/adapters/portable-config"
import type { QrStudioState } from "@/features/qr-code/model/state"

export function QrLabPreview({ state }: { state: QrStudioState }) {
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false)

  return <section className="qr-lab-preview" aria-label="QR code preview">
    <div className="qr-lab-code-stage" style={{ borderRadius: `${Math.max(24, state.backgroundOptions.round)}px` }}>
      {mounted && state.data.trim() ? <NewQrCode {...toPortableQrConfig(state)} className="qr-lab-code" /> : <div className="qr-lab-empty-code">QR</div>}
    </div>
  </section>
}
