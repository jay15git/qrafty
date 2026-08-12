"use client"

import { PlusIcon } from "lucide-react"

import { FluidSwitch } from "@/components/ui/fluid-switch"
import { DesktopColorInputRow } from "@/features/desktop-shell/components/DesktopColorControls"
import { DesktopPaperShaderOptionGrid } from "@/features/desktop-shell/components/DesktopPaperShaderOptionGrid"
import {
  DESKTOP_INSPECTOR_CONTROL_CLASS,
  DESKTOP_INSPECTOR_ROW_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
  DESKTOP_INSPECTOR_VALUE_CLASS,
  DesktopInspectorImageFileUpload,
  DesktopInspectorLabel,
  DesktopInspectorNativeSelect,
  DesktopInspectorSection,
  DesktopInspectorSegmentedControl,
  desktopInspectorOptionGridClass,
  desktopInspectorOptionGridItemClass,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopInspectorElasticSliderRow,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  applyDraftingCardPaperShaderPreset,
  createDefaultDraftingCardPaperShader,
  DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
  type DraftingCardPaperShaderState,
} from "@/features/workspace/model/card-state"
import {
  formatPaperShaderNumberValue,
  formatPaperShaderParamLabel,
  getPaperShaderDefinition,
  type PaperShaderControlDefinition,
  type PaperShaderParamValue,
} from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

const PAPER_SHADER_COLOR_INPUT_FALLBACK = "#000000"
const PAPER_SHADER_NEW_COLOR = "#ffffff"

function isPaperShaderHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function DesktopShaderPresetButton({
  label,
  onClick,
  selected,
}: {
  label: string
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "flex h-9 min-w-0 items-center justify-between gap-2 px-2.5 text-left",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_CONTROL_CLASS,
        selected && DESKTOP_INSPECTOR_SELECTED_CLASS,
      )}
      type="button"
      onClick={onClick}
    >
      <span className={cn("mb-0 min-w-0 flex-1 truncate", DESKTOP_INSPECTOR_VALUE_CLASS)}>
        {label}
      </span>
    </button>
  )
}

function DesktopShaderToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <FluidSwitch
      checked={checked}
      data-slot="desktop-shader-toggle-row"
      label={label}
      onToggle={() => onChange(!checked)}
      className={cn(
        DESKTOP_INSPECTOR_ROW_CLASS,
        "w-full flex-row-reverse justify-between px-0 touch-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
        "[&>span:last-child]:min-w-0 [&>span:last-child]:truncate [&>span:last-child]:text-[length:var(--desktop-inspector-type-label)] [&>span:last-child]:font-medium",
        checked
          ? "[&>span:last-child]:text-[var(--desktop-inspector-fg-primary)]"
          : "[&>span:last-child]:text-[var(--desktop-inspector-fg-label)]",
      )}
    />
  )
}

function DesktopPaperShaderParamControl({
  control,
  maxColorCount,
  paperShader,
  value,
  onChange,
}: {
  control: PaperShaderControlDefinition
  maxColorCount?: number
  paperShader: DraftingCardPaperShaderState
  value: PaperShaderParamValue
  onChange: (value: DraftingCardPaperShaderState["image"] | PaperShaderParamValue) => void
}) {
  const label = formatPaperShaderParamLabel(control.key)

  if (control.type === "image") {
    return (
      <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <DesktopInspectorLabel>{label}</DesktopInspectorLabel>
          <button
            className={cn(
              "h-8 shrink-0 rounded-[6px] px-3",
              DESKTOP_INSPECTOR_CONTROL_CLASS,
              DESKTOP_INSPECTOR_VALUE_CLASS,
            )}
            type="button"
            onClick={() =>
              onChange({
                source: "sample",
                value: DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
              })
            }
          >
            Use sample
          </button>
        </div>
        <DesktopInspectorImageFileUpload
          onFileAccept={(file) =>
            onChange({
              source: "upload",
              value: URL.createObjectURL(file),
            })
          }
        />
      </DesktopInspectorSection>
    )
  }

  if (control.type === "boolean") {
    return (
      <DesktopShaderToggleRow
        checked={Boolean(value)}
        label={label}
        onChange={(nextValue) => onChange(nextValue)}
      />
    )
  }

  if (control.type === "number" && typeof value === "number") {
    return (
      <DesktopInspectorElasticSliderRow
        label={label}
        max={control.max}
        min={control.min}
        step={control.step ?? 0.01}
        value={value}
        valueLabel={formatPaperShaderNumberValue(control.key, value)}
        onChange={onChange}
      />
    )
  }

  if (control.type === "colors" && Array.isArray(value)) {
    const colors = value as string[]

    return (
      <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
        <DesktopInspectorLabel>{label}</DesktopInspectorLabel>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {colors.map((color, index) => (
            <DesktopColorInputRow
              key={`${color}-${index}`}
              ariaLabel={`${label} ${index + 1}`}
              label={`${index + 1}`}
              value={isPaperShaderHexColor(color) ? color : PAPER_SHADER_COLOR_INPUT_FALLBACK}
              onChange={(nextColor) => {
                const nextColors = [...colors]
                nextColors[index] = nextColor
                onChange(nextColors)
              }}
            />
          ))}
          <button
            aria-label={`Add ${label}`}
            className={cn(
              "grid size-8 place-items-center rounded-full border border-dashed border-white/[0.18]",
              DESKTOP_INSPECTOR_CONTROL_CLASS,
              colors.length >= (maxColorCount ?? 10) && "cursor-not-allowed opacity-40",
            )}
            disabled={colors.length >= (maxColorCount ?? 10)}
            type="button"
            onClick={() => onChange([...colors, PAPER_SHADER_NEW_COLOR])}
          >
            <PlusIcon className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </DesktopInspectorSection>
    )
  }

  if (control.type === "color" && typeof value === "string") {
    return (
      <DesktopColorInputRow
        label={label}
        value={isPaperShaderHexColor(value) ? value : PAPER_SHADER_COLOR_INPUT_FALLBACK}
        onChange={onChange}
      />
    )
  }

  if (control.type === "enum" && typeof value === "string") {
    if (control.options.length <= 4) {
      return (
        <div className="min-w-0 py-2.5">
          <DesktopInspectorLabel>{label}</DesktopInspectorLabel>
          <DesktopInspectorSegmentedControl
            items={control.options.map((option) => ({
              label: formatPaperShaderParamLabel(option),
              value: option,
            }))}
            value={value}
            onValueChange={onChange}
          />
        </div>
      )
    }

    return (
      <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
        <DesktopInspectorLabel>{label}</DesktopInspectorLabel>
        <div className={desktopInspectorOptionGridClass(2)}>
          {control.options.map((option) => (
            <DesktopShaderPresetButton
              key={option}
              label={formatPaperShaderParamLabel(option)}
              selected={value === option}
              onClick={() => onChange(option)}
            />
          ))}
        </div>
      </DesktopInspectorSection>
    )
  }

  return null
}

