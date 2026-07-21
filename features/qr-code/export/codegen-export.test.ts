// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { buildCodegenExportFromWorkspace } from "@/features/qr-code/export/codegen-export"
import { createDefaultDraftingWorkspaceDocument } from "@/features/workspace/model/document"

describe("workspace codegen export", () => {
  it("copies svg code with real qr data modules and no runtime package dependency", async () => {
    const result = await buildCodegenExportFromWorkspace({
      document: createDefaultDraftingWorkspaceDocument(),
      target: { format: "svg" },
    })
    const document = new DOMParser().parseFromString(result.code, "image/svg+xml")
    const dataModules = document.querySelector('[data-testid="data-modules"]')

    expect(result.manifest.installCommand).toBe("")
    expect(document.querySelector("parsererror")).toBeNull()
    expect(dataModules?.tagName.toLowerCase()).toBe("path")
    expect((dataModules?.getAttribute("d") ?? "").length).toBeGreaterThan(1000)
  })
})
