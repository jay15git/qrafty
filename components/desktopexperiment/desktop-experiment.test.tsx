import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@new-qr/qr/react", () => ({
  NewQrCode: () => <div data-slot="new-qr-code" />,
}))

import { QrLabLayouts } from "@/components/desktopexperiment/qr-lab-layouts"
import { QrLabPreview } from "@/components/desktopexperiment/qr-lab-preview"
import { QR_LAB_LAYOUT_DEFINITIONS } from "@/components/desktopexperiment/qr-lab-types"
import { createDefaultQrStudioState } from "@/features/qr-code/model/state"

describe("QR lab experiment", () => {
  it("defines four named development layouts", () => {
    expect(QR_LAB_LAYOUT_DEFINITIONS.map((layout) => layout.id)).toEqual([
      "studio",
      "gallery",
      "focus",
      "split",
    ])
  })

  it("renders a stable preview shell from the default QR state", () => {
    const markup = renderToStaticMarkup(<QrLabPreview state={createDefaultQrStudioState()} />)

    expect(markup).toContain('aria-label="QR code preview"')
    expect(markup).toContain("QR")
    expect(markup).toContain('class="qr-lab-empty-code"')
  })

  it("keeps controls and preview present in every layout composition", () => {
    for (const { id } of QR_LAB_LAYOUT_DEFINITIONS) {
      const markup = renderToStaticMarkup(
        <QrLabLayouts layout={id} controls={<div>Settings</div>} preview={<div>Preview</div>} />,
      )

      expect(markup).toContain("Settings")
      expect(markup).toContain("Preview")
      expect(markup).toContain(`qr-lab-layout-${id}`)
    }
  })
})
