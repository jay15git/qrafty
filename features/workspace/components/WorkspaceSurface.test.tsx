// @vitest-environment jsdom

import { readFileSync } from "node:fs"
import {
  act,
  cloneElement,
  createContext,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useContext,
  useState,
} from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const buildDashboardQrNodePayloadSpy = vi.fn(() => new Promise(() => undefined))
const downloadDashboardQrBatchZipExportSpy = vi.fn(() => Promise.resolve())
const downloadDashboardQrNodeExportSpy = vi.fn(() => Promise.resolve())
const downloadDashboardRasterExportSpy = vi.fn(() => Promise.resolve())
const measureDashboardRasterExportSpy = vi.fn(() =>
  Promise.resolve({
    blobSizeBytes: 182000,
    extension: "png" as const,
    height: 1280,
    qualityPercent: 100,
    width: 1280,
  }),
)

vi.mock("@/features/qr-code/rendering/qr-svg", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/qr-code/rendering/qr-svg")>()

  return {
    ...actual,
    buildDashboardQrNodePayload: (...args: Parameters<typeof buildDashboardQrNodePayloadSpy>) =>
      buildDashboardQrNodePayloadSpy(...args),
  }
})

vi.mock("@/features/qr-code/export/batch-export", () => ({
  downloadDashboardQrBatchZipExport: (
    ...args: Parameters<typeof downloadDashboardQrBatchZipExportSpy>
  ) => downloadDashboardQrBatchZipExportSpy(...args),
  downloadDashboardQrNodeExport: (
    ...args: Parameters<typeof downloadDashboardQrNodeExportSpy>
  ) => downloadDashboardQrNodeExportSpy(...args),
}))

vi.mock("@/features/qr-code/export/raster-export", () => ({
  downloadDashboardRasterExport: (
    ...args: Parameters<typeof downloadDashboardRasterExportSpy>
  ) => downloadDashboardRasterExportSpy(...args),
  formatDashboardExportFileSize: (bytes: number) => `${bytes} B`,
  isRasterExportExtension: (extension: string) => extension !== "svg",
  measureDashboardRasterExport: (
    ...args: Parameters<typeof measureDashboardRasterExportSpy>
  ) => measureDashboardRasterExportSpy(...args),
}))

type PopoverContextValue = {
  open: boolean
  setOpen: (value: boolean) => void
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

vi.mock("@/components/ui/popover", () => ({
  Popover: ({
    children,
    open,
    onOpenChange,
  }: {
    children: ReactNode
    open?: boolean
    onOpenChange?: (value: boolean) => void
  }) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const actualOpen = open ?? internalOpen
    const setOpen = onOpenChange ?? setInternalOpen

    return (
      <PopoverContext.Provider value={{ open: actualOpen, setOpen }}>
        <div data-slot="popover">{children}</div>
      </PopoverContext.Provider>
    )
  },
  PopoverContent: ({ children, ...props }: { children: ReactNode }) => {
    const context = useContext(PopoverContext)

    if (!context?.open) {
      return null
    }

    return <div {...props}>{children}</div>
  },
  PopoverTrigger: ({ children }: { children: ReactNode }) => {
    const context = useContext(PopoverContext)

    if (!isValidElement(children)) {
      return children
    }

    const element = children as ReactElement<{ onClick?: (event: unknown) => void }>
    const originalOnClick = element.props.onClick

    return cloneElement(element, {
      onClick: (event: unknown) => {
        originalOnClick?.(event)
        context?.setOpen(!context.open)
      },
    })
  },
}))

vi.mock("@/components/vendor/unlumen-ui/slider", () => ({
  Slider: ({
    "aria-label": ariaLabel,
    formatValue,
    label,
    appearance,
    disabled,
    max,
    min,
    onChange,
    showValue = true,
    step,
    value,
    "data-slot": dataSlot,
  }: {
    "aria-label"?: string
    "data-slot"?: string
    appearance?: string
    formatValue?: (value: number) => string
    label?: string
    disabled?: boolean
    max?: number
    min?: number
    onChange?: (value: number | [number, number]) => void
    showValue?: boolean
    step?: number
    value?: number | number[]
  }) => (
    <div data-slot={dataSlot} data-appearance={appearance}>
      {label && showValue ? (
        <span>
          {label}
          {formatValue
            ? `: ${formatValue(Array.isArray(value) ? (value[0] ?? 0) : (value ?? 0))}`
            : null}
        </span>
      ) : null}
      <input
        aria-label={ariaLabel}
        disabled={disabled}
        max={max}
        min={min}
        step={step}
        type="range"
        value={Array.isArray(value) ? (value[0] ?? min ?? 0) : (value ?? min ?? 0)}
        onChange={(event) => {
          onChange?.(Number(event.currentTarget.value))
        }}
      />
    </div>
  ),
}))

import { WorkspaceSurface } from "@/features/workspace/components/WorkspaceSurface"
import { FloatingToolbar } from "@/features/desktop-shell/components/FloatingToolbar"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import { createDraftingPaperShaderThumbnailCacheKey } from "@/features/workspace/components/PaperShaderOptionPreview"
import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"
import { createDefaultQrStudioState, type QrStudioState } from "@/features/qr-code/model/state"

const QR_PAYLOAD = {
  markup:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" fill="#fff" /><path d="M20 20h40v40H20z" fill="#111" /></svg>',
  naturalHeight: 320,
  naturalWidth: 320,
}

const cleanupCallbacks: Array<() => void> = []

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: createMemoryStorage(),
  })
  buildDashboardQrNodePayloadSpy.mockClear()
  buildDashboardQrNodePayloadSpy.mockImplementation(() => new Promise(() => undefined))
  downloadDashboardQrBatchZipExportSpy.mockClear()
  downloadDashboardQrNodeExportSpy.mockClear()
  downloadDashboardRasterExportSpy.mockClear()
  measureDashboardRasterExportSpy.mockClear()
  measureDashboardRasterExportSpy.mockImplementation(() =>
    Promise.resolve({
      blobSizeBytes: 182000,
      extension: "png",
      height: 1280,
      qualityPercent: 100,
      width: 1280,
    }),
  )
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  )
})

afterEach(() => {
  for (const cleanup of cleanupCallbacks.splice(0)) {
    cleanup()
  }

  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
})

