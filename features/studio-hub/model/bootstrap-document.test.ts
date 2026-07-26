import { describe, expect, it } from "vitest"

import { DEFAULT_QR_INPUT_TYPE } from "@/features/qr-code/content/input-options"
import {
  buildTemplateDocumentSeed,
  createDocumentFromHubIntent,
} from "@/features/studio-hub/model/bootstrap-document"
import { getTemplateById } from "@/features/studio-hub/model/templates"

describe("createDocumentFromHubIntent", () => {
  it("creates a blank default workspace document", async () => {
    const document = await createDocumentFromHubIntent({ source: "blank" })
    expect(document.version).toBe(1)
    expect(document.qrOrder.length).toBeGreaterThan(0)
  })

  it("applies prompt input type and text", async () => {
    const document = await createDocumentFromHubIntent({
      source: "prompt",
      inputType: "link",
      prompt: "https://example.com/promo",
    })

    expect(document.selectedContentType).toBe("link")
    expect(document.contentValuesByType.link?.url).toBe("https://example.com/promo")
  })

  it("clones a template document by id", async () => {
    const template = getTemplateById("minimal-ink")
    expect(template).toBeDefined()

    const document = await createDocumentFromHubIntent({
      source: "template",
      templateId: "minimal-ink",
    })

    expect(document.qrStateByNodeId[document.activeQrNodeId]?.data).toBe(
      template!.document.qrStateByNodeId[template!.document.activeQrNodeId]?.data,
    )
  })
})

describe("buildTemplateDocumentSeed", () => {
  it("builds a document with the requested input type", () => {
    const document = buildTemplateDocumentSeed({
      inputType: "wifi",
      data: "WIFI:T:WPA;S:Test;P:secret;;",
      contentValues: { ssid: "Test", password: "secret", encryption: "WPA" },
    })

    expect(document.selectedContentType).toBe("wifi")
    expect(document.contentValuesByType.wifi?.ssid).toBe("Test")
  })

  it("defaults to the default input type when omitted in blank flow", async () => {
    const document = await createDocumentFromHubIntent({
      source: "prompt",
      inputType: DEFAULT_QR_INPUT_TYPE,
      prompt: "https://example.com/hello",
    })

    expect(document.selectedContentType).toBe(DEFAULT_QR_INPUT_TYPE)
    expect(document.contentValuesByType.link?.url).toBe("https://example.com/hello")
  })
})
