"use client"

import { useState } from "react"
import { ArrowCounterClockwiseIcon, CaretDownIcon, QrCodeIcon } from "@phosphor-icons/react"

import { QR_LAB_LAYOUT_DEFINITIONS, type QrLabLayoutId } from "@/components/desktopexperiment/qr-lab-types"

export function QrLabHeader({ activeLayout, onLayoutChange, onReset }: { activeLayout: QrLabLayoutId; onLayoutChange: (layout: QrLabLayoutId) => void; onReset: () => void }) {
  const [open, setOpen] = useState(false)

  return <header className="qr-lab-header">
    <span className="qr-lab-wordmark"><QrCodeIcon size={17} weight="bold" /> QR Lab</span>
    <div className="qr-lab-header-actions">
      <button className="qr-lab-icon-button" type="button" aria-label="Reset QR code" onClick={onReset}><ArrowCounterClockwiseIcon size={18} /></button>
      <div className="qr-lab-layout-menu">
        <button aria-expanded={open} aria-haspopup="menu" className="qr-lab-dev-button" type="button" onClick={() => setOpen((value) => !value)}>Layouts <CaretDownIcon size={14} /></button>
        {open ? <div className="qr-lab-menu" role="menu" aria-label="Development layouts">{QR_LAB_LAYOUT_DEFINITIONS.map((layout) => <button aria-current={layout.id === activeLayout ? "true" : undefined} className="qr-lab-menu-item" key={layout.id} role="menuitem" type="button" onClick={() => { onLayoutChange(layout.id); setOpen(false) }}>{layout.label}</button>)}</div> : null}
      </div>
    </div>
  </header>
}