describe("WorkspaceSurface", () => {
  it("builds distinct shader thumbnail cache keys when shader inputs change", () => {
    const meshGradient = createDefaultDraftingCardPaperShader("mesh-gradient")
    const warp = createDefaultDraftingCardPaperShader("warp")
    const laterFrame = {
      ...meshGradient,
      frame: meshGradient.frame + 1,
    }

    expect(createDraftingPaperShaderThumbnailCacheKey(meshGradient)).not.toBe(
      createDraftingPaperShaderThumbnailCacheKey(warp),
    )
    expect(createDraftingPaperShaderThumbnailCacheKey(meshGradient)).not.toBe(
      createDraftingPaperShaderThumbnailCacheKey(laterFrame),
    )
  })

  it("renders the framed layout with compact QR anatomy tools and stacked inspector", () => {
    const surface = renderSurface()
    const header = getRequiredElement(surface.container, '[data-slot="drafting-header"]')
    const headerContent = getRequiredElement(header, "div")

    expect(surface.container.querySelector('[data-slot="drafting-surface"]')).not.toBeNull()
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').className,
    ).toContain("bg-[var(--drafting-surface-bg)]")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').className,
    ).not.toContain("lg:border-[var(--drafting-line-hover)]")
    expect(header).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-nav"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-scroll-area"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-workspace"]')).not.toBeNull()
    expect(
      surface.container.querySelector('[data-slot="drafting-workspace-inset"]'),
    ).not.toBeNull()
    expect(
      surface.container.querySelector('[data-slot="drafting-workspace-inset"]')?.className,
    ).toContain("p-0")
    expect(
      surface.container.querySelector('[data-slot="drafting-workspace-inset"]')?.className,
    ).not.toContain("lg:p-6")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').className,
    ).toContain("h-dvh")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').className,
    ).toContain("[--new-mobile-rail-height:5.75rem]")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-content-grid"]').className,
    ).toContain("grid-rows-[minmax(0,1fr)_var(--new-mobile-rail-height)]")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-content-grid"]').className,
    ).toContain(
      "lg:grid-cols-[var(--new-left-rail-width)_var(--new-middle-rail-width)_minmax(0,1fr)]",
    )
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-content-grid"]').className,
    ).toContain("lg:grid-rows-1")
    expect(surface.container.querySelector('[data-slot="dashboard-compose-surface"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-compose-canvas"]')).not.toBeNull()
    expect(
      surface.container
        .querySelector('[data-slot="dashboard-compose-surface"]')
        ?.className,
    ).not.toContain("ring-2 ring-inset ring-[var(--drafting-ink)]")
    expect(
      surface.container
        .querySelector('[data-slot="dashboard-compose-canvas"]')
        ?.className,
    ).not.toContain("shadow-[0_24px_48px_rgba(15,23,42,0.18)]")
    expect(
      surface.container
        .querySelector('[data-slot="dashboard-compose-toolbar"]')
        ?.getAttribute("data-toolbar-appearance"),
    ).toBe("neutral")
    expect(surface.container.textContent).not.toContain("Edit mode")
    expect(surface.container.querySelector('button[aria-label="Toggle edit mode"]')).toBeNull()
    expect(
      surface.container
        .querySelector('[data-slot="dashboard-compose-canvas"]')
        ?.getAttribute("data-compose-mode"),
    ).toBe("compose")
    expect(
      surface.container.querySelector('[data-slot="dashboard-compose-document-guides"]'),
    ).toBeNull()
    expect(
      surface.container.querySelector('[data-slot="dashboard-compose-toolbar"] button[aria-label="Reset defaults"]'),
    ).toBeNull()
    expect(surface.container.querySelectorAll('[data-slot="drafting-plus-marker"]')).toHaveLength(10)
    expect(
      surface.container.querySelector('[data-slot="drafting-plus-marker"]')?.getAttribute("class"),
    ).toContain("hidden")
    expect(
      surface.container.querySelector('[data-slot="drafting-plus-marker"]')?.getAttribute("class"),
    ).toContain("lg:block")
    expect(
      surface.container.querySelector('[data-slot="drafting-plus-marker"]')?.getAttribute("class"),
    ).toContain("text-[var(--drafting-ink-muted)]")
    expect(
      surface.container.querySelector('[data-slot="drafting-plus-marker"]')?.getAttribute("class"),
    ).not.toContain("text-black/")
    expect(surface.container.querySelectorAll('[data-drafting-tool-button="true"]')).toHaveLength(13)
    expect(surface.container.querySelector('[data-slot="tabs"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()
    expect(
      surface.container.querySelector('button[aria-label="Open QR type options"]'),
    ).not.toBeNull()
    expect(surface.container.textContent).toContain("QR Type:")
    expect(surface.container.textContent).toContain("Content")
    expect(surface.container.querySelector('button[aria-label="Open Card"]')).toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Text"]')).not.toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Image"]')).not.toBeNull()
    expect(surface.container.textContent).toContain("Pattern")
    expect(surface.container.textContent).toContain("Corners")
    expect(surface.container.textContent).toContain("Shape")
    expect(surface.container.textContent).toContain("Logo")
    expect(surface.container.textContent).toContain("Motion")
    expect(surface.container.textContent).toContain("Encoding")
    expect(surface.container.textContent).toContain("Layers")
    expect(surface.container.querySelector('button[aria-label="Open Export"]')).not.toBeNull()
    expect(headerContent.className).toContain("justify-end")
    expect(header.querySelector('[data-slot="drafting-card-only-toggle"]')).toBeNull()
    expect(header.innerHTML).toContain('data-slot="switch"')
    expect(header.innerHTML).toContain('data-slot="drafting-download-trigger"')
    expect(getRequiredElement(header, '[data-slot="switch"]').className).not.toContain(
      "bg-[var(--drafting-panel-bg)]",
    )
    expect(getRequiredElement(header, '[data-slot="switch"]').className).not.toContain(
      "shadow-[var(--drafting-shadow-rest)]",
    )
    expect(surface.container.textContent).not.toContain("Appearance")
    expect(surface.container.innerHTML).toContain('aria-label="Toggle dark mode"')
    expect(surface.container.innerHTML).not.toMatch(
      /dark:[^"]*shadow-\[[^\]]*rgba\(255,255,255/,
    )
  })

  it(
    "renders the header download control to the right of the dark mode switch with compact format cards",
    () => {
    const surface = renderSurface()
    const actions = getRequiredElement(
      surface.container,
      '[data-slot="drafting-header-actions"]',
    )
    const svgExportInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Export SVG"]',
    ) as HTMLInputElement
    const pngExportInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Export PNG"]',
    ) as HTMLInputElement
    const jpegExportInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Export JPEG"]',
    ) as HTMLInputElement
    const webpExportInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Export WEBP"]',
    ) as HTMLInputElement

    expect(actions.firstElementChild?.getAttribute("data-slot")).toBe("popover")
    expect(actions.children.item(1)?.getAttribute("data-slot")).toBe("switch")
    expect(actions.querySelector('[data-slot="drafting-shortcuts-trigger"]')).not.toBeNull()
    expect(actions.querySelector('[data-slot="drafting-download-trigger"]')).not.toBeNull()
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-download-format-grid"]')
        .querySelectorAll('[data-slot="option-card"]').length,
    ).toBe(4)
    expect(svgExportInput.checked).toBe(false)
    expect(pngExportInput.checked).toBe(true)
    expect(jpegExportInput.checked).toBe(false)
    expect(webpExportInput.checked).toBe(false)
    expect(surface.container.textContent).toContain("Download PNG")
    expect(surface.container.textContent).toContain("Web & social")
    expect(surface.container.textContent).toContain("1024 x 1024 px")
    expect(surface.container.textContent).toContain("Current QR")
    expect(surface.container.textContent).not.toContain("Vector master")
    expect(surface.container.textContent).not.toContain("Raster export")
    },
    15000,
  )

  it("opens a header keyboard shortcuts popover before the theme toggle", () => {
    const surface = renderSurface({ openDownloadPopover: false })
    const actions = getRequiredElement(
      surface.container,
      '[data-slot="drafting-header-actions"]',
    )
    const shortcutsWrapper = actions.children.item(0)
    const shortcutsTrigger = getRequiredElement(
      actions,
      'button[aria-label="Open keyboard shortcuts"]',
    )

    expect(shortcutsWrapper?.contains(shortcutsTrigger)).toBe(true)
    expect(actions.children.item(1)?.getAttribute("data-slot")).toBe("switch")
    expect(surface.container.querySelector('[data-slot="drafting-shortcuts-popover"]')).toBeNull()

    act(() => {
      activateElement(shortcutsTrigger)
    })

    const popover = getRequiredElement(
      surface.container,
      '[data-slot="drafting-shortcuts-popover"]',
    )

    expect(popover.textContent).toContain("Shortcuts")
    expect(popover.textContent).toContain("Arrow keys")
    expect(popover.textContent).toContain("Nudge selected layer 1px")
    expect(popover.textContent).toContain("Cmd/Ctrl + C")
    expect(popover.textContent).toContain("Copy selected layers")
    expect(popover.textContent).toContain("Delete / Backspace")
    expect(popover.textContent).toContain("Delete selected layers")
    expect(popover.textContent).toContain("Cmd/Ctrl + A")
    expect(popover.textContent).toContain("Select all visible unlocked layers")
    expect(popover.textContent).toContain("Esc")
    expect(popover.textContent).toContain("Clear selection")
    expect(popover.textContent).toContain("Cmd/Ctrl + Shift + G")
    expect(popover.textContent).toContain("Ungroup selected groups")
    expect(popover.textContent).toContain("Cmd/Ctrl + Shift + H")
    expect(popover.textContent).toContain("Hide/show selected layers")
  })

  it("keeps the rail QR-first and exposes Add tools without legacy frame/card labels", () => {
    const surface = renderSurface()

    expect(surface.container.querySelector('[data-slot="drafting-card-only-toggle"]')).toBeNull()
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-card-only-mode",
      ),
    ).toBeNull()
    expect(surface.container.querySelectorAll('[data-drafting-tool-button="true"]')).toHaveLength(13)
    expect(surface.container.querySelector('button[aria-label="Open Content"]')).not.toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Pattern"]')).not.toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Shape"]')).not.toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Text"]')).not.toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Image"]')).not.toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Decorations"]')).not.toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Effects"]')).not.toBeNull()

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Image"]'))
    })

    expect(surface.container.querySelectorAll('[data-drafting-tool-button="true"]')).toHaveLength(13)
    expect(
      getRequiredElement(surface.container, 'button[aria-label="Open Image"]').getAttribute(
        "aria-pressed",
      ),
    ).toBe("true")
    expect(surface.container.textContent).toContain("Logo inside QR")
    expect(surface.container.textContent).toContain("Shape fill behind QR")
    expect(surface.container.textContent).toContain("Image object on canvas")
    expect(surface.container.textContent).not.toContain("Frame / Card")
    expect(surface.container.textContent).not.toContain("Frame/Card")
    expect(surface.container.querySelector('button[aria-label="Open Shaders"]')).toBeNull()

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Shape"]'))
    })

    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()
    expect(
      getRequiredElement(
        surface.container,
        '[data-active-tool="shape"]',
      ).textContent,
    ).toContain("Corner radius")
    expect(surface.container.textContent).not.toContain("Frame/Card")
  })

  it(
    "shows raster quality presets and measures the default web and social export size",
    async () => {
      vi.useFakeTimers()
      const surface = renderSurface()

      await act(async () => {
        await flushPromises()
      })

      expect(surface.container.textContent).toContain("Quality preset")
      expect(surface.container.textContent).toContain("Web & social")
      expect(surface.container.textContent).toContain("1024 x 1024 px")
      expect(surface.container.textContent).toContain("Calculating size")

      await act(async () => {
        vi.advanceTimersByTime(250)
        await flushPromises()
      })

      expect(measureDashboardRasterExportSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          extension: "png",
          qualityPercent: 100,
          targetSizePx: 1024,
          state: expect.objectContaining({
            rasterExportQualityPercent: 100,
          }),
        }),
      )
      expect(surface.container.textContent).toContain("182000 B")
      expect(
        surface.container.querySelector('[data-slot="drafting-export-size-preview"]'),
      ).toBeNull()
    },
    15000,
  )

  it("passes each raster quality preset target size into export preview", async () => {
    vi.useFakeTimers()
    const surface = renderSurface()
    const presetExpectations = [
      ["Use Quick share export preset", 512],
      ["Use Web & social export preset", 1024],
      ["Use Small print export preset", 1600],
      ["Use Flyer / poster export preset", 2400],
      ["Use Large format export preset", 3200],
      ["Use Max quality export preset", 4096],
    ] as const

    for (const [label, targetSizePx] of presetExpectations) {
      await act(async () => {
        activateElement(
          getRadioInputByAriaLabel(
            surface.container,
            label,
          ),
        )
      })
      await act(async () => {
        vi.advanceTimersByTime(250)
        await flushPromises()
      })

      expect(measureDashboardRasterExportSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          targetSizePx,
        }),
      )
    }
  })

  it("keeps raster export preview idle while the download popover is closed", async () => {
    vi.useFakeTimers()
    const surface = renderSurface({ openDownloadPopover: false })

    await act(async () => {
      vi.advanceTimersByTime(500)
      await flushPromises()
    })

    expect(measureDashboardRasterExportSpy).not.toHaveBeenCalled()

    const autoContentInput = getRequiredElement(
      surface.container,
      'input[aria-label="Link URL"]',
    ) as HTMLInputElement

    await act(async () => {
      changeInputValue(autoContentInput, "https://example.com/updated")
      vi.advanceTimersByTime(500)
      await flushPromises()
    })

    expect(measureDashboardRasterExportSpy).not.toHaveBeenCalled()
  })

  it("regenerates the active qr markup once when content changes", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    const callsBeforeEdit = buildDashboardQrNodePayloadSpy.mock.calls.length
    const autoContentInput = getRequiredElement(
      surface.container,
      'input[aria-label="Link URL"]',
    ) as HTMLInputElement

    await act(async () => {
      changeInputValue(autoContentInput, "https://example.com/changed")
      await flushPromises()
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledTimes(callsBeforeEdit + 1)
  })

  it("downloads the selected png export from the header control with the selected preset", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()
    const maxQualityInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Use Max quality export preset"]',
    ) as HTMLInputElement

    await act(async () => {
      activateElement(maxQualityInput)
    })
    await act(async () => {
      vi.advanceTimersByTime(250)
      await flushPromises()
    })

    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download PNG"))
      await flushPromises()
    })

    expect(downloadDashboardQrNodeExportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        extension: "png",
        name: "QR Code",
        node: expect.objectContaining({ name: "QR Code" }),
        qualityPercent: 100,
        targetSizePx: 4096,
      }),
    )
    expect(downloadDashboardRasterExportSpy).not.toHaveBeenCalled()
  })

  it("routes jpeg and webp selections through the named qr export path", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()
    const jpegExportInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Export JPEG"]',
    ) as HTMLInputElement
    const webpExportInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Export WEBP"]',
    ) as HTMLInputElement

    await act(async () => {
      activateElement(jpegExportInput)
      await flushPromises()
    })

    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download JPEG"))
      await flushPromises()
    })

    await act(async () => {
      activateElement(webpExportInput)
      await flushPromises()
    })

    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download WEBP"))
      await flushPromises()
    })

    expect(downloadDashboardQrNodeExportSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        extension: "jpeg",
        name: "QR Code",
        targetSizePx: 1024,
      }),
    )
    expect(downloadDashboardQrNodeExportSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        extension: "webp",
        name: "QR Code",
        targetSizePx: 1024,
      }),
    )
    expect(downloadDashboardRasterExportSpy).not.toHaveBeenCalled()
  })

  it("renders all qr codes and individual qr layer names in the download target selector", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    await addQrCode(surface.container)

    expect(
      getRequiredElement(surface.container, 'input[aria-label="Download Current QR"]'),
    ).not.toBeNull()
    expect(
      getRequiredElement(surface.container, 'input[aria-label="Download All QR codes"]'),
    ).not.toBeNull()
    expect(
      getRequiredElement(surface.container, 'input[aria-label="Download QR Code"]'),
    ).not.toBeNull()
    expect(
      getRequiredElement(surface.container, 'input[aria-label="Download QR Code 2"]'),
    ).not.toBeNull()
    expect(
      getRequiredElement(
        surface.container,
        '[data-slot="drafting-download-target-list"]',
      ).className,
    ).toContain("grid-cols-2")
    expect(surface.container.textContent).toContain("Current QR")
  })

  it("downloads all qr layers as a zip using the selected format", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    await addQrCode(surface.container)

    await act(async () => {
      activateElement(
        getRequiredElement(surface.container, 'input[aria-label="Download All QR codes"]'),
      )
      activateElement(
        getRequiredElement(surface.container, 'input[aria-label="Export WEBP"]'),
      )
      for (let i = 0; i < 5; i += 1) {
        await flushPromises()
      }
    })

    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download WEBP"))
      await flushPromises()
    })

    expect(downloadDashboardQrBatchZipExportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        extension: "webp",
        name: "new-qr-studio",
        nodes: expect.arrayContaining([
          expect.objectContaining({ name: "QR Code" }),
          expect.objectContaining({ name: "QR Code 2" }),
        ]),
        targetSizePx: 1024,
      }),
    )
    expect(downloadDashboardQrNodeExportSpy).not.toHaveBeenCalled()
  })

  it("downloads an individual selected qr layer directly", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    await addQrCode(surface.container)

    await act(async () => {
      activateElement(
        getRequiredElement(surface.container, 'input[aria-label="Download QR Code 2"]'),
      )
      activateElement(getRequiredElement(surface.container, 'input[aria-label="Export SVG"]'))
      await flushPromises()
    })

    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download SVG"))
      await flushPromises()
    })

    expect(downloadDashboardQrNodeExportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        extension: "svg",
        name: "QR Code 2",
        node: expect.objectContaining({ name: "QR Code 2" }),
      }),
    )
    expect(downloadDashboardQrBatchZipExportSpy).not.toHaveBeenCalled()
  })

  it("downloads the default named qr layer as svg from the header control", async () => {
    buildDashboardQrNodePayloadSpy.mockImplementationOnce(() => new Promise(() => undefined))
    buildDashboardQrNodePayloadSpy.mockResolvedValueOnce({
      markup: "<svg />",
      naturalHeight: 320,
      naturalWidth: 320,
    })

    const surface = renderSurface()
    const callsBeforeDownload = buildDashboardQrNodePayloadSpy.mock.calls.length

    await act(async () => {
      activateElement(getRequiredElement(surface.container, 'input[aria-label="Export SVG"]'))
      await flushPromises()
    })

    expect(surface.container.querySelector('[data-slot="drafting-raster-preset-section"]')).toBeNull()

    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download SVG"))
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledTimes(callsBeforeDownload + 1)
    expect(downloadDashboardQrNodeExportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        extension: "svg",
        name: "QR Code",
        node: expect.objectContaining({ name: "QR Code" }),
      }),
    )
    expect(downloadDashboardRasterExportSpy).not.toHaveBeenCalled()
  })

  it("exports background shapes from the qr layer and strips legacy qr backing artifacts", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue({
      markup:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><defs><filter data-qr-layer="background-shape-blur-filter" id="background-shape-blur-filter"/></defs><path data-qr-layer="background-shape-blur" d="M0 0h320v320H0z"/><path data-qr-layer="background-shape" d="M0 0h320v320H0z"/><rect width="320" height="320" clip-path="url(\'#clip-path-background-color-0\')" fill="#fff"/><path data-qr-layer="dot" d="M20 20h40v40H20z" fill="#111"/></svg>',
      naturalHeight: 320,
      naturalWidth: 320,
    })
    const surface = renderSurface()
    const backgroundButton = getRequiredElement(surface.container, 'button[aria-label="Open Shape"]')

    await waitForDraftingSurface()

    act(() => {
      activateElement(backgroundButton)
    })
    await act(async () => {
      activateElement(getRadioInputByAriaLabel(surface.container, "Flower"))
      await flushPromises()
      await flushPromises()
    })
    await act(async () => {
      activateElement(getRequiredElement(surface.container, 'input[aria-label="Export SVG"]'))
      await flushPromises()
    })
    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download SVG"))
      await flushPromises()
    })

    const exportCall = downloadDashboardQrNodeExportSpy.mock.calls[0] as unknown as [
      { node: { originalSvgMarkup: string } },
    ]
    const exportedMarkup = exportCall[0].node.originalSvgMarkup

    expect(exportedMarkup).toContain('data-drafting-qr-background="flower"')
    expect(exportedMarkup).not.toContain('data-drafting-card-shape="flower"')
    expect(exportedMarkup).toContain("<feDropShadow")
    expect(exportedMarkup).toContain('data-testid="data-modules"')
    expect(exportedMarkup).not.toContain('data-qr-layer="background-shape"')
    expect(exportedMarkup).not.toContain('data-qr-layer="background-shape-blur"')
    expect(exportedMarkup).not.toContain('data-qr-layer="background-shape-blur-filter"')
    expect(exportedMarkup).not.toContain('clip-path-background-color')
  })

  it("keeps png export on the qr layer path without an edit mode toggle", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    expect(surface.container.querySelector('button[aria-label="Toggle edit mode"]')).toBeNull()

    const pngExportInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Export PNG"]',
    ) as HTMLInputElement

    await act(async () => {
      activateElement(pngExportInput)
    })
    await act(async () => {
      vi.advanceTimersByTime(250)
      await flushPromises()
    })

    expect(measureDashboardRasterExportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        extension: "png",
        targetSizePx: 1024,
        state: expect.objectContaining({
          data: "https://new-qr-studio.local/launch",
        }),
      }),
    )
    expect(surface.container.textContent).toContain("182000 B")
    expect(
      surface.container.querySelector('[data-slot="drafting-raster-calculated-size"]')
        ?.textContent,
    ).toContain("182000 B")

    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download PNG"))
      await flushPromises()
    })

    expect(downloadDashboardQrNodeExportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        extension: "png",
        name: "QR Code",
        targetSizePx: 1024,
      }),
    )
    expect(downloadDashboardRasterExportSpy).not.toHaveBeenCalled()
  })

  it("switches tool button state and renders stacked inspector content for compact tools", () => {
    const surface = renderSurface()
    const contentButton = getRequiredElement(surface.container, 'button[aria-label="Open Content"]')
    const qrBodyButton = getRequiredElement(surface.container, 'button[aria-label="Open Pattern"]')
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')
    const cornersButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Corners"]',
    )

    expect(contentButton.getAttribute("aria-pressed")).toBe("true")
    expect(qrBodyButton.getAttribute("aria-pressed")).toBe("false")
    expect(cornersButton.getAttribute("aria-pressed")).toBe("false")
    expect(
      surface.container.querySelector('button[aria-label="Open QR type options"]'),
    ).not.toBeNull()

    act(() => {
      qrBodyButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(contentButton.getAttribute("aria-pressed")).toBe("false")
    expect(qrBodyButton.getAttribute("aria-pressed")).toBe("true")
    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-style-option-grid"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-dots-color-accordion"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-style-size-tab"]')).not.toBeNull()

    act(() => {
      cornersButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(cornersButton.getAttribute("aria-pressed")).toBe("true")
    expect(surface.container.querySelector('[data-slot="drafting-corner-square-option-grid"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-corner-square-color-accordion"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-corner-dot-option-grid"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-corner-dot-color-accordion"]')).not.toBeNull()

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(surface.container.querySelector('[data-slot="drafting-brand-icon-tab"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-logo-color-accordion"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-logo-upload-accordion"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-logo-size-tab"]')).not.toBeNull()
  })

  it("opens the non-document layers tool with a dedicated layers panel", () => {
    const surface = renderSurface()
    const layersButton = getRequiredElement(surface.container, 'button[aria-label="Open Layers"]')

    act(() => {
      activateElement(layersButton)
    })

    expect(layersButton.getAttribute("aria-pressed")).toBe("true")
    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-layers-tab"]')).not.toBeNull()
  })

  it("adds and edits a simple Avnac-style text layer from the Text tool", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ openDownloadPopover: false })

    await waitForDraftingSurface()

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Text"]'))
    })
    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Add Text"]'))
    })

    await act(async () => {
      await flushPromises()
    })

    const textLayer = getRequiredElement(surface.container, '[data-slot="drafting-text-layer"]')
    const textPanel = getRequiredElement(surface.container, '[data-slot="drafting-text-tab"]')
    const textArea = getRequiredElement(
      textPanel,
      'textarea[aria-label="Text layer content"]',
    ) as HTMLTextAreaElement
    const sizeInput = getRequiredElement(textPanel, 'input[type="number"]') as HTMLInputElement
    const fillInput = getRequiredElement(
      textPanel,
      'input[aria-label="Text fill color"]',
    ) as HTMLInputElement
    const weightInput = getRequiredElement(
      textPanel,
      'input[aria-label="Text font weight"]',
    ) as HTMLInputElement
    const generalSansButton = getRequiredElement(
      textPanel,
      'button[aria-label="Choose General Sans"]',
    )

    expect(textLayer.getAttribute("data-selected")).toBe("true")
    expect(textLayer.textContent).toContain("Add text")
    expect(textArea.value).toBe("Add text")

    act(() => {
      changeInputValue(weightInput, "532")
    })

    expect(
      (getRequiredElement(surface.container, '[data-slot="drafting-text-content"]') as HTMLElement)
        .style.fontWeight,
    ).toBe("500")

    act(() => {
      activateElement(generalSansButton)
      document
        .querySelector("link#drafting-font-fontshare-general-sans")
        ?.dispatchEvent(new Event("load"))
      changeInputValue(textArea, "Scan at counter")
      changeInputValue(sizeInput, "42")
      changeInputValue(fillInput, "#123456")
      changeInputValue(weightInput, "680")
    })

    await act(async () => {
      await flushPromises()
    })

    const content = getRequiredElement(surface.container, '[data-slot="drafting-text-content"]') as HTMLElement

    expect(content.textContent).toContain("Scan at counter")
    expect(content.style.fontFamily).toBe('"General Sans", system-ui, Arial, sans-serif')
    expect(content.style.fontSize).toBe("42px")
    expect(content.style.fontWeight).toBe("700")
    expect(content.style.color).toBe("rgb(18, 52, 86)")

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open download options"]'))
    })
    await act(async () => {
      await flushPromises()
    })
    act(() => {
      activateElement(getRequiredElement(surface.container, '[data-slot="drafting-download-submit"]'))
    })
    await waitForDraftingSurface()

    const exportCall = downloadDashboardQrNodeExportSpy.mock.calls.at(-1) as unknown as
      | [{ node: { originalSvgMarkup: string } }]
      | undefined
    const nodeMarkup = exportCall?.[0].node.originalSvgMarkup

    expect(nodeMarkup).toContain(">Scan at<")
    expect(nodeMarkup).toContain(">counter<")
    expect(nodeMarkup).toContain("General Sans")
    expect(nodeMarkup).toContain('font-size="42"')
    expect(nodeMarkup).toContain('font-weight="700"')
    expect(nodeMarkup).toContain('fill="#123456"')
  })

  it("deletes removable selected layers from the floating canvas toolbar", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ openDownloadPopover: false })

    await act(async () => {
      await flushPromises()
    })

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Text"]'))
    })
    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Add Text"]'))
    })

    await act(async () => {
      await flushPromises()
    })

    expect(surface.container.querySelector('[data-slot="drafting-text-layer"]')).not.toBeNull()
    expect(
      surface.container.querySelector('[data-slot="drafting-text-layer"]')?.getAttribute("data-selected"),
    ).toBe("true")

    act(() => {
      activateElement(
        getRequiredElement(surface.container, 'button[aria-label="Delete selection"]'),
      )
    })

    await act(async () => {
      await flushPromises()
    })

    expect(surface.container.querySelector('[data-slot="drafting-text-layer"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-compose-node"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-layer-floating-toolbar"]')).toBeNull()
  })

  it("renders dot matrix motion and loader playground controls in the Motion panel", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()
    const motionButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Motion"]',
    )

    act(() => {
      activateElement(motionButton)
    })

    expect(motionButton.getAttribute("aria-pressed")).toBe("true")
    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-motion-tab"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-loader-playground-tab"]')).not.toBeNull()
    expect(surface.container.textContent).toContain("Dot matrix motion")
    expect(surface.container.textContent).toContain("Animated SVG export")
    expect(surface.container.textContent).toContain("Neon Drift")
    expect(surface.container.textContent).toContain("Mobius Run")
    expect(surface.container.textContent).not.toContain("Honey Gate")
    expect(surface.container.textContent).toContain("Loader color")
    expect(surface.container.textContent).toContain("Overlay scale")
    expect(surface.container.textContent).toContain("Bloom")
    expect(surface.container.textContent).toContain("Base")
    expect(surface.container.textContent).toContain("Mid")
    expect(surface.container.textContent).toContain("Peak")
    expect(surface.container.textContent).not.toContain("Dot shape")

    await act(async () => {
      activateElement(
        getRequiredElement(
          surface.container,
          'button[aria-label="Select loader Mobius Run"]',
        ),
      )
      await flushPromises()
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dotMatrixAnimation: expect.objectContaining({
          loader: "mobius-run",
        }),
      }),
    )

    const loaderPanel = getRequiredElement(
      surface.container,
      '[data-slot="drafting-loader-playground-tab"]',
    )
    const baseColorInput = getRequiredElement(
      loaderPanel,
      'input[aria-label="Loader base color"]',
    ) as HTMLInputElement

    await act(async () => {
      changeInputValue(baseColorInput, "#111111")
      await flushPromises()
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dotMatrixAnimation: expect.objectContaining({
          customColorBase: "#111111",
        }),
      }),
    )
  })

  it("updates dot matrix motion from the Motion panel", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Motion"]'))
    })

    expect(surface.container.textContent).toContain("Dot matrix motion")
    expect(surface.container.textContent).toContain("Animated SVG export")

    await act(async () => {
      activateElement(
        getRequiredElement(
          surface.container,
          "#drafting-dot-matrix-animation-enabled",
        ),
      )
      await flushPromises()
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dotMatrixAnimation: expect.objectContaining({
          enabled: true,
        }),
      }),
    )
  })

  it("ports static content controls into the default drafting panel without render type cards", () => {
    const surface = renderSurface()
    const contentTab = getRequiredElement(
      surface.container,
      '[data-slot="drafting-content-tab"]',
    )
    const qrData = getRequiredElement(surface.container, 'input[aria-label="Link URL"]') as HTMLInputElement

    expect(contentTab).not.toBeNull()
    expect(
      getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]')
        .className,
    ).toContain("h-10")
    expect(
      getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]')
        .getAttribute("data-drafting-dropdown-trigger"),
    ).toBe("true")
    expect(
      getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]')
        .getAttribute("data-slot"),
    ).toBe("dropdown-menu-trigger")
    expect(
      getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]')
        .className,
    ).toContain("border-[var(--drafting-dropdown-border)]")
    expect(
      getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]')
        .querySelector("svg"),
    ).not.toBeNull()
    expect(
      getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]')
        .className,
    ).toContain("bg-[var(--drafting-dropdown-trigger-surface)]")
    expect(
      getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]')
        .className,
    ).not.toContain("bg-[var(--drafting-ink)]")
    expect(surface.container.textContent).toContain("QR Type:")
    expect(surface.container.textContent).not.toContain("Wi-Fi")
    expect(surface.container.textContent).not.toContain("Discord")
    expect(surface.container.textContent).toContain("Encoded value")
    expect(qrData.value).toBe("https://new-qr-studio.local/launch")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-type",
      ),
    ).toBe("link")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://new-qr-studio.local/launch")
    expect(surface.container.querySelector('[data-slot="drafting-render-type-grid"]')).toBeNull()
    expect(surface.container.textContent).not.toContain("Render type")
    expect(surface.container.querySelector('[data-slot="drafting-style-margin-slider"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-style-size-slider"]')).toBeNull()
  })

  it("wires the desktop overlay content inspector into the active drafting QR state", () => {
    const surface = renderDesktopOverlaySurface()
    const root = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')

    act(() => {
      activateElement(getRequiredElement(surface.container, '[data-tool-id="content"]'))
    })

    const payload = getRequiredElement(
      surface.container,
      '#desktop-content-url',
    ) as HTMLInputElement

    act(() => {
      changeInputValue(payload, "https://example.com/desktop-live")
    })

    expect(root.getAttribute("data-qr-content-value")).toBe("https://example.com/desktop-live")
  })

  it("switches to template mode from the dynamic island free edit toggle", () => {
    const surface = renderDesktopOverlaySurface({ paneToolbarVariant: "desktop-zoom" })
    const switchInput = getRequiredElement(
      surface.container,
      '[data-slot="desktop-free-edit-toggle"] [data-slot="switch"]',
    )

    act(() => {
      activateElement(switchInput)
    })

    expect(window.localStorage.getItem("desktop-workspace-editing-mode")).toBe("template")
    expect(getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute("data-editing-mode")).toBe("template")
    expect(surface.container.querySelector('[data-preview-locked="true"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="template-edit-zone"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-resize-toolbar"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-tool-id="text"]')).toBeNull()
    expect(surface.container.querySelector('[data-tool-id="image"]')).toBeNull()
    expect(surface.container.querySelector('[data-tool-id="layers"]')).toBeNull()
    expect(surface.container.querySelector('[data-tool-id="templates"]')).toBeNull()
    expect(surface.container.querySelector('[data-tool-id="layout"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-island"]')).toBeNull()
  })

  it("wires desktop pattern and logo inspectors into the active drafting QR state", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderDesktopOverlaySurface()
    const root = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')

    await waitForDraftingSurface()
    const callsBeforePatternEdit = buildDashboardQrNodePayloadSpy.mock.calls.length

    act(() => {
      activateElement(getRequiredElement(surface.container, '[data-tool-id="pattern"]'))
    })
    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Use Circle pattern"]'))
      changeInputValue(
        getRequiredElement(surface.container, 'input[aria-label="Solid color"]') as HTMLInputElement,
        "#123456",
      )
    })

    expect(root.getAttribute("data-qr-content-value")).toBe("https://new-qr-studio.local/launch")
    await act(async () => {
      await flushPromises()
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledTimes(callsBeforePatternEdit + 1)
    expect(buildDashboardQrNodePayloadSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dataModulesSettings: expect.objectContaining({ color: "#123456" }),
        dotsColorMode: "solid",
      }),
      expect.anything(),
    )

    act(() => {
      activateElement(getRequiredElement(surface.container, '[data-tool-id="logo"]'))
    })
    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Use Brand logo source"]'))
    })
    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Use Instagram logo icon"]'))
    })

    expect(root.getAttribute("data-logo-source-mode")).toBe("preset")
    expect(root.getAttribute("data-logo-preset-id")).toBe("instagram")
  })

  it("applies a business card size preset to the active drafting card", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderDesktopOverlaySurface()

    await waitForDraftingSurface()

    act(() => {
      activateElement(getRequiredElement(surface.container, '[data-tool-id="shape"]'))
    })

    act(() => {
      activateElement(
        getRequiredElement(
          surface.container,
          'button[aria-label="Use Business card size 1050 by 600"]',
        ),
      )
    })

    const card = getSelectedPreviewCard(surface.container)

    expect(card.style.width).toBe("1080px")
    expect(card.style.height).toBe("617px")
  })

  it("renders the desktop canvas resize toolbar and wires it to preview zoom", () => {
    const surface = renderDesktopOverlaySurface({ paneToolbarVariant: "desktop-zoom" })
    const composeToolbar = getRequiredElement(surface.container, '[data-slot="dashboard-compose-toolbar"]')

    expect(composeToolbar.getAttribute("data-toolbar-appearance")).toBe("desktop-glass")
    expect(composeToolbar.className).toContain("rounded-full")
    expect(composeToolbar.className).toContain("bg-[var(--desktop-glass-bg)]")
    expect(surface.container.querySelector('button[aria-label="Zoom out preview"]')).toBeNull()
    expect(surface.container.querySelector('button[aria-label="Zoom in preview"]')).toBeNull()
    expect(surface.container.querySelector('button[aria-label="Reset view"]')).toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Undo"]')).toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Redo"]')).toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Select and move elements"]')).not.toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Pan canvas"]')).not.toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Add text on canvas"]')).not.toBeNull()
    expect(Array.from(composeToolbar.querySelectorAll("button")).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Select and move elements",
      "Pan canvas",
      "Disable snapping",
      "Hide canvas grid",
      "Add text on canvas",
      "Add content",
    ])
    const dynamicIsland = getRequiredElement(surface.container, '[data-slot="desktop-dynamic-island"]')
    const utilityToolbar = getRequiredElement(surface.container, '[data-slot="desktop-utility-toolbar"]')
    expect(surface.container.querySelector('[data-slot="desktop-document-toolbar"]')).toBeNull()
    expect(Array.from(utilityToolbar.querySelectorAll("button")).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Save",
      "Download",
    ])
    expect(utilityToolbar.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()
    expect(utilityToolbar.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    expect(composeToolbar.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()
    expect(composeToolbar.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    expect(dynamicIsland.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).not.toBeNull()
    expect(getRequiredElement(dynamicIsland, '[data-slot="desktop-theme-toggle"]').getAttribute("aria-label")).toBe("Switch to light mode")
    expect(surface.container.querySelector('[data-slot="desktop-action-toolbar"]')).toBeNull()
    const historyActions = getRequiredElement(surface.container, '[data-slot="desktop-history-actions"]')
    expect(historyActions.querySelector('button[aria-label="Switch to light mode"]')).toBeNull()
    expect(Array.from(historyActions.querySelectorAll("button")).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Reset defaults",
      "Undo",
      "Redo",
    ])
    const resizeToolbar = getRequiredElement(surface.container, '[data-slot="desktop-resize-toolbar"]')
    expect(resizeToolbar.parentElement?.className).toContain("bottom-4")
    expect(resizeToolbar.parentElement?.className).toContain("right-5")
    expect(composeToolbar.parentElement?.className).toContain("top-1/2")
    expect(composeToolbar.parentElement?.className).toContain("-translate-y-1/2")
    expect(resizeToolbar.parentElement).not.toBe(composeToolbar.parentElement)
    expect(resizeToolbar.className).toContain("flex-col")
    expect(resizeToolbar.className).toContain("min-w-12")
    expect(resizeToolbar.getAttribute("data-toolbar-appearance")).toBe("desktop-glass")
    expect(resizeToolbar.className).toContain("px-1")
    expect(getRequiredElement(resizeToolbar, 'button[aria-label="Decrease canvas size"]').className).toContain("size-9")
    expect(getRequiredElement(resizeToolbar, 'button[aria-label="Increase canvas size"]').className).toContain("size-9")
    expect(resizeToolbar.querySelector('button[aria-label^="Choose canvas size"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-zoom-popover"]')).toBeNull()
    expect(Array.from(resizeToolbar.querySelectorAll("button")).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Increase canvas size",
      "Decrease canvas size",
    ])

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Increase canvas size"]'))
    })

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Decrease canvas size"]'))
    })
  })

  it("opens keyboard shortcuts from the dynamic island toolbar", () => {
    const surface = renderDesktopOverlaySurface({ paneToolbarVariant: "desktop-zoom" })
    const dynamicIsland = getRequiredElement(surface.container, '[data-slot="desktop-dynamic-island"]')
    const shortcutsTrigger = getRequiredElement(
      dynamicIsland,
      '[data-slot="desktop-keyboard-shortcuts-trigger"]',
    )

    expect(document.body.querySelector('[data-slot="desktop-keyboard-shortcuts-popover"]')).toBeNull()

    act(() => {
      activateElement(shortcutsTrigger)
    })

    expect(document.body.querySelector('[data-slot="desktop-keyboard-shortcuts-popover"]')).not.toBeNull()
  })

  it("builds Wi-Fi payloads from the content type selector and preserves per-type drafts", () => {
    const surface = renderSurface()

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]'))
    })
    const menuContent = getRequiredElement(document.body, '[data-slot="dropdown-menu-content"]')
    const globalsSource = readFileSync("app/globals.css", "utf8")
    expect(globalsSource).toContain('[data-drafting-dropdown-content="true"]')
    expect(globalsSource).toContain('.dark [data-drafting-dropdown-content="true"]')
    expect(globalsSource).toContain("--drafting-dropdown-menu-surface-open: #252a33;")
    expect(menuContent.getAttribute("data-drafting-dropdown-content")).toBe("true")
    expect(
      menuContent.className,
    ).toContain("bg-[var(--drafting-dropdown-menu-surface-open)]")
    expect(menuContent.className).toContain("w-[280px]")
    expect(menuContent.className).toContain("shadow-[var(--drafting-dropdown-menu-shadow-open)]")

    act(() => {
      activateElement(getRequiredElement(document.body, '[data-slot="dropdown-menu-sub-trigger"][data-category="popular"]'))
    })

    const selectedAutoItem = getRequiredElement(
      document.body,
      '[data-slot="dropdown-menu-item"][data-content-type="link"]',
    )
    expect(selectedAutoItem.className).toContain("bg-[var(--drafting-dropdown-selected-fill)]")
    expect(selectedAutoItem.className).not.toContain("bg-[var(--drafting-ink)]")
    expect(selectedAutoItem.className).not.toContain("border-dashed")
    expect(selectedAutoItem.className).not.toContain("focus:bg-accent")
    expect(selectedAutoItem.querySelector("svg")?.getAttribute("class")).toContain("opacity-100")
    const wifiItem = getRequiredElement(
      document.body,
      '[data-slot="dropdown-menu-item"][data-content-type="wifi"]',
    )
    expect(wifiItem.className).toContain("bg-transparent")
    expect(wifiItem.className).not.toContain("bg-[var(--drafting-ink)]")
    expect(wifiItem.querySelectorAll("svg")).toHaveLength(2)
    expect(wifiItem.querySelector("svg")?.getAttribute("class")).toContain("opacity-0")
    act(() => {
      activateElement(wifiItem)
    })

    const ssidInput = getRequiredElement(surface.container, 'input[aria-label="Network name"]') as HTMLInputElement
    const passwordInput = getRequiredElement(surface.container, 'input[aria-label="Wi-Fi password"]') as HTMLInputElement
    const hiddenInput = getRequiredElement(surface.container, 'input[aria-label="Hidden network"]') as HTMLInputElement

    act(() => {
      changeInputValue(ssidInput, "Cafe;Guest")
      changeInputValue(passwordInput, "pa:ss")
      activateElement(hiddenInput)
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe(String.raw`WIFI:T:WPA;S:Cafe\;Guest;P:pa\:ss;H:true;;`)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]'))
    })
    act(() => {
      activateElement(getRequiredElement(document.body, '[data-slot="dropdown-menu-sub-trigger"][data-category="contact"]'))
    })
    act(() => {
      activateElement(getRequiredElement(document.body, '[data-slot="dropdown-menu-item"][data-content-type="sms"]'))
    })
    act(() => {
      changeInputValue(
        getRequiredElement(surface.container, 'input[aria-label="SMS phone number"]') as HTMLInputElement,
        "+1 555 010 2000",
      )
      changeInputValue(
        getRequiredElement(surface.container, 'textarea[aria-label="SMS message"]') as HTMLTextAreaElement,
        "Bring menus",
      )
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("sms:+15550102000?body=Bring%20menus")

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]'))
    })
    act(() => {
      activateElement(getRequiredElement(document.body, '[data-slot="dropdown-menu-sub-trigger"][data-category="popular"]'))
    })
    act(() => {
      activateElement(getRequiredElement(document.body, '[data-slot="dropdown-menu-item"][data-content-type="wifi"]'))
    })

    expect(
      (getRequiredElement(surface.container, 'input[aria-label="Network name"]') as HTMLInputElement)
        .value,
    ).toBe("Cafe;Guest")
  })

  it("shows validation for missing required static content fields", () => {
    const surface = renderSurface()

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open QR type options"]'))
    })
    act(() => {
      activateElement(getRequiredElement(document.body, '[data-slot="dropdown-menu-sub-trigger"][data-category="popular"]'))
    })
    act(() => {
      activateElement(getRequiredElement(document.body, '[data-slot="dropdown-menu-item"][data-content-type="wifi"]'))
    })

    const ssidTrigger = getRequiredElement(
      surface.container,
      '[data-item-id="ssid"] [data-slot="drafting-color-trigger"]',
    )
    expect(ssidTrigger.textContent).toContain("●")

    act(() => {
      changeInputValue(
        getRequiredElement(surface.container, 'input[aria-label="Network name"]') as HTMLInputElement,
        "Studio",
      )
    })

    expect(ssidTrigger.textContent).not.toContain("●")
  })

  it("renders a selectable option-card grid for the style tab", () => {
    const surface = renderSurface()
    const styleButton = getRequiredElement(surface.container, 'button[aria-label="Open Pattern"]')

    act(() => {
      styleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const styleGrid = getRequiredElement(
      surface.container,
      '[data-slot="drafting-style-option-grid"]',
    )
    const roundedInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Rounded"]',
    ) as HTMLInputElement
    const squareInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Square"]',
    ) as HTMLInputElement

    expect(styleGrid.getAttribute("role")).toBe("radiogroup")
    expect(styleGrid.querySelectorAll('[data-slot="option-card"]').length).toBe(13)
    expect(
      squareInput.parentElement
        ?.querySelector('[data-slot="option-card"]')
        ?.getAttribute("class"),
    ).toContain("border-[var(--drafting-option-card-border)]")
    expect(
      squareInput.parentElement
        ?.querySelector('[data-slot="option-card"]')
        ?.getAttribute("class"),
    ).toContain("shadow-[var(--drafting-option-card-shadow-rest)]")
    expect(styleGrid.innerHTML).not.toMatch(
      /dark:[^"]*shadow-\[[^\]]*rgba\(255,255,255/,
    )
    expect(roundedInput.checked).toBe(true)
    expect(squareInput.checked).toBe(false)

    act(() => {
      squareInput.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(roundedInput.checked).toBe(false)
    expect(squareInput.checked).toBe(true)
  })

  it("renders a drafting color accordion for the style color tab with solid, gradient, and palette", () => {
    const surface = renderSurface()
    const styleButton = getRequiredElement(surface.container, 'button[aria-label="Open Pattern"]')

    act(() => {
      styleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-dots-color-accordion"]',
    )

    expect(accordion.getAttribute("data-slot")).toBe("drafting-dots-color-accordion")
    expect(accordion.querySelectorAll('[data-slot="accordion-item"]').length).toBe(3)
    expect(surface.container.textContent).toContain("Solid")
    expect(surface.container.textContent).toContain("Gradient")
    expect(surface.container.textContent).toContain("Palette")
    expect(accordion.innerHTML).toContain("text-[var(--drafting-ink-muted)]")
    expect(
      getRequiredElement(
        accordion,
        '[data-slot="drafting-color-trigger"]',
      ).className,
    ).toContain("[&_[data-slot=accordion-chevron]]:text-[var(--drafting-ink-muted)]")
    const triggerMarkup = Array.from(
      accordion.querySelectorAll('[data-slot="drafting-color-trigger"]'),
    )
      .map((trigger) => trigger.outerHTML)
      .join("")
    expect(triggerMarkup).not.toContain("text-muted-foreground")
    expect(triggerMarkup).not.toContain("#111111")
  })

  it("renders a drafting size tab for style with the qr margin and size sliders", () => {
    const surface = renderSurface()
    const styleButton = getRequiredElement(surface.container, 'button[aria-label="Open Pattern"]')

    act(() => {
      styleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const sizeTab = getRequiredElement(
      surface.container,
      '[data-slot="drafting-style-size-tab"]',
    )

    expect(sizeTab.querySelector('[data-slot="drafting-style-margin-slider"]')).not.toBeNull()
    expect(sizeTab.querySelector('[data-slot="drafting-style-radius-slider"]')).not.toBeNull()
    expect(sizeTab.querySelector('[data-slot="drafting-style-size-slider"]')).toBeNull()
    expect(sizeTab.textContent).toContain("Outer margin")
    expect(sizeTab.textContent).toContain("Corner radius")
    expect(sizeTab.textContent).toContain("Corner radius: 0%")
    expect(
      sizeTab.querySelector('[data-slot="drafting-style-margin-slider"]')?.getAttribute("data-appearance"),
    ).toBe("drafting")
  })

  it("updates the drafting qr background radius from the style size tab", () => {
    const surface = renderSurface()
    const styleButton = getRequiredElement(surface.container, 'button[aria-label="Open Pattern"]')

    act(() => {
      styleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const radiusInput = getRequiredElement(
      surface.container,
      '[data-slot="drafting-style-radius-slider"] input[type="range"]',
    ) as HTMLInputElement

    act(() => {
      changeInputValue(radiusInput, "24")
    })

    const surfaceRoot = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')

    expect(surfaceRoot.getAttribute("data-qr-radius")).toBe("0.24")
    expect(surface.container.textContent).toContain("Corner radius: 24%")
  })

  it("renders editable card controls and updates the active qr card preview", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    openCardOnlyMode(surface.container)

    const cardPanel = getRequiredElement(surface.container, '[data-slot="drafting-card-tab"]')
    const radiusInput = getRequiredElement(
      surface.container,
      '[data-slot="drafting-card-radius-slider"] input[type="range"]',
    ) as HTMLInputElement
    const paddingInput = getRequiredElement(
      surface.container,
      '[data-slot="drafting-card-padding-slider"] input[type="range"]',
    ) as HTMLInputElement
    const bottomSpaceInput = getRequiredElement(
      surface.container,
      '[data-slot="drafting-card-bottom-space-slider"] input[type="range"]',
    ) as HTMLInputElement

    expect(cardPanel.textContent).not.toContain("Strong")

    act(() => {
      changeInputValue(radiusInput, "36")
      changeInputValue(paddingInput, "30")
      changeInputValue(bottomSpaceInput, "160")
    })

    const card = getSelectedPreviewCard(surface.container)

    expect(card.style.borderRadius).toBe("36px")
    expect(card.style.padding).toBe("")
    expect(card.style.width).toBe("288px")
    expect(card.style.height).toBe("416px")
  })

  it("renders card surface options and applies fill, pattern, and pattern color changes", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    openCardOnlyMode(surface.container)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Decorations"]'))
    })

    const surfacePanel = getRequiredElement(
      surface.container,
      '[data-slot="drafting-card-surface-tab"]',
    )
    const fillInput = getRequiredElement(
      surfacePanel,
      "#drafting-card-fill",
    ) as HTMLInputElement

    expect(surfacePanel.textContent).toContain("Base fill")
    expect(surfacePanel.textContent).toContain("Generated patterns")
    expect(surfacePanel.textContent).not.toContain("Mesh gradients")
    expect(surfacePanel.querySelectorAll('[data-slot="option-card"]')).toHaveLength(146)

    act(() => {
      changeInputValue(fillInput, "#ff00aa")
    })

    expect(getSelectedPreviewCard(surface.container).style.backgroundColor).toBe(
      "rgb(255, 0, 170)",
    )

    act(() => {
      activateElement(getRadioInputByAriaLabel(surfacePanel, "Pattern 003"))
    })

    const card = getSelectedPreviewCard(surface.container)
    const colorInputs = surfacePanel.querySelectorAll(
      '[data-slot="drafting-card-pattern-color-input"]',
    )

    expect(card.getAttribute("data-card-pattern")).toBe("g3")
    expect(card.style.getPropertyValue("--s")).toBe("72px")
    expect(colorInputs).toHaveLength(4)

    act(() => {
      changeInputValue(colorInputs[0] as HTMLInputElement, "#111111")
    })

    expect(card.style.getPropertyValue("--p1")).toBe("#111111")
  })

  it("stacks card image upload and filters controls", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    openCardOnlyMode(surface.container)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Shape"]'))
    })

    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()

    const imagePanel = getRequiredElement(surface.container, '[data-slot="drafting-card-image-upload-tab"]')
    const imageUrlInput = getRequiredElement(
      imagePanel,
      'input[aria-label="Shape image URL"]',
    ) as HTMLInputElement

    expect(imagePanel.textContent).toContain("Image source")
    expect(imagePanel.textContent).not.toContain("Image filters")

    act(() => {
      changeInputValue(imageUrlInput, "https://example.com/card.png")
    })

    const card = getSelectedPreviewCard(surface.container)

    expect(card.getAttribute("data-card-style-mode")).toBe("image")
    expect(card.style.backgroundImage).toContain("https://example.com/card.png")

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Effects"]'))
    })

    const filtersPanel = getRequiredElement(
      surface.container,
      '[data-slot="drafting-card-image-filters-tab"]',
    )

    expect(filtersPanel.textContent).toContain("Image filters")
    expect(filtersPanel.querySelectorAll('[data-slot="option-card"]')).toHaveLength(6)
    expect(filtersPanel.textContent).toContain("Paper texture")
    expect(filtersPanel.textContent).toContain("Fluted glass")
    expect(filtersPanel.textContent).toContain("Water")
    expect(filtersPanel.textContent).toContain("Image dithering")
    expect(filtersPanel.textContent).toContain("Halftone dots")
    expect(filtersPanel.textContent).toContain("Halftone CMYK")
    expect(filtersPanel.textContent).not.toContain("Mesh gradient")
    expect(filtersPanel.textContent).not.toContain("Color panels")
    expect(filtersPanel.textContent).not.toContain("Pulsing border")

    expect(getAccordionTriggerByText(filtersPanel, "Filter")).not.toBeNull()
    expect(getAccordionTriggerByText(filtersPanel, "Preset")).not.toBeNull()
    expect(getAccordionTriggerByText(filtersPanel, "Motion")).not.toBeNull()
    expect(getAccordionTriggerByText(filtersPanel, "Settings")).not.toBeNull()
    expect(filtersPanel.querySelector('[data-slot="drafting-card-paper-shader-image"]')).toBeNull()

    for (const [label, shaderId] of [
      ["Paper texture", "paper-texture"],
      ["Fluted glass", "fluted-glass"],
      ["Water", "water"],
      ["Image dithering", "image-dithering"],
      ["Halftone dots", "halftone-dots"],
      ["Halftone CMYK", "halftone-cmyk"],
    ] as const) {
      act(() => {
        activateElement(getRadioInputByAriaLabel(filtersPanel, label))
      })

      expect(card.getAttribute("data-card-style-mode")).toBe("image-filter")
      expect(card.getAttribute("data-card-paper-shader")).toBe(shaderId)
    }
    expect(card.querySelector('[data-slot="dashboard-compose-node"] svg')?.getAttribute("style") ?? "").not.toContain(
      "filter",
    )
  })

  it("prompts for an upload while still allowing card image filter browsing", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    openCardOnlyMode(surface.container)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Effects"]'))
    })

    const filtersPanel = getRequiredElement(
      surface.container,
      '[data-slot="drafting-card-image-filters-tab"]',
    )

    expect(filtersPanel.textContent).toContain("Add an image in Shape")

    act(() => {
      activateElement(getRadioInputByAriaLabel(filtersPanel, "Paper texture"))
    })

    const card = getSelectedPreviewCard(surface.container)

    expect(card.getAttribute("data-card-style-mode")).toBe("image-filter")
    expect(card.getAttribute("data-card-paper-shader")).toBe("paper-texture")
  })

  it("renders self-generating card shaders apart from image filters", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    openCardOnlyMode(surface.container)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Effects"]'))
    })

    const shadersPanel = getRequiredElement(
      surface.container,
      '[data-slot="drafting-card-shaders-tab"]',
    )

    expect(shadersPanel.textContent).toContain("Mesh gradient")
    expect(shadersPanel.textContent).toContain("Warp")
    expect(shadersPanel.textContent).toContain("Preset")
    expect(
      shadersPanel.querySelectorAll('[data-slot="drafting-card-paper-shader-preview"]'),
    ).toHaveLength(20)
    expect(
      shadersPanel.querySelectorAll('[data-slot="drafting-card-paper-shader-preview-fallback"]'),
    ).toHaveLength(20)
    expect(shadersPanel.textContent).toContain("Motion")
    expect(shadersPanel.textContent).toContain("Settings")
    expect(shadersPanel.textContent).not.toContain("Image dithering")

    act(() => {
      activateElement(getRadioInputByAriaLabel(shadersPanel, "Mesh gradient"))
    })

    const card = getSelectedPreviewCard(surface.container)

    expect(card.getAttribute("data-card-style-mode")).toBe("paper-shader")
    expect(card.getAttribute("data-card-paper-shader")).toBe("mesh-gradient")
    expect(card.querySelector('[data-slot="dashboard-compose-card-mesh-gradient"]')).toBeNull()

    const shaderSettingsPanel = getRequiredElement(
      surface.container,
      '[data-slot="drafting-card-shaders-tab"]',
    )

    expect(shaderSettingsPanel.textContent).toContain("Motion")
    expect(shaderSettingsPanel.textContent).toContain("Settings")
    expect(shaderSettingsPanel.textContent).toContain("Pause")
    expect(shaderSettingsPanel.textContent).toContain("Preset")
    expect(shaderSettingsPanel.textContent).toContain("Warp")
  })

  it("preserves card settings separately for each drafting qr layer", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    openCardOnlyMode(surface.container)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Decorations"]'))
    })

    const getFillInput = () =>
      getRequiredElement(surface.container, "#drafting-card-fill") as HTMLInputElement

    act(() => {
      changeInputValue(getFillInput(), "#ff00aa")
    })

    await addQrCode(surface.container)

    act(() => {
      changeInputValue(getFillInput(), "#00ffaa")
    })

    const [firstPane, secondPane] = Array.from(
      surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]'),
    ) as HTMLElement[]

    await act(async () => {
      firstPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    expect(getSelectedPreviewCard(surface.container).style.backgroundColor).toBe(
      "rgb(255, 0, 170)",
    )

    await act(async () => {
      secondPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    expect(getSelectedPreviewCard(surface.container).style.backgroundColor).toBe(
      "rgb(0, 255, 170)",
    )
  })

  it("preserves card pattern selection separately and resets it to none", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ includeResetOverlay: true })

    await waitForDraftingSurface()

    openCardOnlyMode(surface.container)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Decorations"]'))
    })

    act(() => {
      activateElement(getRadioInputByAriaLabel(surface.container, "Pattern 003"))
    })

    await addQrCode(surface.container)

    act(() => {
      activateElement(getRadioInputByAriaLabel(surface.container, "Pattern 004"))
    })

    const [firstPane, secondPane] = Array.from(
      surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]'),
    ) as HTMLElement[]

    await act(async () => {
      firstPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    expect(getSelectedPreviewCard(surface.container).getAttribute("data-card-pattern")).toBe("g3")

    await act(async () => {
      secondPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    expect(getSelectedPreviewCard(surface.container).getAttribute("data-card-pattern")).toBe("g4")

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Reset defaults"]'))
    })

    expect(getSelectedPreviewCard(surface.container).getAttribute("data-card-pattern")).toBe(
      "none",
    )
  })

  it("preserves card pattern color overrides separately and clears them on reset", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ includeResetOverlay: true })

    await waitForDraftingSurface()

    openCardOnlyMode(surface.container)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Decorations"]'))
    })

    act(() => {
      activateElement(getRadioInputByAriaLabel(surface.container, "Pattern 003"))
    })

    act(() => {
      changeInputValue(
        getRequiredElement(
          surface.container,
          '[data-slot="drafting-card-colors-tab"] [data-slot="drafting-card-pattern-color-input"]',
        ) as HTMLInputElement,
        "#111111",
      )
    })

    await addQrCode(surface.container)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Decorations"]'))
    })

    act(() => {
      activateElement(getRadioInputByAriaLabel(surface.container, "Pattern 003"))
    })

    act(() => {
      changeInputValue(
        getRequiredElement(
          surface.container,
          '[data-slot="drafting-card-colors-tab"] [data-slot="drafting-card-pattern-color-input"]',
        ) as HTMLInputElement,
        "#222222",
      )
    })

    const [firstPane, secondPane] = Array.from(
      surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]'),
    ) as HTMLElement[]

    await act(async () => {
      firstPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    expect(getSelectedPreviewCard(surface.container).style.getPropertyValue("--p1")).toBe(
      "#111111",
    )

    await act(async () => {
      secondPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    expect(getSelectedPreviewCard(surface.container).style.getPropertyValue("--p1")).toBe(
      "#222222",
    )

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Reset defaults"]'))
    })

    const card = getSelectedPreviewCard(surface.container)

    expect(card.getAttribute("data-card-pattern")).toBe("none")
    expect(card.style.getPropertyValue("--p1")).toBe("")
  })

  it("preserves qr background radius separately for each drafting qr layer", async () => {
    const surface = renderSurface()
    const styleButton = getRequiredElement(surface.container, 'button[aria-label="Open Pattern"]')

    act(() => {
      styleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const getRadiusInput = () =>
      getRequiredElement(
        surface.container,
        '[data-slot="drafting-style-radius-slider"] input[type="range"]',
      ) as HTMLInputElement

    act(() => {
      changeInputValue(getRadiusInput(), "36")
    })

    await addQrCode(surface.container)

    act(() => {
      changeInputValue(getRadiusInput(), "72")
    })

    const [firstPane, secondPane] = Array.from(
      surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]'),
    ) as HTMLElement[]

    await act(async () => {
      firstPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    const surfaceRoot = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')
    expect(surfaceRoot.getAttribute("data-qr-radius")).toBe("0.36")

    await act(async () => {
      secondPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    expect(surfaceRoot.getAttribute("data-qr-radius")).toBe("0.72")
  })

  it("preserves qr background shape separately for each drafting qr layer", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()
    const backgroundButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Shape"]',
    )

    act(() => {
      backgroundButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      activateElement(
        getRadioInputByAriaLabel(surface.container, "Circle"),
      )
    })

    await addQrCode(surface.container)

    act(() => {
      activateElement(
        getRadioInputByAriaLabel(surface.container, "Badge"),
      )
    })

    const [firstPane, secondPane] = Array.from(
      surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]'),
    ) as HTMLElement[]

    await act(async () => {
      firstPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    const surfaceRoot = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')
    expect(surfaceRoot.getAttribute("data-background-shape-id")).toBe("circle")

    await act(async () => {
      secondPane.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    expect(surfaceRoot.getAttribute("data-background-shape-id")).toBe("hexagon")
  })

  it("expands style color modes without selecting them from the accordion header", () => {
    const surface = renderSurface()
    const styleButton = getRequiredElement(surface.container, 'button[aria-label="Open Pattern"]')

    act(() => {
      styleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const solidItem = getRequiredElement(
      surface.container,
      '[data-slot="accordion-item"][data-item-id="solid"]',
    )
    const gradientTrigger = getAccordionTriggerByText(surface.container, "Gradient")
    const gradientItem = getRequiredElement(
      surface.container,
      '[data-slot="accordion-item"][data-item-id="gradient"]',
    )
    const paletteTrigger = getAccordionTriggerByText(surface.container, "Palette")
    const paletteItem = getRequiredElement(
      surface.container,
      '[data-slot="accordion-item"][data-item-id="palette"]',
    )

    expect(solidItem.getAttribute("data-selected")).toBe("true")
    expect(solidItem.getAttribute("data-state")).toBe("open")
    expect(gradientItem.getAttribute("data-selected")).toBe("false")
    expect(paletteItem.getAttribute("data-selected")).toBe("false")

    act(() => {
      activateElement(gradientTrigger)
    })

    expect(gradientItem.getAttribute("data-selected")).toBe("false")
    expect(gradientItem.getAttribute("data-state")).toBe("open")
    expect(solidItem.getAttribute("data-state")).toBe("open")
    const gradientTypeGrid = getRequiredElement(
      gradientItem,
      '[data-slot="gradient-type-option-grid"]',
    )
    expect(gradientTypeGrid.className).toContain("max-w-[320px]")
    expect(gradientTypeGrid.className).toContain("justify-items-stretch")
    const gradientTypeCards = Array.from(
      gradientTypeGrid.querySelectorAll('[data-slot="option-card"]'),
    )
    expect(gradientTypeCards).toHaveLength(2)
    const gradientTypeRoots = Array.from(
      gradientTypeGrid.querySelectorAll('[data-slot="option-card-root"]'),
    )
    expect(
      gradientTypeRoots.every((root) =>
        root.className.includes("[&_[data-slot=option-card]]:h-[44px]"),
      ),
    ).toBe(true)
    expect(gradientTypeRoots.every((root) => root.className.includes("w-full"))).toBe(true)
    expect(
      gradientTypeRoots.every((root) =>
        root.className.includes("[&_[data-slot=option-card]]:w-full"),
      ),
    ).toBe(true)
    expect(
      gradientTypeRoots.every((root) =>
        root.className.includes(
          "[&_[data-slot=option-card]]:!shadow-[0_0_12px_0_rgb(var(--drafting-ink-rgb)/0.07),0_2px_5px_0_rgb(var(--drafting-ink-rgb)/0.045)]",
        ),
      ),
    ).toBe(true)
    expect(
      gradientTypeRoots.every((root) =>
        root.className.includes(
          "hover:[&_[data-slot=option-card]]:!shadow-[0_0_20px_1px_rgb(var(--drafting-ink-rgb)/0.09),0_4px_10px_0_rgb(var(--drafting-ink-rgb)/0.06)]",
        ),
      ),
    ).toBe(true)
    const gradientTypeLabels = Array.from(
      gradientTypeGrid.querySelectorAll('[data-slot="option-card-label"]'),
    )
    expect(gradientTypeLabels.map((label) => label.textContent)).toEqual(["Linear", "Radial"])
    expect(gradientTypeLabels.every((label) => label.className.includes("sr-only"))).toBe(true)
    expect(gradientTypeCards.map((card) => card.textContent)).toEqual(["Linear", "Radial"])
    const gradientTypeIcons = Array.from(gradientTypeGrid.querySelectorAll("svg"))
    expect(gradientTypeIcons.length).toBeGreaterThan(0)
    expect(gradientTypeIcons.every((icon) => icon.getAttribute("color") === "currentColor")).toBe(true)

    act(() => {
      activateElement(paletteTrigger)
    })

    expect(paletteItem.getAttribute("data-selected")).toBe("false")
    expect(paletteItem.getAttribute("data-state")).toBe("open")
    expect(gradientItem.getAttribute("data-state")).toBe("open")

    act(() => {
      activateElement(getButtonByExactText(surface.container, "Use palette"))
    })

    expect(paletteItem.getAttribute("data-selected")).toBe("true")
  })

  it("renders a drafting color accordion for the corner frame color tab with solid and gradient", () => {
    const surface = renderSurface()
    const cornerFrameButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Corners"]',
    )

    act(() => {
      cornerFrameButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-corner-square-color-accordion"]',
    )

    expect(accordion.querySelectorAll('[data-slot="accordion-item"]').length).toBe(2)
    expect(accordion.textContent).toContain("Solid")
    expect(accordion.textContent).toContain("Gradient")
  })

  it("expands the corner frame gradient color mode without selecting it from the accordion header", () => {
    const surface = renderSurface()
    const cornerFrameButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Corners"]',
    )

    act(() => {
      cornerFrameButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-corner-square-color-accordion"]',
    )
    const solidItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="solid"]',
    )
    const gradientItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="gradient"]',
    )

    expect(solidItem.getAttribute("data-selected")).toBe("true")
    expect(solidItem.getAttribute("data-state")).toBe("open")

    act(() => {
      activateElement(getAccordionTriggerByText(accordion, "Gradient"))
    })

    expect(gradientItem.getAttribute("data-selected")).toBe("false")
    expect(gradientItem.getAttribute("data-state")).toBe("open")
    expect(solidItem.getAttribute("data-state")).toBe("open")
  })

  it("renders a selectable option-card grid for the corner frame style tab", () => {
    const surface = renderSurface()
    const cornerFrameButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Corners"]',
    )

    act(() => {
      cornerFrameButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const cornerFrameGrid = getRequiredElement(
      surface.container,
      '[data-slot="drafting-corner-square-option-grid"]',
    )
    const roundedLargeInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Large rounded"]',
    ) as HTMLInputElement
    const squareInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="Square"]',
    ) as HTMLInputElement

    expect(cornerFrameGrid.getAttribute("role")).toBe("radiogroup")
    expect(
      cornerFrameGrid.querySelectorAll('[data-slot="option-card"]').length,
    ).toBe(15)
    expect(cornerFrameGrid.innerHTML).toContain("size-[4.5rem]")
    expect(roundedLargeInput.checked).toBe(true)
    expect(squareInput.checked).toBe(false)

    act(() => {
      squareInput.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(roundedLargeInput.checked).toBe(false)
    expect(squareInput.checked).toBe(true)
  })

  it("renders a selectable option-card grid for the corner dot style tab", () => {
    const surface = renderSurface()
    const cornerDotButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Corners"]',
    )

    act(() => {
      cornerDotButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const cornerDotGrid = getRequiredElement(
      surface.container,
      '[data-slot="drafting-corner-dot-option-grid"]',
    )
    const circleInput = getRequiredElement(
      cornerDotGrid,
      'input[type="radio"][aria-label="Circle"]',
    ) as HTMLInputElement
    const roundedInput = getRequiredElement(
      cornerDotGrid,
      'input[type="radio"][aria-label="Rounded"]',
    ) as HTMLInputElement

    expect(cornerDotGrid.getAttribute("role")).toBe("radiogroup")
    expect(cornerDotGrid.querySelectorAll('[data-slot="option-card"]').length).toBe(20)
    expect(circleInput.checked).toBe(true)
    expect(roundedInput.checked).toBe(false)

    act(() => {
      roundedInput.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(circleInput.checked).toBe(false)
    expect(roundedInput.checked).toBe(true)
  })

  it("renders a drafting color accordion for the corner dot color tab with solid and gradient", () => {
    const surface = renderSurface()
    const cornerDotButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Corners"]',
    )

    act(() => {
      cornerDotButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-corner-dot-color-accordion"]',
    )

    expect(accordion.querySelectorAll('[data-slot="accordion-item"]').length).toBe(2)
    expect(accordion.textContent).toContain("Solid")
    expect(accordion.textContent).toContain("Gradient")
  })

  it("expands the corner dot gradient color mode without selecting it from the accordion header", () => {
    const surface = renderSurface()
    const cornerDotButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Corners"]',
    )

    act(() => {
      cornerDotButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-corner-dot-color-accordion"]',
    )
    const solidItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="solid"]',
    )
    const gradientItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="gradient"]',
    )

    expect(solidItem.getAttribute("data-selected")).toBe("true")
    expect(solidItem.getAttribute("data-state")).toBe("open")

    act(() => {
      activateElement(getAccordionTriggerByText(accordion, "Gradient"))
    })

    expect(gradientItem.getAttribute("data-selected")).toBe("false")
    expect(gradientItem.getAttribute("data-state")).toBe("open")
    expect(solidItem.getAttribute("data-state")).toBe("open")
  })

  it("renders a drafting color accordion for the background colors tab with solid and gradient", () => {
    const surface = renderSurface()
    const backgroundButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Shape"]',
    )

    act(() => {
      backgroundButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-background-color-accordion"]',
    )

    expect(accordion.querySelectorAll('[data-slot="accordion-item"]').length).toBe(2)
    expect(accordion.textContent).toContain("Solid")
    expect(accordion.textContent).toContain("Gradient")
  })

  it("adds a dedicated background shape tab between colors and upload", () => {
    const surface = renderSurface()
    const backgroundButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Shape"]',
    )

    act(() => {
      backgroundButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-background-color-accordion"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-background-shape-tab"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-background-upload-accordion"]')).not.toBeNull()
  })

  it("renders background shape option cards and updates the active qr payload", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()
    const backgroundButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Shape"]',
    )

    await waitForDraftingSurface()

    act(() => {
      backgroundButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const shapeGrid = getRequiredElement(
      surface.container,
      '[data-slot="drafting-background-shape-grid"]',
    )

    expect(shapeGrid.querySelectorAll('[data-slot="option-card"]')).toHaveLength(23)

    await act(async () => {
      activateElement(getRadioInputByAriaLabel(shapeGrid, "Circle"))
      await flushPromises()
      await flushPromises()
    })

    const shapeSettings = getRequiredElement(
      surface.container,
      '[data-slot="drafting-background-shape-settings"]',
    )
    expect(
      getRequiredElement(
        shapeSettings,
        '[data-slot="drafting-background-shape-padding-settings"]',
      ).textContent,
    ).toContain("Shape")
    const shapeSizeInput = getRequiredElement(
      shapeSettings,
      '[data-slot="drafting-background-shape-size-slider"] input[type="range"]',
    ) as HTMLInputElement

    await act(async () => {
      changeInputValue(shapeSizeInput, "24")
      await flushPromises()
      await flushPromises()
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-background-shape-id",
      ),
    ).toBe("circle")
    expect(
      getRequiredElement(surface.container, '[data-slot="dashboard-compose-card"]').getAttribute(
        "data-card-shape",
      ),
    ).toBeNull()
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-qr-background"]').getAttribute(
        "data-background-shape",
      ),
    ).toBe("circle")
    expect(buildDashboardQrNodePayloadSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        backgroundShapeId: "none",
        backgroundShapeOptions: expect.objectContaining({
          edgeBlur: 0,
          paddingPx: 0,
          strokeWidth: 0,
        }),
      }),
    )
  })

  it("keeps background surface settings available when no decorative shape is selected", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()
    const backgroundButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Shape"]',
    )

    await waitForDraftingSurface()

    act(() => {
      backgroundButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const shapeSettings = getRequiredElement(
      surface.container,
      '[data-slot="drafting-background-shape-settings"]',
    )
    const shapeSizeInput = getRequiredElement(
      shapeSettings,
      '[data-slot="drafting-background-shape-size-slider"] input[type="range"]',
    ) as HTMLInputElement

    await act(async () => {
      changeInputValue(shapeSizeInput, "16")
      await flushPromises()
      await flushPromises()
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-background-shape-id",
      ),
    ).toBe("none")
    expect(buildDashboardQrNodePayloadSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        backgroundShapeId: "none",
        backgroundShapeOptions: expect.objectContaining({
          paddingPx: 0,
          strokeWidth: 0,
        }),
      }),
    )
  })

  it("clears the selected background shape when reset defaults is used", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ includeResetOverlay: true })
    const backgroundButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Shape"]',
    )

    act(() => {
      backgroundButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      activateElement(
        getRadioInputByAriaLabel(surface.container, "Circle"),
      )
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-background-shape-id",
      ),
    ).toBe("circle")

    await act(async () => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Reset defaults"]'))
      await flushPromises()
      await flushPromises()
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-background-shape-id",
      ),
    ).toBe("none")
  })

  it("expands the background gradient color mode without selecting it from the accordion header", () => {
    const surface = renderSurface()
    const backgroundButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Shape"]',
    )

    act(() => {
      backgroundButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-background-color-accordion"]',
    )
    const solidItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="solid"]',
    )
    const gradientItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="gradient"]',
    )

    expect(solidItem.getAttribute("data-selected")).toBe("true")
    expect(solidItem.getAttribute("data-state")).toBe("open")

    act(() => {
      activateElement(getAccordionTriggerByText(accordion, "Gradient"))
    })

    expect(gradientItem.getAttribute("data-selected")).toBe("false")
    expect(gradientItem.getAttribute("data-state")).toBe("open")
    expect(solidItem.getAttribute("data-state")).toBe("open")
  })

  it("renders a drafting color accordion for the logo colors tab with solid and gradient", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-logo-color-accordion"]',
    )

    expect(accordion.querySelectorAll('[data-slot="accordion-item"]').length).toBe(2)
    expect(accordion.textContent).toContain("Solid")
    expect(accordion.textContent).toContain("Gradient")
  })

  it("expands the logo gradient color mode without selecting it from the accordion header", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-logo-color-accordion"]',
    )
    const solidItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="solid"]',
    )
    const gradientItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="gradient"]',
    )

    expect(solidItem.getAttribute("data-selected")).toBe("true")
    expect(solidItem.getAttribute("data-state")).toBe("open")

    act(() => {
      activateElement(getAccordionTriggerByText(accordion, "Gradient"))
    })

    expect(gradientItem.getAttribute("data-selected")).toBe("false")
    expect(gradientItem.getAttribute("data-state")).toBe("open")
    expect(solidItem.getAttribute("data-state")).toBe("open")
  })

  it("renders the drafting brand icon tab with category filters and search", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const brandTab = getRequiredElement(
      surface.container,
      '[data-slot="drafting-brand-icon-tab"]',
    )

    expect(brandTab.querySelector('[data-slot="drafting-brand-icon-picker"]')).not.toBeNull()
    const searchInput = getRequiredElement(
      brandTab,
      'input[aria-label="Search brand icons"]',
    ) as HTMLInputElement
    const searchIcon = getRequiredElement(
      brandTab,
      '[data-slot="drafting-brand-icon-search-icon"]',
    )
    const categoryPicker = getRequiredElement(
      brandTab,
      '[data-slot="drafting-brand-icon-category-picker"]',
    )

    expect(searchInput.placeholder).toBe("Search icons")
    expect(searchIcon.getAttribute("aria-hidden")).toBe("true")
    expect(
      Boolean(
        searchInput.compareDocumentPosition(categoryPicker) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      brandTab.querySelectorAll('[data-slot="drafting-brand-icon-option"]').length,
    ).toBeGreaterThan(0)

    const brandInput = getRequiredElement(
      brandTab,
      'input[data-slot="option-card-input"][aria-label="Instagram"]',
    )
    const brandInputRoot = brandInput.closest('[data-slot="option-card-root"]')

    expect(brandInput.className).toContain("absolute")
    expect(brandInput.className).toContain("inset-0")
    expect(brandInput.className).not.toContain("sr-only")
    expect(brandInputRoot?.className).toContain("relative")
  })

  it("selects a drafting brand icon and marks preset mode active", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const instagramOption = getRequiredElement(
      surface.container,
      'input[data-slot="option-card-input"][aria-label="Instagram"]',
    ) as HTMLInputElement

    expect(surface.container.querySelector('[data-logo-source-mode="preset"]')).toBeNull()

    act(() => {
      activateElement(instagramOption)
    })

    expect(instagramOption.checked).toBe(true)
    expect(
      surface.container.querySelector('[data-logo-source-mode="preset"]'),
    ).not.toBeNull()
    expect(
      surface.container.querySelector('[data-logo-preset-id="instagram"]'),
    ).not.toBeNull()
  })

  it("updates preset-driven logo output when the drafting solid color changes", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      activateElement(
        getRequiredElement(
          surface.container,
          'input[data-slot="option-card-input"][aria-label="Instagram"]',
        ),
      )
    })

    const previousPresetValue =
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-logo-preset-value",
      ) ?? ""
    const solidColorInput = getRequiredElement(
      surface.container,
      '[data-slot="drafting-logo-color-accordion"] [data-item-id="solid"] [data-slot="color-picker"] input',
    ) as HTMLInputElement

    act(() => {
      changeInputValue(solidColorInput, "#151515")
      solidColorInput.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }),
      )
    })

    const surfaceRoot = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')

    expect(surfaceRoot.getAttribute("data-logo-source-mode")).toBe("preset")
    expect(surfaceRoot.getAttribute("data-logo-preset-id")).toBe("instagram")
    expect(surfaceRoot.getAttribute("data-logo-preset-value")).not.toBe(previousPresetValue)
  })

  it("updates preset-driven logo output when the drafting gradient changes", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      activateElement(
        getRequiredElement(
          surface.container,
          'input[data-slot="option-card-input"][aria-label="Instagram"]',
        ),
      )
    })

    const logoColorAccordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-logo-color-accordion"]',
    )

    act(() => {
      activateElement(getAccordionTriggerByText(logoColorAccordion, "Gradient"))
    })

    const previousPresetValue =
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-logo-preset-value",
      ) ?? ""
    const gradientColorInput = getRequiredElement(
      surface.container,
      '[data-slot="drafting-logo-color-accordion"] [data-item-id="gradient"] [data-slot="color-picker"] input',
    ) as HTMLInputElement

    act(() => {
      changeInputValue(gradientColorInput, "#151515")
      gradientColorInput.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }),
      )
    })

    const surfaceRoot = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')

    expect(surfaceRoot.getAttribute("data-logo-source-mode")).toBe("preset")
    expect(surfaceRoot.getAttribute("data-logo-preset-id")).toBe("instagram")
    expect(surfaceRoot.getAttribute("data-logo-color-mode")).toBe("gradient")
    expect(surfaceRoot.getAttribute("data-logo-preset-value")).not.toBe(previousPresetValue)
  })

  it("renders a drafting source accordion for the background upload tab with upload file and remote url", () => {
    const surface = renderSurface()
    const backgroundButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Shape"]',
    )

    act(() => {
      backgroundButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-background-upload-accordion"]',
    )

    expect(accordion.querySelectorAll('[data-slot="accordion-item"]').length).toBe(2)
    expect(accordion.textContent).toContain("Upload file")
    expect(accordion.textContent).toContain("Remote URL")
    expect(surface.container.querySelector('[aria-label="File upload"]')).not.toBeNull()

    act(() => {
      activateElement(getAccordionTriggerByText(accordion, "Remote URL"))
    })

    expect(
      surface.container.querySelector('input[aria-label="Shape image URL"]'),
    ).not.toBeNull()
  })

  it("expands the logo remote url source mode without selecting it from the accordion header", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const accordion = getRequiredElement(
      surface.container,
      '[data-slot="drafting-logo-upload-accordion"]',
    )
    const uploadItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="upload"]',
    )
    const urlItem = getRequiredElement(
      accordion,
      '[data-slot="accordion-item"][data-item-id="url"]',
    )

    expect(uploadItem.getAttribute("data-selected")).toBe("true")
    expect(uploadItem.getAttribute("data-state")).toBe("open")

    act(() => {
      activateElement(getAccordionTriggerByText(accordion, "Remote URL"))
    })

    expect(urlItem.getAttribute("data-selected")).toBe("false")
    expect(urlItem.getAttribute("data-state")).toBe("open")
    expect(uploadItem.getAttribute("data-state")).toBe("open")
  })

  it("clears the drafting preset selection when entering a remote logo url", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      activateElement(
        getRequiredElement(
          surface.container,
          'input[data-slot="option-card-input"][aria-label="Instagram"]',
        ),
      )
    })

    const remoteUrlTrigger = getAccordionTriggerByText(
      getRequiredElement(surface.container, '[data-slot="drafting-logo-upload-accordion"]'),
      "Remote URL",
    )

    act(() => {
      activateElement(remoteUrlTrigger)
    })

    const remoteUrlInput = getRequiredElement(
      surface.container,
      'input[aria-label="Remote logo URL"]',
    ) as HTMLInputElement

    act(() => {
      changeInputValue(remoteUrlInput, "https://example.com/logo.png")
    })

    const surfaceRoot = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')

    expect(surfaceRoot.getAttribute("data-logo-source-mode")).toBe("url")
    expect(surfaceRoot.getAttribute("data-logo-preset-id")).toBe("")
    expect(surfaceRoot.getAttribute("data-logo-preset-value")).toBe("")
  })

  it("clears the drafting preset selection when uploading a logo file", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      activateElement(
        getRequiredElement(
          surface.container,
          'input[data-slot="option-card-input"][aria-label="Instagram"]',
        ),
      )
    })

    const fileInput = getRequiredElement(
      surface.container,
      'input[aria-label="File input"]',
    ) as HTMLInputElement
    const logoFile = new File(["logo"], "logo.png", { type: "image/png" })

    vi.useFakeTimers()

    act(() => {
      setInputFiles(fileInput, [logoFile])
      fileInput.dispatchEvent(new Event("change", { bubbles: true }))
    })

    act(() => {
      vi.runAllTimers()
    })

    vi.useRealTimers()

    const surfaceRoot = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')

    expect(surfaceRoot.getAttribute("data-logo-source-mode")).toBe("upload")
    expect(surfaceRoot.getAttribute("data-logo-preset-id")).toBe("")
    expect(surfaceRoot.getAttribute("data-logo-preset-value")).toBe("")
  })

  it("renders the logo size tab with both sliders and the hide-background toggle", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const sizeTab = getRequiredElement(
      surface.container,
      '[data-slot="drafting-logo-size-tab"]',
    )

    expect(sizeTab.querySelector('[data-slot="drafting-logo-size-slider"]')).not.toBeNull()
    expect(sizeTab.querySelector('[data-slot="drafting-logo-margin-slider"]')).not.toBeNull()
    expect(sizeTab.querySelector('[data-slot="drafting-logo-hide-background-dots"]')).not.toBeNull()
    expect(surface.container.textContent).toContain("Logo size")
    expect(surface.container.textContent).toContain("Logo margin")
    expect(surface.container.textContent).toContain("Hide background dots")
  })

  it("seeds the logo size tab defaults from the shared qr studio defaults", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')
    const defaultState = createDefaultQrStudioState()

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const sizeTab = getRequiredElement(
      surface.container,
      '[data-slot="drafting-logo-size-tab"]',
    )
    const hideBackgroundDotsSwitch = getRequiredElement(
      sizeTab,
      '#drafting-hide-background-dots',
    )

    expect(sizeTab.textContent).toContain(`Logo size: ${Math.round(defaultState.imageOptions.imageSize * 100)}%`)
    expect(sizeTab.textContent).toContain(`Logo margin: ${Math.round(defaultState.imageOptions.margin)} px`)
    expect(hideBackgroundDotsSwitch.getAttribute("aria-checked")).toBe(
      String(defaultState.imageOptions.hideBackgroundDots),
    )
  })

  it("updates the logo size tab hide-background toggle when toggled", () => {
    const surface = renderSurface()
    const logoButton = getRequiredElement(surface.container, 'button[aria-label="Open Logo"]')
    const defaultState = createDefaultQrStudioState()

    act(() => {
      logoButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const hideBackgroundDotsSwitch = getRequiredElement(
      surface.container,
      '#drafting-hide-background-dots',
    )

    expect(hideBackgroundDotsSwitch.getAttribute("aria-checked")).toBe(
      String(defaultState.imageOptions.hideBackgroundDots),
    )

    act(() => {
      activateElement(hideBackgroundDotsSwitch)
    })

    expect(hideBackgroundDotsSwitch.getAttribute("aria-checked")).toBe(
      String(!defaultState.imageOptions.hideBackgroundDots),
    )
  })

  it("renders the encoding tab with a type number slider and four error correction cards", () => {
    const surface = renderSurface()
    const encodingButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Encoding"]',
    )
    const defaultState = createDefaultQrStudioState()

    act(() => {
      encodingButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const encodingTab = getRequiredElement(
      surface.container,
      '[data-slot="drafting-encoding-tab"]',
    )
    const surfaceRoot = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')
    const quartileInput = getRequiredElement(
      encodingTab,
      'input[type="radio"][aria-label="Quartile (Q)"]',
    ) as HTMLInputElement

    expect(
      encodingTab.querySelector('[data-slot="drafting-type-number-slider"]'),
    ).not.toBeNull()
    expect(
      encodingTab.querySelectorAll('input[name="drafting-error-correction"]'),
    ).toHaveLength(4)
    expect(encodingTab.textContent).toContain("Type number: Auto")
    expect(encodingTab.textContent).toContain("Error correction")
    expect(quartileInput.checked).toBe(true)
    expect(surfaceRoot.getAttribute("data-qr-type-number")).toBe(
      String(defaultState.qrOptions.typeNumber),
    )
    expect(surfaceRoot.getAttribute("data-qr-error-correction-level")).toBe(
      defaultState.qrOptions.errorCorrectionLevel,
    )
  })

  it("updates the selected error correction level from the encoding option cards", () => {
    const surface = renderSurface()
    const encodingButton = getRequiredElement(
      surface.container,
      'button[aria-label="Open Encoding"]',
    )

    act(() => {
      encodingButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const highInput = getRequiredElement(
      surface.container,
      'input[type="radio"][aria-label="High (H)"]',
    ) as HTMLInputElement

    act(() => {
      activateElement(highInput)
    })

    expect(highInput.checked).toBe(true)
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-error-correction-level",
      ),
    ).toBe("H")
  })

  it("does not expose the dashboard edit mode toggle or edit rail on drafting", () => {
    const surface = renderSurface()

    expect(surface.container.querySelector('button[aria-label="Toggle edit mode"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-compose-edit-mode"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-edit-rail"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-edit-nav-scroll-area"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-edit-panel-scroll"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-edit-page"]')).toBeNull()
    expect(
      surface.container.querySelector('button[aria-label="Open QR type options"]'),
    ).not.toBeNull()
    expect(surface.container.querySelector('[data-drafting-tool-button="true"]')).not.toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Page"]')).toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Position"]')).toBeNull()
    expect(surface.container.querySelector('button[aria-label="Open Assets"]')).toBeNull()
  })

  it("does not render a document guide overlay in the default compose surface", () => {
    const surface = renderSurface()

    expect(
      surface.container.querySelector('[data-slot="dashboard-compose-document-guides"]'),
    ).toBeNull()
  })

  it("keeps the normal drafting tool rail active because edit mode is unavailable", () => {
    const surface = renderSurface()
    const layersButton = getRequiredElement(surface.container, 'button[aria-label="Open Layers"]')

    act(() => {
      activateElement(layersButton)
    })

    expect(surface.container.querySelector('button[aria-label="Toggle edit mode"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-edit-rail"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-layers-tab"]')).not.toBeNull()
    expect(getRequiredElement(surface.container, 'button[aria-label="Open Layers"]').getAttribute("aria-pressed")).toBe("true")
  })

  it("adds a duplicated qr layer from the bottom toolbar and selects it", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface()

    await waitForDraftingSurface()

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]')).toHaveLength(1)

    await addQrCode(surface.container)

    const selectedNodeId = getRequiredElement(
      surface.container,
      '[data-slot="drafting-surface"]',
    ).getAttribute("data-compose-selected-node-id")

    expect(selectedNodeId).toMatch(/^dashboard-qr-node-/)
    expect(selectedNodeId).not.toBe(DASHBOARD_QR_NODE_ID)
    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]')).toHaveLength(2)
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-compose-edit-mode",
      ),
    ).toBe("false")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-compose-edit-section",
      ),
    ).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-edit-rail"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-layer-row"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-layer-row"]')).toBeNull()

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Layers"]'))
    })

    expect(surface.container.querySelectorAll('[data-slot="drafting-layer-row"]')).toHaveLength(2)
    expect(surface.container.textContent).toContain("QR Code 2")
    expect(buildDashboardQrNodePayloadSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: "https://new-qr-studio.local/launch",
      }),
    )
  })

  it("swaps qr panes and keeps layers plus downloads in visual order", async () => {
    buildDashboardQrNodePayloadSpy.mockImplementation((state?: QrStudioState) =>
      Promise.resolve({
        markup: `<svg data-value="${state?.data ?? ""}" />`,
        naturalHeight: 320,
        naturalWidth: 320,
      }),
    )
    const surface = renderSurface()

    await waitForDraftingSurface()

    await act(async () => {
      changeInputValue(
        getRequiredElement(
          surface.container,
          'input[aria-label="Link URL"]',
        ) as HTMLInputElement,
        "https://example.com/first",
      )
      await flushPromises()
      await flushPromises()
    })

    await addQrCode(surface.container)

    await act(async () => {
      changeInputValue(
        getRequiredElement(
          surface.container,
          'input[aria-label="Link URL"]',
        ) as HTMLInputElement,
        "https://example.com/second",
      )
      await flushPromises()
      await flushPromises()
    })

    const [firstPane, secondPane] = Array.from(
      surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]'),
    ) as HTMLElement[]
    const dataTransfer = createDataTransfer()

    await act(async () => {
      firstPane.dispatchEvent(createDragEvent("dragstart", dataTransfer))
      secondPane.dispatchEvent(createDragEvent("dragover", dataTransfer))
      secondPane.dispatchEvent(createDragEvent("drop", dataTransfer))
      await flushPromises()
      await flushPromises()
    })

    const swappedPaneNodes = Array.from(
      surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]'),
    ) as HTMLElement[]

    expect(swappedPaneNodes.map((node) => node.getAttribute("data-node-id"))).toEqual([
      "https://example.com/second",
      "https://example.com/first",
    ])

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Open Layers"]'))
    })

    const layerRows = Array.from(
      surface.container.querySelectorAll('[data-slot="drafting-layer-row"]'),
    )

    expect(layerRows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("QR Code"),
      expect.stringContaining("QR Shape"),
    ])

    await act(async () => {
      activateElement(
        getRequiredElement(surface.container, 'input[aria-label="Download All QR codes"]'),
      )
      activateElement(getRequiredElement(surface.container, 'input[aria-label="Export SVG"]'))
      await flushPromises()
    })

    await act(async () => {
      activateElement(getButtonByExactText(surface.container, "Download SVG"))
      await flushPromises()
    })

    expect(downloadDashboardQrBatchZipExportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [
          expect.objectContaining({
            name: "QR Code",
            originalSvgMarkup: expect.stringContaining(
              'data-value="https://example.com/second"',
            ),
          }),
          expect.objectContaining({
            name: "QR Code 2",
            originalSvgMarkup: expect.stringContaining(
              'data-value="https://example.com/first"',
            ),
          }),
        ],
      }),
    )
  })

  it("keeps the stacked inspector as the dedicated middle scroll area", () => {
    const surface = renderSurface()
    const navFrame = getRequiredElement(surface.container, '[data-slot="drafting-nav"]')
    const navScrollArea = getRequiredElement(
      surface.container,
      '[data-slot="drafting-nav-scroll-area"]',
    )
    const navScroll = getRequiredElement(
      surface.container,
      '[data-slot="drafting-nav-scroll"]',
    )
    const navScrollContent = getRequiredElement(
      surface.container,
      '[data-slot="drafting-nav-scroll-content"]',
    )
    const scrollFrame = getRequiredElement(surface.container, '[data-slot="drafting-scroll-area"]')
    const panelScrollArea = getRequiredElement(
      surface.container,
      '[data-slot="drafting-tab-panel-scroll-area"]',
    )
    const panelScroll = getRequiredElement(
      surface.container,
      '[data-slot="drafting-tab-panel-scroll"]',
    )

    expect(surface.container.querySelector('[data-slot="drafting-tabs-sticky"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="tabs-list"]')).toBeNull()
    expect(navFrame.className).toContain("isolate")
    expect(navFrame.className).toContain("order-2")
    expect(navFrame.className).toContain("border-t")
    expect(navFrame.className).toContain("lg:border-t-0")
    expect(navFrame.className).not.toContain("border-y")
    expect(navFrame.className).toContain("border-transparent")
    expect(navFrame.className).not.toContain("overflow-y-auto")
    expect(navFrame.className).not.toContain("py-4")
    expect(navScrollArea.className).toContain("h-[var(--new-mobile-rail-height)]")
    expect(navScrollArea.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull()
    expect(navScrollArea.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
    expect(navScroll.className).toContain("min-h-0")
    expect(navScrollContent.className).toContain("flex-row")
    expect(navScrollContent.className).toContain("lg:flex-col")
    expect(navScrollContent.className).toContain("py-2")
    expect(navScrollContent.className).toContain("lg:py-4")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-tool-button-icon"]').className,
    ).toContain("flex")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-tool-button-icon"]').className,
    ).not.toContain("hidden")
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-tool-button-icon"]').className,
    ).toContain("lg:size-10")
    expect(
      getRequiredElement(surface.container, '[data-drafting-tool-button="true"]').className,
    ).toContain("h-16")
    expect(
      getRequiredElement(surface.container, '[data-drafting-tool-button="true"]').className,
    ).toContain("w-20")
    expect(
      getRequiredElement(surface.container, '[data-drafting-tool-button="true"]').className,
    ).toContain("min-w-20")
    expect(
      getRequiredElement(surface.container, '[data-drafting-tool-button="true"]').className,
    ).toContain("flex-col")
    expect(scrollFrame.className).toContain("hidden")
    expect(scrollFrame.className).toContain("lg:block")
    expect(scrollFrame.className).not.toContain("order-3")
    expect(scrollFrame.className).not.toContain("overflow-y-auto")
    expect(panelScrollArea.getAttribute("data-slot")).toBe("drafting-tab-panel-scroll-area")
    expect(panelScrollArea.className).toContain("h-full")
    expect(panelScroll.className).toContain("overflow-x-hidden")
    expect(panelScrollArea.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull()
    expect(panelScrollArea.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
    expect(panelScroll.getAttribute("data-active-tool")).toBe("content")
    expect(panelScroll.getAttribute("data-active-tab")).toBeNull()

    const globalsSource = readFileSync("app/globals.css", "utf8")

    expect(globalsSource).toContain('[data-slot="drafting-nav"]::before')
    expect(globalsSource).not.toContain('[data-slot="drafting-nav"]::after')
    expect(globalsSource).toContain('[data-slot="drafting-tab-panel-scroll"]')
    expect(globalsSource).toContain("scrollbar-width: none")
    expect(globalsSource).toContain("::-webkit-scrollbar")
  })

  it("keeps the qr renderer foreground-only on first render and after reset", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ includeResetOverlay: true, openDownloadPopover: false })

    await waitForDraftingSurface()

    const initialCall = buildDashboardQrNodePayloadSpy.mock.calls as unknown as Array<
      [QrStudioState]
    >
    const initialState = initialCall[0]?.[0]

    expect(initialState?.backgroundOptions.transparent).toBe(true)
    expect(initialState?.backgroundShapeId).toBe("none")
    expect(initialState?.backgroundGradient.enabled).toBe(false)
    expect(initialState?.width).toBe(240)
    expect(initialState?.height).toBe(240)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Reset defaults"]'))
    })

    await waitForDraftingSurface()

    const resetCall = buildDashboardQrNodePayloadSpy.mock.calls as unknown as Array<
      [QrStudioState]
    >
    const resetState = resetCall.at(-1)?.[0]

    expect(resetState?.backgroundOptions.transparent).toBe(true)
    expect(resetState?.backgroundShapeId).toBe("none")
    expect(resetState?.backgroundGradient.enabled).toBe(false)
    expect(resetState?.width).toBe(240)
    expect(resetState?.height).toBe(240)
  })

  it("renders a faint dotted texture behind the neutral pane workspace", () => {
    const surface = renderSurface({ openDownloadPopover: false })
    const composeSurface = getRequiredElement(
      surface.container,
      '[data-slot="dashboard-compose-surface"]',
    )

    expect(composeSurface.getAttribute("data-surface-appearance")).toBe("neutral")
    expect(composeSurface.style.backgroundImage).toContain("radial-gradient(circle")
    expect(composeSurface.style.backgroundImage).toContain(
      "var(--drafting-canvas-dot-rgb)",
    )
    expect(composeSurface.style.backgroundImage).toContain(
      "var(--drafting-canvas-dot-opacity)",
    )
    expect(composeSurface.style.backgroundImage).not.toContain("linear-gradient(45deg")
    expect(composeSurface.style.backgroundSize).toBe("30px 30px")
  })

  it("undoes and redoes QR content edits from the bottom toolbar", async () => {
    vi.useFakeTimers()
    const surface = renderSurface({ openDownloadPopover: false })
    const contentInput = getRequiredElement(
      surface.container,
      'input[aria-label="Link URL"]',
    ) as HTMLInputElement

    await advanceDraftingTimers()

    act(() => {
      changeInputValue(contentInput, "https://example.com/history")
    })
    await advanceDraftingTimers()

    const undoButton = getRequiredElement(
      surface.container,
      'button[aria-label="Undo"]',
    ) as HTMLButtonElement
    const redoButton = getRequiredElement(
      surface.container,
      'button[aria-label="Redo"]',
    ) as HTMLButtonElement

    expect(undoButton.disabled).toBe(false)
    expect(redoButton.disabled).toBe(true)

    act(() => {
      activateElement(undoButton)
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://new-qr-studio.local/launch")
    expect(redoButton.disabled).toBe(false)

    act(() => {
      activateElement(redoButton)
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://example.com/history")
  })

  it("uses keyboard shortcuts for undo and redo without intercepting text input undo", async () => {
    vi.useFakeTimers()
    const surface = renderSurface({ openDownloadPopover: false })
    const contentInput = getRequiredElement(
      surface.container,
      'input[aria-label="Link URL"]',
    ) as HTMLInputElement

    await advanceDraftingTimers()

    act(() => {
      changeInputValue(contentInput, "https://example.com/keyboard")
    })
    await advanceDraftingTimers()

    act(() => {
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "z",
        }),
      )
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://new-qr-studio.local/launch")

    act(() => {
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "Z",
          shiftKey: true,
        }),
      )
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://example.com/keyboard")

    const preventedInputUndo = !contentInput.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "z",
      }),
    )

    expect(preventedInputUndo).toBe(false)
  })

  it("uses keyboard shortcuts from body focus for layer nudging, ordering, and duplicating QR codes", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ openDownloadPopover: false })

    await advanceDraftingTimers()

    const qrLayer = getRequiredElement(
      surface.container,
      '[data-slot="dashboard-compose-node"]',
    ) as HTMLElement

    expect(qrLayer.style.transform).toContain("translate3d(-120px")

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowRight",
          shiftKey: true,
        }),
      )
    })

    expect(qrLayer.style.transform).toContain("translate3d(-110px")

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "d",
        }),
      )
    })
    await advanceDraftingTimers()

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]')).toHaveLength(2)
  })

  it("copies and pastes selected layers with keyboard shortcuts", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    let clipboardText = ""
    const writeText = vi.fn(async (value: string) => {
      clipboardText = value
    })
    const readText = vi.fn(async () => clipboardText)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { readText, writeText },
    })
    const surface = renderSurface({ openDownloadPopover: false })

    await advanceDraftingTimers()

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]')).toHaveLength(1)

    await act(async () => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "c",
        }),
      )
      await flushPromises()
      await flushPromises()
    })

    expect(writeText).toHaveBeenCalledOnce()
    expect(JSON.parse(clipboardText)).toMatchObject({
      sourceNodeId: "dashboard-qr-node",
      type: "new-qr/drafting-layers",
      version: 1,
    })
    expect(JSON.parse(clipboardText).layers).toHaveLength(1)

    await act(async () => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "v",
        }),
      )
      await flushPromises()
    })
    await advanceDraftingTimers()

    expect(readText).toHaveBeenCalledOnce()
    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]')).toHaveLength(2)
  })

  it("uses keyboard shortcuts to select all, clear selection, order layers, delete cards, and keep the canonical QR", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    let clipboardText = ""
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        readText: vi.fn(async () => clipboardText),
        writeText: vi.fn(async (value: string) => {
          clipboardText = value
        }),
      },
    })
    const surface = renderSurface({ openDownloadPopover: false })

    await advanceDraftingTimers()

    await act(async () => {
      dispatchBodyShortcut("c", { ctrlKey: true })
      await flushPromises()
      dispatchBodyShortcut("v", { ctrlKey: true })
      await flushPromises()
    })
    await advanceDraftingTimers()

    const pastedQrLayer = Array.from(
      surface.container.querySelectorAll<HTMLElement>('[data-slot="dashboard-compose-node"]'),
    ).find((node) => node.dataset.layerId?.includes(":qr:"))

    expect(pastedQrLayer).toBeDefined()
    expect(pastedQrLayer?.dataset.selected).toBe("true")

    act(() => {
      dispatchBodyShortcut("]", { ctrlKey: true, shiftKey: true })
    })

    expect(Number(pastedQrLayer?.style.zIndex)).toBeGreaterThan(1)

    act(() => {
      dispatchBodyShortcut("[", { ctrlKey: true, shiftKey: true })
    })

    expect(Number(pastedQrLayer?.style.zIndex)).toBe(0)

    act(() => {
      dispatchBodyShortcut("a", { ctrlKey: true })
    })

    expect(
      Array.from(surface.container.querySelectorAll<HTMLElement>("[data-layer-id]"))
        .filter((layer) => layer.dataset.selected === "true")
        .map((layer) => layer.dataset.layerId)
        .filter(Boolean),
    ).toEqual(
      expect.arrayContaining([
        "dashboard-qr-node:card",
        "dashboard-qr-node:qr",
        pastedQrLayer?.dataset.layerId,
      ]),
    )

    act(() => {
      dispatchBodyShortcut("Escape")
    })

    expect(
      Array.from(surface.container.querySelectorAll<HTMLElement>("[data-layer-id]")).some(
        (layer) => layer.dataset.selected === "true",
      ),
    ).toBe(false)

    act(() => {
      pastedQrLayer?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("Delete")
    })

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]')).toHaveLength(1)

    act(() => {
      getRequiredElement(
        surface.container,
        '[data-slot="dashboard-compose-card"][data-layer-id="dashboard-qr-node:card"]',
      ).dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("Delete")
    })

    expect(
      surface.container.querySelector(
        '[data-slot="dashboard-compose-card"][data-layer-id="dashboard-qr-node:card"]',
      ),
    ).toBeNull()

    act(() => {
      getRequiredElement(
        surface.container,
        '[data-slot="dashboard-compose-node"][data-layer-id="dashboard-qr-node:qr"]',
      ).dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("Backspace")
    })

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]')).toHaveLength(1)
  })

  it("uses keyboard shortcuts to group, ungroup, lock, and hide selected layers", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ openDownloadPopover: false })

    await advanceDraftingTimers()

    act(() => {
      dispatchBodyShortcut("a", { ctrlKey: true })
    })

    act(() => {
      dispatchBodyShortcut("g", { ctrlKey: true })
    })

    let groupLayer = getRequiredElement(
      surface.container,
      '[data-slot="drafting-layer-group"]',
    )

    act(() => {
      groupLayer.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("g", { ctrlKey: true, shiftKey: true })
    })

    expect(surface.container.querySelector('[data-slot="drafting-layer-group"]')).toBeNull()

    act(() => {
      dispatchBodyShortcut("a", { ctrlKey: true })
    })

    act(() => {
      dispatchBodyShortcut("g", { ctrlKey: true })
    })

    groupLayer = getRequiredElement(surface.container, '[data-slot="drafting-layer-group"]')

    act(() => {
      groupLayer.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("l", { ctrlKey: true, shiftKey: true })
    })

    expect(groupLayer.className).toContain("cursor-default")

    act(() => {
      dispatchBodyShortcut("l", { ctrlKey: true, shiftKey: true })
    })

    expect(groupLayer.className).toContain("cursor-all-scroll")

    act(() => {
      dispatchBodyShortcut("h", { ctrlKey: true, shiftKey: true })
    })

    expect(surface.container.querySelector('[data-slot="drafting-layer-group"]')).toBeNull()

    act(() => {
      dispatchBodyShortcut("h", { ctrlKey: true, shiftKey: true })
    })

    expect(surface.container.querySelector('[data-slot="drafting-layer-group"]')).not.toBeNull()
  })

  it("keeps editing fields native for select-all, delete, clipboard, and layer shortcuts", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ openDownloadPopover: false })
    const contentInput = getRequiredElement(
      surface.container,
      'input[aria-label="Link URL"]',
    ) as HTMLInputElement

    await advanceDraftingTimers()

    act(() => {
      changeInputValue(contentInput, "https://example.com/native-shortcuts")
      contentInput.focus()
    })

    const shortcutEvents = [
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "a" }),
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Delete" }),
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "c" }),
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "v" }),
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        shiftKey: true,
        key: "]",
      }),
    ]

    for (const event of shortcutEvents) {
      expect(contentInput.dispatchEvent(event)).toBe(true)
    }

    expect(contentInput.value).toBe("https://example.com/native-shortcuts")
    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]')).toHaveLength(1)
  })

  it("uses native clipboard events for copy and paste when keyboard shortcuts become clipboard events", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    let copiedText = ""
    const surface = renderSurface({ openDownloadPopover: false })

    await advanceDraftingTimers()

    const copyEvent = new Event("copy", { bubbles: true, cancelable: true })
    Object.defineProperty(copyEvent, "clipboardData", {
      value: {
        setData: (_type: string, value: string) => {
          copiedText = value
        },
      },
    })

    act(() => {
      document.body.dispatchEvent(copyEvent)
    })

    expect(copiedText).toContain('"type":"new-qr/drafting-layers"')

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        getData: () => copiedText,
      },
    })

    act(() => {
      document.body.dispatchEvent(pasteEvent)
    })
    await advanceDraftingTimers()

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-node"]')).toHaveLength(2)
  })

  it("focuses the drafting surface after selecting a canvas layer", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ openDownloadPopover: false })

    await advanceDraftingTimers()

    const draftingSurface = getRequiredElement(
      surface.container,
      '[data-slot="drafting-surface"]',
    )
    const qrLayer = getRequiredElement(
      surface.container,
      '[data-slot="dashboard-compose-node"]',
    )

    act(() => {
      qrLayer.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(document.activeElement).toBe(draftingSurface)
  })

  it("keeps add QR and reset changes undoable", async () => {
    vi.useFakeTimers()
    const surface = renderSurface({ includeResetOverlay: true, openDownloadPopover: false })

    await advanceDraftingTimers()

    await addQrCode(surface.container)
    await advanceDraftingTimers()

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]')).toHaveLength(2)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Undo"]'))
    })

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]')).toHaveLength(1)

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Redo"]'))
    })

    expect(surface.container.querySelectorAll('[data-slot="dashboard-compose-surface"]')).toHaveLength(2)

    act(() => {
      changeInputValue(
        getRequiredElement(surface.container, 'input[aria-label="Link URL"]') as HTMLInputElement,
        "https://example.com/before-reset",
      )
    })
    await advanceDraftingTimers()

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Reset defaults"]'))
    })
    await advanceDraftingTimers()

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://new-qr-studio.local/launch")

    act(() => {
      activateElement(getRequiredElement(surface.container, 'button[aria-label="Undo"]'))
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://example.com/before-reset")
  })

  it("restores the autosaved drafting workspace after remount", async () => {
    vi.useFakeTimers()
    const firstSurface = renderSurface({ openDownloadPopover: false })

    await advanceDraftingTimers()

    act(() => {
      changeInputValue(
        getRequiredElement(firstSurface.container, 'input[aria-label="Link URL"]') as HTMLInputElement,
        "https://example.com/autosaved",
      )
    })
    await advanceDraftingTimers()

    firstSurface.unmount()
    const secondSurface = renderSurface({ openDownloadPopover: false })
    await advanceDraftingTimers()

    expect(
      getRequiredElement(secondSurface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://example.com/autosaved")
  })
})

