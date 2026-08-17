"use client"

import {
  MoveIcon,
  PaletteIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react"

import {
  DesktopLayerAppearancePanel,
  DesktopLayerEffectsPanel,
  DesktopLayerStylePanel,
  DesktopLayerTransformPanel,
} from "@/features/desktop-shell/components/DesktopLayerSettingsPanel"
import { DesktopToolbarPopover } from "@/features/desktop-shell/components/DesktopToolbarPopover"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { listLayerEffects } from "@/features/workspace/model/layer-effects"

export function DesktopLayerSettingsTrigger({
  appearance,
  appearanceLayer,
  onAppearancePatch,
  onElementLayerPatch,
  onTransformLayerPatch,
  selectedElementLayer,
  selectedTransformLayer,
  suppressTooltip = false,
  theme,
}: {
  appearance?: DesktopAppearanceSnapshot | null
  appearanceLayer?: DraftingCanvasLayer | null
  onAppearancePatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  selectedElementLayer?: DraftingCanvasLayer | null
  selectedTransformLayer?: DraftingCanvasLayer | null
  suppressTooltip?: boolean
  theme: DesktopThemeMode
}) {
  const effectsLayer = selectedElementLayer ?? appearanceLayer ?? null
  const effectsPatch = selectedElementLayer ? onElementLayerPatch : onAppearancePatch
  const hasStyle = Boolean(selectedElementLayer && onElementLayerPatch)
  const hasEffects = Boolean(effectsLayer && effectsPatch)
  const hasTransform = Boolean(selectedTransformLayer && onTransformLayerPatch)
  const hasAppearance = Boolean(appearance && onAppearancePatch)
  const hasActiveEffects = effectsLayer
    ? listLayerEffects(effectsLayer).some((effect) => effect.enabled)
    : false

  if (!hasStyle && !hasEffects && !hasTransform && !hasAppearance) {
    return null
  }

  return (
    <div
      className="flex min-w-0 items-center gap-0.5 px-0.5"
      data-slot="desktop-layer-settings-triggers"
    >
      {hasStyle ? (
        <DesktopToolbarPopover
          dataSlot="desktop-layer-style-popover"
          label="Style"
          suppressTooltip={suppressTooltip}
          trigger={<PaletteIcon />}
          triggerDataSlot="desktop-layer-style-trigger"
          triggerOpenClassName="text-[var(--desktop-glass-button-hover-fg)]"
        >
          <DesktopLayerStylePanel
            layer={selectedElementLayer!}
            onPatch={onElementLayerPatch!}
            theme={theme}
          />
        </DesktopToolbarPopover>
      ) : null}

      {hasEffects ? (
        <DesktopToolbarPopover
          dataSlot="desktop-layer-effects-popover"
          label="Effects"
          suppressTooltip={suppressTooltip}
          trigger={
            <>
              <SparklesIcon />
              {hasActiveEffects ? (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 size-1.5 rounded-full bg-[var(--desktop-glass-button-hover-fg)]"
                />
              ) : null}
            </>
          }
          triggerDataSlot="desktop-layer-effects-trigger"
          triggerOpenClassName="text-[var(--desktop-glass-button-hover-fg)]"
        >
          <DesktopLayerEffectsPanel layer={effectsLayer!} onPatch={effectsPatch!} theme={theme} />
        </DesktopToolbarPopover>
      ) : null}

      {hasTransform ? (
        <DesktopToolbarPopover
          dataSlot="desktop-layer-transform-popover"
          label="Transform"
          suppressTooltip={suppressTooltip}
          trigger={<MoveIcon />}
          triggerDataSlot="desktop-layer-transform-trigger"
          triggerOpenClassName="text-[var(--desktop-glass-button-hover-fg)]"
        >
          <DesktopLayerTransformPanel
            layer={selectedTransformLayer!}
            onPatch={onTransformLayerPatch!}
            theme={theme}
          />
        </DesktopToolbarPopover>
      ) : null}

      {hasAppearance ? (
        <DesktopToolbarPopover
          dataSlot="desktop-layer-appearance-popover"
          label="Appearance"
          suppressTooltip={suppressTooltip}
          trigger={<SquareIcon />}
          triggerDataSlot="desktop-layer-appearance-trigger"
          triggerOpenClassName="text-[var(--desktop-glass-button-hover-fg)]"
        >
          <DesktopLayerAppearancePanel
            appearance={appearance!}
            onPatch={onAppearancePatch!}
            theme={theme}
          />
        </DesktopToolbarPopover>
      ) : null}
    </div>
  )
}
