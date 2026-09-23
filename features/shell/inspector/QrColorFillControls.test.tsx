// @vitest-environment jsdom

import React, { act, type ComponentProps, type ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { QrColorFillControls } from "@/features/shell/inspector/QrColorFillControls"
import { MobileInspectorDensityContext } from "@/features/shell/inspector/MobileInspectorDensityContext"
import { renderWithJsdomRoot } from "@/test-utils/jsdom-react-root"
import type { Fill } from "@/components/ui/fill-picker/public-api"

vi.mock("@/features/shell/inspector/FillPicker", () => ({
  InspectorFillPicker: ({
    value,
    onValueChange,
    solidOnly,
  }: {
    value: string
    onValueChange: (fill: Fill, css: string) => void
    solidOnly?: boolean
  }) => (
    <input
      aria-label="Pattern color picker"
      data-solid-only={solidOnly}
      data-value={value}
      onChange={(e) =>
        onValueChange(
          { kind: "color", color: { l: 0.5, c: 0.1, h: 250, alpha: 1 } },
          e.target.value,
        )
      }
    />
  ),
}))

vi.mock("@/features/shell/inspector/settings-ui", async (importOriginal) => {
  const React = await import("react")
  const { SettingsFillOptionGrid } = await import(
    "@/features/shell/inspector/SettingsFillOptionGrid"
  )
  const actual =
    await importOriginal<typeof import("@/features/shell/inspector/settings-ui")>()

  const SettingsFillPopover = React.forwardRef(function MockSettingsFillPopover(
    { lockedFillMode }: { lockedFillMode?: string },
    ref: React.Ref<{ openPicker: () => void }>,
  ) {
    const [open, setOpen] = React.useState(false)
    React.useImperativeHandle(ref, () => ({
      openPicker: () => setOpen(true),
    }))
    return (
      <div
        data-open={open}
        data-locked-fill-mode={lockedFillMode}
        data-slot="settings-fill-popover"
      />
    )
  })

  return {
    ...actual,
    SegmentTabs: ({
      items,
      value,
      onChange,
    }: {
      items: (string | { id: string; label: string })[]
      value: string
      onChange: (next: string) => void
    }) => (
      <div role="tablist">
        {items.map((item) => {
          const id = typeof item === "string" ? item : item.id
          const label = typeof item === "string" ? item : item.label
          return (
            <button
              key={id}
              aria-label={label}
              aria-selected={id === value}
              role="tab"
              type="button"
              onClick={() => onChange(id)}
            >
              {label}
            </button>
          )
        })}
      </div>
    ),
    SettingsFillPopover,
    SettingsFillPresetSection: ({
      lockedFillMode,
      presets,
      value,
      onSelect,
    }: {
      lockedFillMode?: string
      presets: readonly string[]
      value: string
      onSelect: (fill: Fill, css: string) => void
    }) => {
      const pickerRef = React.useRef<{ openPicker: () => void }>(null)

      return (
        <>
          <SettingsFillOptionGrid
            presets={presets}
            value={value}
            onOpenPicker={() => pickerRef.current?.openPicker()}
            onSelect={onSelect}
          />
          <SettingsFillPopover ref={pickerRef} lockedFillMode={lockedFillMode} />
        </>
      )
    },
    SettingsTilePopover: ({
      title,
      content,
      children,
    }: {
      title: string
      content: ReactNode
      children: ReactNode
    }) => (
      <>
        {children}
        <div data-slot="pattern-colors-popover" data-title={title}>
          {content}
        </div>
      </>
    ),
  }
})

vi.mock("@/components/ui/select", async () => {
  const React = await import("react")
  const SelectContext = React.createContext<{
    onValueChange?: (value: string) => void
  }>({})

  return {
    Select: ({
      children,
      onValueChange,
    }: {
      children: ReactNode
      onValueChange?: (value: string) => void
    }) => (
      <SelectContext.Provider value={{ onValueChange }}>
        {children}
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ placeholder }: { placeholder?: string }) => (
      <button aria-label="Fill type" type="button">
        {placeholder}
      </button>
    ),
    SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
      const { onValueChange } = React.useContext(SelectContext)
      return (
        <button
          aria-label={value}
          type="button"
          onClick={() => onValueChange?.(value)}
        >
          {children}
        </button>
      )
    },
  }
})

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    className,
    "aria-label": ariaLabel,
    "data-slot": dataSlot,
  }: {
    children: ReactNode
    className?: string
    "aria-label"?: string
    "data-slot"?: string
  }) => (
    <div aria-label={ariaLabel} className={className} data-slot={dataSlot}>
      {children}
    </div>
  ),
}))

import { DOTS_PALETTE_PRESETS } from "@/features/shell/inspector/pattern-palettes"

const AURORA = DOTS_PALETTE_PRESETS[0]
const FIRE = DOTS_PALETTE_PRESETS[1]