function renderSurface({
  includeResetOverlay = false,
  openDownloadPopover = true,
}: {
  includeResetOverlay?: boolean
  openDownloadPopover?: boolean
} = {}) {
  const container = document.createElement("div")
  const root = createRoot(container)

  act(() => {
    root.render(
      <WorkspaceSurface
        renderOverlay={
          includeResetOverlay
            ? (controller) => (
                <button
                  aria-label="Reset defaults"
                  type="button"
                  onClick={controller.onResetDefaults}
                />
              )
            : undefined
        }
      />,
    )
  })

  const cleanup = () => {
    act(() => {
      root.unmount()
    })
  }

  cleanupCallbacks.push(cleanup)

  document.body.appendChild(container)

  if (openDownloadPopover) {
    const trigger = container.querySelector(
      'button[aria-label="Open download options"]',
    ) as HTMLButtonElement | null

    if (trigger) {
      act(() => {
        activateElement(trigger)
      })
    }
  }

  return {
    container,
    unmount: () => {
      const index = cleanupCallbacks.indexOf(cleanup)
      if (index >= 0) {
        cleanupCallbacks.splice(index, 1)
      }
      cleanup()
    },
  }
}

function DesktopOverlayTestHarness(props: ComponentProps<typeof WorkspaceSurface>) {
  const [desktopTheme, setDesktopTheme] = useState<"dark" | "light">(
    props.desktopTheme ?? "light",
  )

  return (
    <WorkspaceSurface
      {...props}
      desktopTheme={desktopTheme}
      onDesktopThemeChange={setDesktopTheme}
      renderOverlay={(controller) => (
        <FloatingToolbar
          controller={controller}
          onThemeChange={setDesktopTheme}
          theme={desktopTheme}
        />
      )}
    />
  )
}

