import type { ReactNode } from "react"

import type { QrLabLayoutId } from "@/components/desktopexperiment/qr-lab-types"

export function QrLabLayouts({ controls, layout, preview }: { controls: ReactNode; layout: QrLabLayoutId; preview: ReactNode }) {
  return <div className={`qr-lab-layout qr-lab-layout-${layout}`}><div className="qr-lab-canvas">{preview}</div>{controls}</div>
}