function renderColorControls(
  props: Omit<Partial<ComponentProps<typeof QrColorFillControls>>, "onValueChange" | "persistKey">,
) {
  const onValueChange = vi.fn()
  const element = (
    <MobileInspectorDensityContext.Provider value={true}>
      <QrColorFillControls
        moduleCapable={props.moduleCapable ?? true}
        moduleFillMode={props.moduleFillMode ?? "palette"}
        moduleImage={props.moduleImage}
        modulePattern={
          props.modulePattern ?? {
            selectedPalette: AURORA.colors,
            selectedPreset: AURORA.label,
            onSelect: vi.fn(),
            onPaletteColorChange: vi.fn(),
          }
        }
        persistKey="test"
        value={props.value ?? "#67e8f9"}
        onValueChange={onValueChange}
      />
    </MobileInspectorDensityContext.Provider>
  )
  const surface = renderWithJsdomRoot(element)
  return { ...surface, onValueChange }
}

function patternRow(surface: { container: HTMLElement }) {
  // The workspace renders the option grid itself; the mobile drawer renders a rail
  // row inside the shelf, so both carry the group role and label.
  return surface.container.querySelector('[role="group"][aria-label="Pattern options"]')
}

function patternPopover(surface: { container: HTMLElement }) {
  return surface.container.querySelector('[data-slot="pattern-colors-popover"]')
}

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
})

