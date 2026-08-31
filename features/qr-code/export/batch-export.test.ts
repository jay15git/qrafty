// @vitest-environment jsdom

import { strFromU8, unzipSync } from "fflate"
import { afterEach, describe, expect, it, vi } from "vitest"

import { downloadDashboardQrBatchZipExport } from "@/features/qr-code/export/batch-export"

const QR_NODE = {
  id: "dashboard-qr-node",
  name: "QR Code",
  naturalHeight: 320,
  naturalWidth: 320,
  originalSvgMarkup:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" fill="#fff" /></svg>',
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ""
})

describe("dashboard qr batch export", () => {
  it("creates unique filenames for duplicate qr layer names in the zip", async () => {
    let zipBlob: Blob | undefined

    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      zipBlob = blob as Blob
      return "blob:qr-batch"
    })
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)

    await downloadDashboardQrBatchZipExport({
      extension: "svg",
      name: "qrafty",
      nodes: [
        QR_NODE,
        {
          ...QR_NODE,
          id: "dashboard-qr-node-copy",
        },
      ],
      qualityPercent: 100,
    })

    expect(zipBlob).toBeInstanceOf(Blob)

    const zipEntries = unzipSync(new Uint8Array(await zipBlob!.arrayBuffer()))

    expect(Object.keys(zipEntries)).toEqual(["QR Code.svg", "QR Code-2.svg"])
    expect(strFromU8(zipEntries["QR Code.svg"])).toContain("<svg")
    expect(strFromU8(zipEntries["QR Code-2.svg"])).toContain("<svg")
  })
})