function renderDesktopOverlaySurface(props: ComponentProps<typeof WorkspaceSurface> = {}) {
  const container = document.createElement("div")
  const root = createRoot(container)

  act(() => {
    root.render(
      <DesktopOverlayTestHarness chrome="canvas-only" {...props} />,
    )
  })

  const cleanup = () => {
    act(() => {
      root.unmount()
    })
  }

  cleanupCallbacks.push(cleanup)
  document.body.appendChild(container)

  return {
    container,
    unmount: () => {
      const index = cleanupCallbacks.indexOf(cleanup)
      if (index >= 0) {
        cleanupCallbacks.splice(index, 1)
      }
      cleanup()
    },
  }
}

function getRequiredElement(parent: ParentNode, selector: string) {
  const element = parent.querySelector(selector)

  expect(element).not.toBeNull()

  return element as HTMLElement
}

function getRadioInputByAriaLabel(parent: ParentNode, label: string) {
  const element = Array.from(parent.querySelectorAll('input[type="radio"]')).find(
    (input) => input.getAttribute("aria-label") === label,
  )

  expect(element).not.toBeNull()

  return element as HTMLInputElement
}

function activateElement(element: HTMLElement) {
  const PointerEventConstructor = window.PointerEvent ?? window.MouseEvent

  element.dispatchEvent(
    new PointerEventConstructor("pointerdown", {
      bubbles: true,
      button: 0,
      ctrlKey: false,
    }),
  )
  element.dispatchEvent(
    new PointerEventConstructor("pointerup", {
      bubbles: true,
      button: 0,
      ctrlKey: false,
    }),
  )
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }))
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }))
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }))
}