describe("QrColorFillControls Pattern tab", () => {
  it("leads the pattern row with a plus tile that opens a color picker popover", () => {
    const surface = renderColorControls({})
    const row = patternRow(surface)
    const popover = patternPopover(surface)

    expect(row).not.toBeNull()
    expect(popover).not.toBeNull()

    const firstItem = row?.firstElementChild
    expect(firstItem?.tagName).toBe("BUTTON")
    expect(firstItem?.getAttribute("aria-label")).toBe("Edit pattern colors")

    expect(popover?.getAttribute("data-title")).toBe("Pattern colors")
    expect(popover?.querySelector('[data-slot="palette-color-stop-list"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="pattern-color-grid"]')).toBeNull()
    expect(surface.container.querySelector('button[aria-label="Custom fill"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="settings-fill-popover"]')).toBeNull()

    const editButtons = popover?.querySelectorAll('button[aria-label^="Edit color "]')
    expect(editButtons?.length).toBe(AURORA.colors.length)
    expect(editButtons?.[0]?.getAttribute("aria-pressed")).toBe("true")

    const picker = popover?.querySelector<HTMLInputElement>(
      'input[aria-label="Pattern color picker"]',
    )
    expect(picker).not.toBeNull()
    expect(picker?.dataset.value).toBe(AURORA.colors[0])
    expect(picker?.dataset.solidOnly).toBe("true")
  })

  it("switches the popover picker between palette colors", () => {
    const surface = renderColorControls({})
    const popover = patternPopover(surface)

    act(() => {
      popover
        ?.querySelectorAll('button[aria-label^="Edit color "]')[2]
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const buttons = popover?.querySelectorAll('button[aria-label^="Edit color "]')
    expect(buttons?.[0]?.getAttribute("aria-pressed")).toBe("false")
    expect(buttons?.[2]?.getAttribute("aria-pressed")).toBe("true")

    const picker = popover?.querySelector<HTMLInputElement>(
      'input[aria-label="Pattern color picker"]',
    )
    expect(picker?.dataset.value).toBe(AURORA.colors[2])
  })

  it("edits the selected palette color without touching presets or generic fill", () => {
    const onPaletteColorChange = vi.fn()
    const onSelect = vi.fn()
    const surface = renderColorControls({
      modulePattern: {
        selectedPalette: AURORA.colors,
        selectedPreset: AURORA.label,
        onSelect,
        onPaletteColorChange,
      },
    })
    const popover = patternPopover(surface)

    act(() => {
      popover
        ?.querySelectorAll('button[aria-label^="Edit color "]')[1]
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const picker = popover?.querySelector<HTMLInputElement>(
      'input[aria-label="Pattern color picker"]',
    )

    act(() => {
      if (picker) {
        const setValue = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set
        setValue?.call(picker, "#112233")
        picker.dispatchEvent(new Event("input", { bubbles: true }))
      }
    })

    expect(onPaletteColorChange).toHaveBeenCalledTimes(1)
    const call = onPaletteColorChange.mock.calls[0]
    expect(call?.[0]).toBe(1)
    expect(typeof call?.[1]).toBe("string")
    expect(onSelect).not.toHaveBeenCalled()
    expect(surface.onValueChange).not.toHaveBeenCalled()
  })

  it("selects a different preset and updates the popover palette", () => {
    const onSelect = vi.fn()
    const surface = renderColorControls({
      modulePattern: {
        selectedPalette: AURORA.colors,
        selectedPreset: AURORA.label,
        onSelect,
        onPaletteColorChange: vi.fn(),
      },
    })

    const fireButton = surface.container.querySelector<HTMLButtonElement>(
      '[aria-label="Use Fire pattern"]',
    )
    expect(fireButton).not.toBeNull()

    act(() => {
      fireButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onSelect).toHaveBeenCalledWith(FIRE)

    surface.rerender(
      <MobileInspectorDensityContext.Provider value={true}>
        <QrColorFillControls
          moduleCapable
          moduleFillMode="palette"
          modulePattern={{
            selectedPalette: FIRE.colors,
            selectedPreset: FIRE.label,
            onSelect,
            onPaletteColorChange: vi.fn(),
          }}
          persistKey="test"
          value="#f97316"
          onValueChange={vi.fn()}
        />
      </MobileInspectorDensityContext.Provider>,
    )

    const fireTile = surface.container.querySelector<HTMLButtonElement>(
      '[aria-label="Use Fire pattern"]',
    )
    expect(fireTile?.getAttribute("aria-pressed")).toBe("true")

    const picker = patternPopover(surface)?.querySelector<HTMLInputElement>(
      'input[aria-label="Pattern color picker"]',
    )
    expect(picker?.dataset.value).toBe(FIRE.colors[0])
  })

  it("renders every palette entry in the popover without truncation", () => {
    const palette = ["#111111", "#222222", "#111111", "#333333", "#444444"]
    const surface = renderColorControls({
      modulePattern: {
        selectedPalette: palette,
        selectedPreset: "custom",
        onSelect: vi.fn(),
        onPaletteColorChange: vi.fn(),
      },
    })

    const editButtons = patternPopover(surface)?.querySelectorAll(
      'button[aria-label^="Edit color "]',
    )
    expect(editButtons?.length).toBe(palette.length)
  })
})

describe("QrColorFillControls Solid/Gradient/Image tabs", () => {
  it.each(["solid", "gradient"] as const)("keeps the custom fill picker for %s", (mode) => {
    const surface = renderColorControls({ moduleFillMode: mode })

    const plus = surface.container.querySelector('button[aria-label="Custom fill"]')
    const popover = surface.container.querySelector('[data-slot="settings-fill-popover"]')

    expect(plus).not.toBeNull()
    expect(popover).not.toBeNull()
    expect(popover?.getAttribute("data-locked-fill-mode")).toBe(mode)

    act(() => {
      plus?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(
      surface.container.querySelector('[data-slot="settings-fill-popover"][data-open="true"]'),
    ).not.toBeNull()
  })

  it("switches to Pattern from Gradient and shows the plus tile popover", () => {
    const surface = renderColorControls({
      moduleFillMode: "gradient",
      modulePattern: {
        selectedPalette: AURORA.colors,
        selectedPreset: AURORA.label,
        onSelect: vi.fn(),
        onPaletteColorChange: vi.fn(),
      },
    })

    expect(surface.container.querySelector('[data-slot="pattern-colors-popover"]')).toBeNull()

    const patternTab = surface.container.querySelector<HTMLButtonElement>('[aria-label="Pattern"]')
    act(() => {
      patternTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(patternRow(surface)?.firstElementChild?.getAttribute("aria-label")).toBe(
      "Edit pattern colors",
    )
    expect(patternPopover(surface)).not.toBeNull()
  })

  it("does not show pattern colors or legacy picker for the Image tab", () => {
    const surface = renderColorControls({
      moduleFillMode: "image",
      moduleImage: {
        imageUrl: "",
        onUpload: vi.fn(),
        onClear: vi.fn(),
      },
    })

    expect(surface.container.querySelector('[data-slot="pattern-colors-popover"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="settings-fill-popover"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="image-option-grid"]')).not.toBeNull()
  })

  it("hides Pattern and Image tabs for non-module-capable parts", () => {
    const surface = renderColorControls({ moduleCapable: false, moduleFillMode: "solid" })

    expect(surface.container.querySelector('[aria-label="Pattern"]')).toBeNull()
    expect(surface.container.querySelector('[aria-label="Image"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="pattern-colors-popover"]')).toBeNull()
  })
})

describe("QrColorFillControls desktop accordion", () => {
  it("keeps per-swatch pattern pickers and no plus tiles outside the drawer", () => {
    const surface = renderWithJsdomRoot(
      <QrColorFillControls
        moduleCapable
        moduleFillMode="palette"
        modulePattern={{
          selectedPalette: AURORA.colors,
          selectedPreset: AURORA.label,
          onSelect: vi.fn(),
          onPaletteColorChange: vi.fn(),
        }}
        persistKey="test"
        value="#67e8f9"
        onValueChange={vi.fn()}
      />,
    )

    expect(surface.container.querySelector('[aria-label="Edit pattern colors"]')).toBeNull()
    expect(
      surface.container.querySelectorAll('[aria-label^="Edit color "]').length,
    ).toBe(AURORA.colors.length)
    expect(surface.container.querySelector('button[aria-label="Custom fill"]')).toBeNull()
  })
})
