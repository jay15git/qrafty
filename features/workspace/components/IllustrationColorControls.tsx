"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { useMobileDrawerNavigation } from "@/features/desktop-shell/inspector/mobile-drawer-navigation-context"
import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { PaletteColorStopList } from "@/features/desktop-shell/inspector/palette-color-stop-list"
import { SettingsFillPopover } from "@/features/desktop-shell/inspector/settings-ui"
import {
  extractSvgPaintColors,
  getIllustrationDisplaySrc,
  normalizeSvgPaintColor,
  resolveIllustrationDisplayColors,
  type DraftingIllustrationColorStop,
} from "@/features/workspace/assets/illustration-recolor"
import { useIllustrationSvgMarkup } from "@/features/workspace/assets/use-illustration-svg"
import {
  cornerRadiiToCss,
  resolveLayerCornerRadii,
} from "@/features/workspace/model/corner-radius"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

function patchIllustrationStops(
  sourceColors: readonly string[],
  currentStops: readonly DraftingIllustrationColorStop[] | undefined,
  index: number,
  nextColor: string,
): DraftingIllustrationColorStop[] {
  const display = resolveIllustrationDisplayColors(sourceColors, currentStops)
  const to = normalizeSvgPaintColor(nextColor) ?? nextColor.toLowerCase()
  return sourceColors.map((from, colorIndex) => ({
    from,
    to: colorIndex === index ? to : (display[colorIndex] ?? from),
  }))
}

export function IllustrationFloatingColorControl({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()
  const markup = useIllustrationSvgMarkup(layer.imageValue)
  const sourceColors = markup ? extractSvgPaintColors(markup) : []
  const displayColors = resolveIllustrationDisplayColors(
    sourceColors,
    layer.illustrationColorStops,
  )

  if (sourceColors.length === 0) {
    return null
  }

  function patchStop(index: number, nextColor: string) {
    onPatch({
      illustrationColorStops: patchIllustrationStops(
        sourceColors,
        layer.illustrationColorStops,
        index,
        nextColor,
      ),
    })
  }

  if (sourceColors.length === 1) {
    return (
      <div
        className="flex size-9 shrink-0 items-center justify-center"
        data-slot="drafting-layer-floating-toolbar-color"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <DesktopnewThemeContext.Provider value={theme}>
          <SettingsFillPopover
            align="center"
            hint="Illustration color"
            side="top"
            avoidCollisions
            collisionPadding={12}
            solidOnly
            title="Illustration color"
            value={displayColors[0] ?? "#171717"}
            variant="swatch"
            triggerClassName="size-9 rounded-xl [&>span]:size-7 [&>span]:rounded-xl"
            onValueChange={(_fill: Fill, css: string) => {
              patchStop(0, fillPreviewHex(css))
            }}
          />
        </DesktopnewThemeContext.Provider>
      </div>
    )
  }

  const multiColorBody = (
    <>
      <p className="dn-type-meta mb-2">Colors</p>
      <PaletteColorStopList
        colors={displayColors}
        onPaletteColorChange={(index, color) => patchStop(index, color)}
      />
    </>
  )

  const multiColorSwatch = (
    <span
      aria-hidden
      className="grid size-7 grid-cols-2 overflow-hidden rounded-xl border-2 border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)]"
    >
      {displayColors.slice(0, 4).map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="size-full min-h-0 min-w-0"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  )

  if (mobileDensity && mobileNav) {
    return (
      <div
        className="flex size-9 shrink-0 items-center justify-center"
        data-slot="drafting-layer-floating-toolbar-color"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <DesktopnewThemeContext.Provider value={theme}>
          <button
            aria-label="Illustration colors"
            className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dn-fg)]/30"
            data-vaul-no-drag=""
            type="button"
            onClick={() => {
              mobileNav.openDetail({
                title: "Illustration colors",
                content: (
                  <div className="dn-portal-surface w-full min-w-0" data-mobile-inspector="">
                    {multiColorBody}
                  </div>
                ),
              })
            }}
          >
            {multiColorSwatch}
          </button>
        </DesktopnewThemeContext.Provider>
      </div>
    )
  }

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center"
      data-slot="drafting-layer-floating-toolbar-color"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <DesktopnewThemeContext.Provider value={theme}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Illustration colors"
              className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
              type="button"
            >
              {multiColorSwatch}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            className={cn(
              "desktopnew-fill-popover dn-portal-surface z-[20001] w-[min(100vw-2rem,20rem)] border-0 bg-transparent p-0 shadow-none outline-none",
              theme === "dark" && "dark",
            )}
            data-theme={theme}
            side="top"
            sideOffset={10}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {multiColorBody}
          </PopoverContent>
        </Popover>
      </DesktopnewThemeContext.Provider>
    </div>
  )
}

export function IllustrationInspectorColorSection({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const markup = useIllustrationSvgMarkup(layer.imageValue)
  const sourceColors = markup ? extractSvgPaintColors(markup) : []
  const displayColors = resolveIllustrationDisplayColors(
    sourceColors,
    layer.illustrationColorStops,
  )

  if (sourceColors.length === 0) {
    return null
  }

  function patchStop(index: number, nextColor: string) {
    onPatch({
      illustrationColorStops: patchIllustrationStops(
        sourceColors,
        layer.illustrationColorStops,
        index,
        nextColor,
      ),
    })
  }

  if (sourceColors.length === 1) {
    return (
      <SettingsFillPopover
        hint="Illustration color"
        solidOnly
        title="Illustration color"
        value={displayColors[0] ?? "#171717"}
        onValueChange={(_fill, css) => patchStop(0, fillPreviewHex(css))}
      />
    )
  }

  return (
    <PaletteColorStopList
      colors={displayColors}
      onPaletteColorChange={(index, color) => patchStop(index, color)}
    />
  )
}

export function IllustrationLayerImage({ layer }: { layer: DraftingCanvasLayer }) {
  const imageValue = layer.imageValue ?? ""
  const markup = useIllustrationSvgMarkup(imageValue)
  const src =
    markup && imageValue
      ? getIllustrationDisplaySrc(imageValue, markup, layer.illustrationColorStops)
      : imageValue
  const cornerStyle = cornerRadiiToCss(resolveLayerCornerRadii(layer, 0))
  const fit = layer.imageFit ?? "contain"

  if (!src) {
    return null
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className="h-full w-full"
      draggable={false}
      src={src}
      style={{
        borderRadius: cornerStyle,
        objectFit: fit,
      }}
    />
  )
}
