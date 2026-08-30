import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { StylePreview } from "@/features/qr-code/components/StylePreview"
import { getModuleStylePreviewViewBox } from "@/features/qr-code/styles/style-preview"

describe("StylePreview", () => {
  it("renders module previews from a synthetic art-directed module grid", () => {
    const markup = renderToStaticMarkup(
      <StylePreview previewKind="dots" value="circuit-board" />,
    )

    expect(markup).toContain('data-slot="style-preview-fragment"')
    expect(markup).toContain('data-preview-kind="dots"')
    expect(markup).toContain('data-preview-style="circuit-board"')
    expect(markup).toContain('data-preview-renderer="synthetic-grid"')
    expect(markup).toContain(`viewBox="${getModuleStylePreviewViewBox()}"`)
    expect(markup).toContain('data-testid="data-modules"')
  })

  it("renders custom dot previews through the real qr renderer", () => {
    const diamondMarkup = renderToStaticMarkup(
      <StylePreview previewKind="dots" value="diamond" />,
    )
    const heartMarkup = renderToStaticMarkup(
      <StylePreview previewKind="dots" value="heart" />,
    )

    expect(diamondMarkup).toContain('data-preview-style="diamond"')
    expect(diamondMarkup).toContain('data-testid="data-modules"')
    expect(heartMarkup).toContain('data-preview-style="heart"')
    expect(heartMarkup).toContain('data-testid="data-modules"')
  })

  it("renders corner-dot previews from a real qr code, cropped to the inner finder dot", () => {
    const circleMarkup = renderToStaticMarkup(
      <StylePreview previewKind="corner-dot" value="circle" />,
    )
    const leafMarkup = renderToStaticMarkup(
      <StylePreview previewKind="corner-dot" value="leaf" />,
    )
    const squareMarkup = renderToStaticMarkup(
      <StylePreview previewKind="corner-dot" value="square" />,
    )

    for (const markup of [circleMarkup, leafMarkup, squareMarkup]) {
      expect(markup).toContain('data-slot="style-preview-corner-dot"')
      expect(markup).toContain('data-corner-dot-renderer="real-qr"')
      expect(markup).toContain('viewBox="1.65 1.65 3.7 3.7"')
      expect(markup).not.toContain('data-slot="style-preview-icon"')
      expect(markup).toContain('data-testid="finder-patterns-inner"')
      expect(markup).toContain('fill="transparent"')
      expect(markup).toContain('data-testid="finder-patterns-outer"')
    }

    expect(circleMarkup).toContain("<rect")
    expect(leafMarkup).toContain("<path")
    expect(circleMarkup).not.toBe(leafMarkup)
    expect(leafMarkup).not.toBe(squareMarkup)
  })

  it("renders custom corner-dot previews at the inner finder origin", () => {
    const markup = renderToStaticMarkup(
      <StylePreview previewKind="corner-dot" value="orbit-weave" />,
    )

    expect(markup).toContain('data-slot="style-preview-corner-dot"')
    expect(markup).toContain('data-corner-dot-renderer="custom-path"')
    expect(markup).toContain('viewBox="1.65 1.65 3.7 3.7"')
    expect(markup).toContain('transform="translate(2.12')
    expect(markup).toContain("M 228 0")
  })

  it("renders corner-square previews from a real qr code, cropped to the top-left finder", () => {
    const roundedMarkup = renderToStaticMarkup(
      <StylePreview previewKind="corner-square" value="rounded-lg" />,
    )
    const leafMarkup = renderToStaticMarkup(
      <StylePreview previewKind="corner-square" value="leaf" />,
    )
    const circleMarkup = renderToStaticMarkup(
      <StylePreview previewKind="corner-square" value="circle" />,
    )

    for (const markup of [roundedMarkup, leafMarkup, circleMarkup]) {
      expect(markup).toContain('data-slot="style-preview-corner-square"')
      expect(markup).toContain('data-corner-frame-renderer="real-qr"')
      expect(markup).toContain('viewBox="0 0 7 7"')
      expect(markup).not.toContain('data-slot="style-preview-icon"')
      expect(markup).toContain('data-testid="finder-patterns-outer"')
      expect(markup).not.toContain('style-preview-corner-square-grid')
      expect(markup).not.toContain('style-preview-corner-square-frame')
    }

    expect(leafMarkup).toContain("<path")
    expect(circleMarkup).toContain("<path")
    expect(roundedMarkup).not.toBe(leafMarkup)
    expect(leafMarkup).not.toBe(circleMarkup)
  })
})