function dispatchBodyShortcut(
  key: string,
  options: Omit<KeyboardEventInit, "bubbles" | "cancelable" | "key"> = {},
) {
  document.body.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      ...options,
    }),
  )
}

function changeInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const valueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value",
  )?.set

  valueSetter?.call(element, value)
  element.dispatchEvent(new Event("input", { bubbles: true }))
  element.dispatchEvent(new Event("change", { bubbles: true }))
}

function setInputFiles(element: HTMLInputElement, files: File[]) {
  Object.defineProperty(element, "files", {
    configurable: true,
    value: files,
  })
}

function createDataTransfer() {
  const values = new Map<string, string>()

  return {
    dropEffect: "none",
    effectAllowed: "all",
    getData: vi.fn((type: string) => values.get(type) ?? ""),
    setData: vi.fn((type: string, value: string) => {
      values.set(type, value)
    }),
  }
}

function createDragEvent(type: string, dataTransfer: ReturnType<typeof createDataTransfer>) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as Event & { dataTransfer: ReturnType<typeof createDataTransfer> }

  Object.defineProperty(event, "dataTransfer", {
    value: dataTransfer,
  })

  return event
}

function openCardOnlyMode(parent: ParentNode) {
  act(() => {
    activateElement(getRequiredElement(parent, 'button[aria-label="Open Shape"]'))
  })

  const shapeSwitch = getRequiredElement(parent, "#drafting-card-enabled")
  if (shapeSwitch.getAttribute("aria-checked") !== "true") {
    act(() => {
      activateElement(shapeSwitch)
    })
  }
}