export function DesktopPaperShaderSettings({
  paperShader,
  onPaperShaderChange,
  showColorControls = true,
  showNonColorControls = true,
  showShaderGrid = true,
}: {
  paperShader: DraftingCardPaperShaderState
  onPaperShaderChange: (value: DraftingCardPaperShaderState) => void
  showColorControls?: boolean
  showNonColorControls?: boolean
  showShaderGrid?: boolean
}) {
  const definition = getPaperShaderDefinition(paperShader.shaderId)
  const selectedPreset =
    definition.presets.find((preset) => preset.name === paperShader.presetName) ??
    definition.presets[0]
  const speedControl = definition.controls.find(
    (control) => control.type === "number" && control.key === "speed",
  )
  const settingControls = definition.controls.filter(
    (control) =>
      control.key !== "speed" &&
      ((showColorControls && (control.type === "color" || control.type === "colors")) ||
        (showNonColorControls && control.type !== "color" && control.type !== "colors")),
  )

  const updatePaperShader = (patch: Partial<DraftingCardPaperShaderState>) => {
    onPaperShaderChange({
      ...paperShader,
      ...patch,
      image: patch.image ? { ...patch.image } : { ...paperShader.image },
      params: patch.params ? structuredClone(patch.params) : structuredClone(paperShader.params),
    })
  }

  const updateParam = (key: string, value: PaperShaderParamValue) => {
    updatePaperShader({
      params: {
        ...paperShader.params,
        [key]: value,
      },
    })
  }

  return (
    <>
      {showShaderGrid ? (
        <DesktopInspectorSection>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Shader</p>
          <DesktopPaperShaderOptionGrid
            selectedShaderId={paperShader.shaderId}
            onSelect={(shaderId) =>
              onPaperShaderChange(createDefaultDraftingCardPaperShader(shaderId))
            }
          />
        </DesktopInspectorSection>
      ) : null}

      {showNonColorControls ? <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
        <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Preset</p>
        <DesktopInspectorNativeSelect
          aria-label="Shader preset"
          className="pr-2.5"
          options={definition.presets.map((preset) => ({
            label: preset.name,
            value: preset.name,
          }))}
          showIcon={false}
          value={selectedPreset?.name ?? paperShader.presetName}
          onValueChange={(presetName) =>
            onPaperShaderChange(applyDraftingCardPaperShaderPreset(paperShader, presetName))
          }
        />
      </DesktopInspectorSection> : null}

      {showNonColorControls ? <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
        <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Motion</p>
        <div className="grid gap-2">
          <DesktopShaderToggleRow
            checked={paperShader.paused}
            label="Pause"
            onChange={(paused) => updatePaperShader({ paused })}
          />
          {speedControl?.type === "number" ? (
            <DesktopInspectorElasticSliderRow
              label="Speed"
              max={speedControl.max}
              min={speedControl.min}
              step={speedControl.step ?? 0.01}
              value={paperShader.speed}
              valueLabel={paperShader.speed.toFixed(2)}
              onChange={(speed) => updatePaperShader({ speed })}
            />
          ) : null}
          <DesktopInspectorElasticSliderRow
            label="Frame"
            max={10000}
            min={0}
            step={1}
            value={paperShader.frame}
            valueLabel={`${Math.round(paperShader.frame)}`}
            onChange={(frame) => updatePaperShader({ frame })}
          />
        </div>
      </DesktopInspectorSection> : null}

      {settingControls.length > 0 ? <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
        <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Settings</p>
        <div className="grid gap-2">
          {settingControls.map((control) => (
            <DesktopPaperShaderParamControl
              key={control.key}
              control={control}
              maxColorCount={definition.maxColorCount}
              paperShader={paperShader}
              value={paperShader.params[control.key]}
              onChange={(nextValue) => {
                if (control.type === "image") {
                  updatePaperShader({
                    image: nextValue as DraftingCardPaperShaderState["image"],
                  })
                  return
                }

                updateParam(control.key, nextValue as PaperShaderParamValue)
              }}
            />
          ))}
        </div>
      </DesktopInspectorSection> : null}
    </>
  )
}
