"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Fill } from "@/components/ui/fill-picker/public-api";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { fillPreviewHex } from "@/features/shell/settings/FillPicker.utils";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import { useMobileDrawerNavigation } from "@/features/shell/settings/MobileDrawerNavigationContext";
import { useMobileSettingsDensity } from "@/features/shell/settings/MobileSettingsDensityContext";
import { PaletteColorStopList } from "@/features/shell/settings/PaletteColorStopList";
import { SettingsFillPopover } from "@/features/shell/settings/settings-ui";
import {
  extractSvgPaintColors,
  getIllustrationDisplaySrc,
  normalizeSvgPaintColor,
  resolveIllustrationDisplayColors,
  type CanvasIllustrationColorStop,
} from "@/features/canvas/assets/illustration-recolor";
import { useIllustrationSvgMarkup } from "@/features/canvas/assets/use-illustration-svg";
import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/canvas/model/corner-radius";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { cn } from "@/lib/utils";

function patchIllustrationStops(
  sourceColors: readonly string[],
  currentStops: readonly CanvasIllustrationColorStop[] | undefined,
  index: number,
  nextColor: string,
): CanvasIllustrationColorStop[] {
  const display = resolveIllustrationDisplayColors(sourceColors, currentStops);
  const to = normalizeSvgPaintColor(nextColor) ?? nextColor.toLowerCase();
  return sourceColors.map((from, colorIndex) => ({
    from,
    to: colorIndex === index ? to : (display[colorIndex] ?? from),
  }));
}

export function IllustrationFloatingColorControl({
  layer,
  onPatch,
  theme,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme: ThemeMode;
}) {
  const mobileDensity = useMobileSettingsDensity();
  const mobileNav = useMobileDrawerNavigation();
  const markup = useIllustrationSvgMarkup(layer.imageValue);
  const sourceColors = markup ? extractSvgPaintColors(markup) : [];
  const displayColors = resolveIllustrationDisplayColors(
    sourceColors,
    layer.illustrationColorStops,
  );

  if (sourceColors.length === 0) {
    return null;
  }

  function patchStop(index: number, nextColor: string) {
    onPatch({
      illustrationColorStops: patchIllustrationStops(
        sourceColors,
        layer.illustrationColorStops,
        index,
        nextColor,
      ),
    });
  }

  if (sourceColors.length === 1) {
    return (
      <div
        className="flex size-9 shrink-0 items-center justify-center"
        data-slot="canvas-layer-floating-toolbar-color"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <SettingsThemeContext.Provider value={theme}>
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
              patchStop(0, fillPreviewHex(css));
            }}
          />
        </SettingsThemeContext.Provider>
      </div>
    );
  }

  const multiColorBody = (
    <>
      <p className="ds-type-meta mb-2">Colors</p>
      <PaletteColorStopList
        colors={displayColors}
        onPaletteColorChange={(index, color) => patchStop(index, color)}
      />
    </>
  );

  const multiColorSwatch = (
    <span
      aria-hidden
      className="grid size-7 grid-cols-2 overflow-hidden rounded-xl border-2 border-[color-mix(in_srgb,var(--line)_40%,transparent)]"
    >
      {displayColors.slice(0, 4).map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="size-full min-h-0 min-w-0"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );

  if (mobileDensity && mobileNav) {
    return (
      <div
        className="flex size-9 shrink-0 items-center justify-center"
        data-slot="canvas-layer-floating-toolbar-color"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <SettingsThemeContext.Provider value={theme}>
          <button
            aria-label="Illustration colors"
            className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg)]/30"
            data-vaul-no-drag=""
            type="button"
            onClick={() => {
              mobileNav.openDetail({
                title: "Illustration colors",
                content: (
                  <div className="ds-portal-surface w-full min-w-0" data-mobile-settings="">
                    {multiColorBody}
                  </div>
                ),
              });
            }}
          >
            {multiColorSwatch}
          </button>
        </SettingsThemeContext.Provider>
      </div>
    );
  }

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center"
      data-slot="canvas-layer-floating-toolbar-color"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <SettingsThemeContext.Provider value={theme}>
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
              "ds-fill-popover ds-portal-surface z-[var(--z-popover-raised)] w-[var(--popover-width-fill)] border-0 bg-transparent p-0 shadow-none outline-none",
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
      </SettingsThemeContext.Provider>
    </div>
  );
}

export function IllustrationSettingsColorSection({
  layer,
  onPatch,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  const markup = useIllustrationSvgMarkup(layer.imageValue);
  const sourceColors = markup ? extractSvgPaintColors(markup) : [];
  const displayColors = resolveIllustrationDisplayColors(
    sourceColors,
    layer.illustrationColorStops,
  );

  if (sourceColors.length === 0) {
    return null;
  }

  function patchStop(index: number, nextColor: string) {
    onPatch({
      illustrationColorStops: patchIllustrationStops(
        sourceColors,
        layer.illustrationColorStops,
        index,
        nextColor,
      ),
    });
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
    );
  }

  return (
    <PaletteColorStopList
      colors={displayColors}
      onPaletteColorChange={(index, color) => patchStop(index, color)}
    />
  );
}

export function IllustrationLayerImage({ layer }: { layer: CanvasLayer }) {
  const imageValue = layer.imageValue ?? "";
  const markup = useIllustrationSvgMarkup(imageValue);
  const src =
    markup && imageValue
      ? getIllustrationDisplaySrc(imageValue, markup, layer.illustrationColorStops)
      : imageValue;
  const cornerStyle = cornerRadiiToCss(resolveLayerCornerRadii(layer, 0));
  const fit = layer.imageFit ?? "contain";

  if (!src) {
    return null;
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
  );
}
