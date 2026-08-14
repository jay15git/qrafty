"use client"

import { useContext, useState } from "react"
import { ChevronDownIcon, EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DesktopnewThemeContext,
  SettingsFillPopover,
  SettingsSlider,
} from "@/features/desktopnew/settings-ui"
import { fillPreviewHex } from "@/features/desktopnew/desktopnew-fill-picker"
import { solidColorToFillCss } from "@/features/desktopnew/desktopnew-settings-bridge"
import { DRAFTING_FILTER_RANGES } from "@/features/workspace/model/filters"
import {
  createLayerEffect,
  getLayerEffectKindLabel,
  LAYER_EFFECT_KINDS,
  LAYER_FILTER_EFFECT_KINDS,
  LAYER_SHADOW_EFFECT_KINDS,
  listLayerEffects,
  patchLayerFilterEffect,
  patchLayerShadowEffect,
  serializeLayerEffects,
  setLayerEffectEnabled,
  setLayerEffectKind,
  type LayerEffectItem,
  type LayerEffectKind,
} from "@/features/workspace/model/layer-effects"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

const ROW =
  "dn-settings-row dn-pressable-press-only dn-squircle-sm inline-flex h-9 w-full items-center gap-1.5 px-2"

export function SettingsEffectsSection({
  layerFilters,
  onPatch,
  shadows,
}: {
  layerFilters: DraftingCanvasLayer["layerFilters"]
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  shadows: DraftingCanvasLayer["shadows"]
}) {
  const theme = useContext(DesktopnewThemeContext)
  const layer = { layerFilters: layerFilters ?? [], shadows: shadows ?? [] }
  const effects = listLayerEffects(layer)
  const [openIds, setOpenIds] = useState<string[]>([])

  function handleAdd(kind: LayerEffectKind) {
    const next = createLayerEffect(kind)
    onPatch(serializeLayerEffects([...effects, next]))
    setOpenIds((current) => (current.includes(next.id) ? current : [...current, next.id]))
  }

  function handleRemove(effectId: string) {
    onPatch(serializeLayerEffects(effects.filter((item) => item.id !== effectId)))
    setOpenIds((current) => current.filter((id) => id !== effectId))
  }

  return (
    <div className="flex flex-col gap-2.5" data-slot="desktopnew-effects-section">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Add effect"
            className={cn(ROW, "justify-between px-3 font-normal")}
            type="button"
          >
            <span className="dn-type-value">Add effect</span>
            <PlusIcon className="size-3.5 text-[var(--dn-muted)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className={cn(
            "dn-portal-surface desktopnew-popover-content min-w-40 border p-1 dn-squircle-sm",
            theme === "dark" && "dark",
          )}
          data-slot="desktopnew-effects-add-menu"
          data-theme={theme}
        >
          <DropdownMenuGroup>
            {LAYER_SHADOW_EFFECT_KINDS.map((kind) => (
              <DropdownMenuItem key={kind} onClick={() => handleAdd(kind)}>
                {getLayerEffectKindLabel(kind)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <div className="my-1 h-px bg-[var(--dn-line)]" />
          <DropdownMenuGroup>
            {LAYER_FILTER_EFFECT_KINDS.map((kind) => (
              <DropdownMenuItem key={kind} onClick={() => handleAdd(kind)}>
                {getLayerEffectKindLabel(kind)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {effects.map((effect) => {
        const isOpen = openIds.includes(effect.id)
        const label = getLayerEffectKindLabel(effect.kind)
        const range =
          effect.source === "filter" ? DRAFTING_FILTER_RANGES[effect.filter.type] : null

        return (
          <div
            key={effect.id}
            className="flex flex-col gap-2"
            data-effect-kind={effect.kind}
            data-slot="desktopnew-effect-row"
          >
            <div className={ROW}>
              <button
                aria-label={effect.enabled ? `Hide ${label}` : `Show ${label}`}
                aria-pressed={effect.enabled}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-md text-[var(--dn-muted)]",
                  !effect.enabled && "opacity-40",
                )}
                type="button"
                onClick={() => onPatch(setLayerEffectEnabled(layer, effect.id, !effect.enabled))}
              >
                {effect.enabled ? (
                  <EyeIcon className="size-3.5" />
                ) : (
                  <EyeOffIcon className="size-3.5" />
                )}
              </button>

              <select
                aria-label={`${label} type`}
                className="dn-settings-input h-7 min-w-0 flex-1 px-2 text-[11px]"
                value={effect.kind}
                onChange={(event) =>
                  onPatch(setLayerEffectKind(layer, effect.id, event.currentTarget.value as LayerEffectKind))
                }
              >
                {LAYER_EFFECT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {getLayerEffectKindLabel(kind)}
                  </option>
                ))}
              </select>

              <button
                aria-expanded={isOpen}
                aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
                className="grid size-7 shrink-0 place-items-center text-[var(--dn-muted)]"
                type="button"
                onClick={() =>
                  setOpenIds((current) =>
                    current.includes(effect.id)
                      ? current.filter((id) => id !== effect.id)
                      : [...current, effect.id],
                  )
                }
              >
                <ChevronDownIcon
                  className={cn("size-3.5 transition-transform duration-150", isOpen && "rotate-180")}
                />
              </button>

              <button
                aria-label={`Remove ${label}`}
                className="grid size-7 shrink-0 place-items-center text-[var(--dn-muted)]"
                type="button"
                onClick={() => handleRemove(effect.id)}
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>

            {isOpen && effect.source === "shadow" ? (
              <>
                <SettingsFillPopover
                  hint="Color"
                  value={solidColorToFillCss(effect.shadow.color)}
                  onValueChange={(_fill, css) =>
                    onPatch(
                      patchLayerShadowEffect(layer, effect.id, {
                        color: fillPreviewHex(css),
                      }),
                    )
                  }
                />
                <SettingsSlider
                  label="X"
                  max={256}
                  min={-256}
                  value={effect.shadow.offsetX}
                  onChange={(offsetX) =>
                    onPatch(patchLayerShadowEffect(layer, effect.id, { offsetX }))
                  }
                />
                <SettingsSlider
                  label="Y"
                  max={256}
                  min={-256}
                  value={effect.shadow.offsetY}
                  onChange={(offsetY) =>
                    onPatch(patchLayerShadowEffect(layer, effect.id, { offsetY }))
                  }
                />
                <SettingsSlider
                  label="Blur"
                  max={128}
                  value={effect.shadow.blur}
                  onChange={(blur) => onPatch(patchLayerShadowEffect(layer, effect.id, { blur }))}
                />
                <SettingsSlider
                  label="Spread"
                  max={128}
                  min={-128}
                  value={effect.shadow.spread}
                  onChange={(spread) =>
                    onPatch(patchLayerShadowEffect(layer, effect.id, { spread }))
                  }
                />
                <SettingsSlider
                  label="Opacity"
                  value={effect.shadow.opacity}
                  onChange={(opacity) =>
                    onPatch(patchLayerShadowEffect(layer, effect.id, { opacity }))
                  }
                />
              </>
            ) : null}

            {isOpen && effect.source === "filter" && range ? (
              <SettingsSlider
                label="Amount"
                max={range.max}
                min={range.min}
                value={effect.filter.amount}
                onChange={(amount) =>
                  onPatch(patchLayerFilterEffect(layer, effect.id, { amount }))
                }
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
