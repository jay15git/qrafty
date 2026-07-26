import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  DESKTOP_INSPECTOR_INPUT_CLASS,
  DesktopInspectorMorphFilterMenu,
  DesktopInspectorNativeSelect,
  DesktopInspectorScrubbableNumberInput,
  DesktopInspectorSearchInput,
  DesktopInspectorSegmentedControl,
  DesktopInspectorTextInput,
} from "@/features/desktop-shell/components/InspectorControls"

describe("desktop inspector controls", () => {
  it("renders shared input and select controls with the desktop inspector class contract", () => {
    const markup = renderToStaticMarkup(
      <div>
        <DesktopInspectorTextInput aria-label="Remote logo URL" />
        <DesktopInspectorNativeSelect
          aria-label="Logo icon category"
          options={[
            { label: "All", value: "all" },
            { label: "Social", value: "social" },
          ]}
          value="all"
          onValueChange={vi.fn()}
        />
        <DesktopInspectorSearchInput aria-label="Search logo icons" value="" onValueChange={vi.fn()} />
      </div>,
    )

    expect(markup).toContain(DESKTOP_INSPECTOR_INPUT_CLASS)
    expect(markup).toContain("desktop-inspector-input-bg")
    expect(markup).toContain('aria-label="Logo icon category"')
    expect(markup).toContain('aria-label="Search logo icons"')
  })

  it("renders paste action on pasteable text inputs", () => {
    const markup = renderToStaticMarkup(
      <DesktopInspectorTextInput
        aria-label="Content URL"
        pasteable
        onPasteValue={vi.fn()}
      />,
    )

    expect(markup).toContain('data-slot="desktop-inspector-paste-action"')
    expect(markup).toContain('data-icon="a"')
    expect(markup).toContain('data-icon="b"')
    expect(markup).toContain('aria-label="Paste from clipboard"')
  })

  it("keeps a stable wrap around pasteable inputs without errors", () => {
    const markup = renderToStaticMarkup(
      <DesktopInspectorTextInput
        aria-label="Content URL"
        pasteable
        onPasteValue={vi.fn()}
      />,
    )

    expect(markup).toContain("t-input-wrap")
    expect(markup).not.toContain("t-error-msg--visible")
  })

  it("renders validation feedback without paste shake styling", () => {
    const markup = renderToStaticMarkup(
      <DesktopInspectorTextInput
        aria-label="Content URL"
        error="Enter a correct profile URL."
        pasteable
        onPasteValue={vi.fn()}
      />,
    )

    expect(markup).toContain("t-input-wrap")
    expect(markup).toContain("Enter a correct profile URL.")
    expect(markup).toContain("t-error-msg--visible")
    expect(markup).not.toContain("is-error")
    expect(markup).not.toContain("is-shaking")
  })

  it("renders segmented controls with tabs-subtle selected state", () => {
    const markup = renderToStaticMarkup(
      <DesktopInspectorSegmentedControl
        ariaLabelPrefix="Use"
        columns={2}
        items={[
          { label: "Solid", value: "solid" },
          { label: "Gradient", value: "gradient" },
        ]}
        value="solid"
        onValueChange={vi.fn()}
      />,
    )

    expect(markup).toContain('aria-selected="true"')
    expect(markup).toContain('role="tablist"')
    expect(markup).toContain('role="tab"')
    expect(markup).not.toContain('aria-pressed="true"')
  })

  it("renders scrubbable number inputs with resize cursor and scrub slot", () => {
    const markup = renderToStaticMarkup(
      <DesktopInspectorScrubbableNumberInput
        aria-label="Width"
        className="h-8 rounded-[6px] px-2"
        min={1}
        value={120}
        onValueChange={vi.fn()}
      />,
    )

    expect(markup).toContain('data-slot="desktop-inspector-scrubbable-number"')
    expect(markup).toContain("cursor-ew-resize")
    expect(markup).toContain("appearance-none")
  })

  it("renders the morph library filter with closed morph markup", () => {
    const markup = renderToStaticMarkup(
      <DesktopInspectorMorphFilterMenu
        ariaLabel="Filter logo icon libraries"
        icon={<span data-slot="filter-icon" />}
        options={[
          { label: "All libraries", value: "all" },
          { label: "Lucide", value: "lucide" },
        ]}
        value="all"
        onValueChange={vi.fn()}
      />,
    )

    expect(markup).toContain('data-slot="desktop-inspector-morph-filter-menu"')
    expect(markup).toContain('class="desktop-inspector-morph-filter')
    expect(markup).toContain('data-open="false"')
    expect(markup).toContain('class="t-morph-menu p-1"')
    expect(markup).toContain('data-slot="desktop-inspector-morph-filter-menu-scroll-area"')
    expect(markup).toContain('role="menu"')
    expect(markup).toContain('role="menuitemradio"')
    expect(markup).toContain('class="t-morph-plus')
    expect(markup).toContain('aria-label="Filter logo icon libraries"')
  })
})
