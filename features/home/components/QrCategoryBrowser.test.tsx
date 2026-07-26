import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import "@/test-utils/mock-framer-motion"

import {
  DEFAULT_QR_INPUT_TYPE,
  getNextOpenQrCategory,
} from "@/features/qr-code/content/input-options"
import { QrCategoryBrowser } from "./QrCategoryBrowser"

describe("qr category browser", () => {
  it("renders all category triggers with all menus collapsed initially", () => {
    const markup = renderToStaticMarkup(
      <QrCategoryBrowser activeInputType={DEFAULT_QR_INPUT_TYPE} onInputTypeChange={() => {}} />
    )

    expect(markup).toContain('data-testid="qr-category-browser"')
    expect(markup).toContain(">Popular<")
    expect(markup).toContain(">Contact<")
    expect(markup).toContain(">More<")

    expect(markup).not.toContain(">Socials<")
    expect(markup).not.toContain(">Business<")
    expect(markup).not.toContain(">Content<")
    expect(markup).not.toContain(">Discord<")
    expect(markup).not.toContain(">Google Review<")
    expect(markup).not.toContain(">PDF<")
  })

  it("renders only the active category menu", () => {
    const moreMarkup = renderToStaticMarkup(
      <QrCategoryBrowser
        activeInputType={DEFAULT_QR_INPUT_TYPE}
        onInputTypeChange={() => {}}
        openCategory="more"
      />
    )

    expect(moreMarkup.match(/aria-expanded="true"/g)?.length ?? 0).toBe(1)
    expect(moreMarkup).toContain(">More<")
    expect(moreMarkup).toContain('data-state="open"')

    const contactMarkup = renderToStaticMarkup(
      <QrCategoryBrowser
        activeInputType={DEFAULT_QR_INPUT_TYPE}
        onInputTypeChange={() => {}}
        openCategory="contact"
      />
    )

    expect(contactMarkup.match(/aria-expanded="true"/g)?.length ?? 0).toBe(1)
    expect(contactMarkup).toContain(">Contact<")
    expect(contactMarkup).toContain('data-state="open"')
  })

  it("toggles one category open at a time", () => {
    expect(getNextOpenQrCategory(null, "more")).toBe("more")
    expect(getNextOpenQrCategory("more", "more")).toBeNull()
    expect(getNextOpenQrCategory("more", "contact")).toBe("contact")
  })
})