function getSelectedPreviewCard(parent: ParentNode) {
  const selectedNode =
    parent.querySelector('[data-slot="dashboard-compose-node"][data-selected="true"]') ??
    parent.querySelector('[data-slot="dashboard-compose-card"][data-selected="true"]') ??
    getRequiredElement(parent, '[data-slot="dashboard-compose-node"]')
  const card =
    selectedNode.closest('[data-slot="dashboard-compose-card"]') ??
    selectedNode
      .closest('[data-slot="dashboard-compose-canvas"]')
      ?.querySelector('[data-slot="dashboard-compose-card"]')

  expect(card).not.toBeNull()

  return card as HTMLElement
}

function getAccordionTriggerByText(parent: ParentNode, text: string) {
  const trigger = Array.from(
    parent.querySelectorAll('[data-slot="drafting-color-trigger"]'),
  ).find((element) => element.textContent?.includes(text))

  expect(trigger).not.toBeNull()

  return trigger as HTMLElement
}

function getButtonByExactText(parent: ParentNode, text: string) {
  const button = Array.from(parent.querySelectorAll("button")).find(
    (element) => element.textContent?.trim() === text,
  )

  expect(button).not.toBeNull()

  return button as HTMLButtonElement
}

async function flushPromises() {
  await Promise.resolve()
}

async function waitForDraftingSurface() {
  await act(async () => {
    await flushPromises()
    await flushPromises()
  })
}

async function addQrCode(parent: ParentNode) {
  await act(async () => {
    activateElement(getRequiredElement(parent, 'button[aria-label="Add content"]'))
    await flushPromises()
  })
  await act(async () => {
    activateElement(getRequiredElement(parent, '[data-slot="drafting-insert-menu-add-qr"]'))
    await flushPromises()
    await flushPromises()
  })
}

async function advanceDraftingTimers() {
  await act(async () => {
    await flushPromises()
    vi.advanceTimersByTime(300)
    await flushPromises()
    await flushPromises()
  })
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
  }
}
