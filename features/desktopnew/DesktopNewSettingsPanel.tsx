"use client"

import { useTheme } from "next-themes"
import { useState } from "react"

import { formatFill } from "@/components/ui/fill-picker-base/fill"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StylePreview, type StylePreviewKind } from "@/features/qr-code/components/StylePreview"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
  DOT_STYLE_OPTIONS,
} from "@/features/qr-code/styles/style-options"
import {
  QR_BACKGROUND_SHAPES,
  type QrBackgroundShapeId,
} from "@/features/qr-code/styles/background-shapes"
import { ShapeProvider } from "@/lib/shape-context"
import { cn } from "@/lib/utils"

import {
  IconGrid,
  ContentTypePicker,
  OptionGrid,
  PresetList,
  SegmentTabs,
  SettingsAccordion,
  SettingsFillPopover,
  SettingsInput,
  SettingsPanelShell,
  SettingsPrimaryButton,
  SettingsRowPopover,
  SettingsScroll,
  SettingsSlider,
  SettingsSwitchRow,
} from "@/features/desktopnew/settings-ui"
import {
  getContentTypeLabel,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import {
  MOTION_COLOR_SWATCHES,
  QR_DOT_MATRIX_COLOR_PRESET_OPTIONS,
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS,
  type QrDotMatrixColorPreset,
  type QrDotMatrixSquareLoader,
} from "@/features/qr-code/model/state"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import {
  fillFromHex,
  fillPreviewHex,
} from "@/features/desktopnew/desktopnew-fill-picker"
import {
  DEFAULT_PAPER_SHADER_ID,
  getAllPaperShaderDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"

const SECTION_STACK = "flex flex-col gap-2.5"
const PREVIEW_TILE =
  "dn-preview-tile group relative shrink-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs"

const SECTIONS = [
  "Content",
  "QR",
  "Shape",
  "Background",
  "Motion",
  "Export",
] as const

type SectionId = (typeof SECTIONS)[number]

function ContentSection() {
  const [contentType, setContentType] = useState<QrInputType>("link")

  return (
    <div className={SECTION_STACK}>
      <SettingsRowPopover
        contentClassName="w-[15rem]"
        hint="Type"
        title="Type"
        trigger={getContentTypeLabel(contentType)}
      >
        <ContentTypePicker selected={contentType} onSelect={setContentType} />
      </SettingsRowPopover>
      <SettingsInput value="https://example.com" />
    </div>
  )
}

function QrStylePreviewGrid({
  options,
  previewKind,
  selected,
  onSelect,
}: {
  options: ReadonlyArray<{ label: string; value: string }>
  previewKind: StylePreviewKind
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0 scroll-fade-x scroll-fade-8"
    >
      <div className="flex min-w-max gap-1.5 py-1.5">
        {options.map((option) => {
          const isSelected = selected === option.value

          return (
            <button
              key={option.value}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={cn(PREVIEW_TILE, "size-14 text-center")}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.value)}
            >
              <span
                aria-hidden="true"
                className="grid size-full place-items-center overflow-hidden p-0.5 dn-squircle-xs"
              >
                <span className="grid size-[90%] place-items-center [&_svg]:size-full [&_svg]:text-current">
                  <StylePreview previewKind={previewKind} value={option.value} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function QrStyleSection() {
  const [tab, setTab] = useState("Module")
  const [moduleShape, setModuleShape] = useState("rounded")
  const [eyeShape, setEyeShape] = useState("square")
  const [frameShape, setFrameShape] = useState("square")
  const [moduleFill, setModuleFill] = useState(() => formatFill(fillFromHex("#171717")))
  const [eyeFill, setEyeFill] = useState(() => formatFill(fillFromHex("#171717")))
  const [frameFill, setFrameFill] = useState(() => formatFill(fillFromHex("#171717")))
  const [logoFill, setLogoFill] = useState(() => formatFill(fillFromHex("#171717")))
  const [selectedIcon, setSelectedIcon] = useState("G")
  const [logoSize, setLogoSize] = useState(25)
  const [logoOpacity, setLogoOpacity] = useState(100)

  const part =
    tab === "Module"
      ? {
          setShape: setModuleShape,
          shape: moduleShape,
          options: DOT_STYLE_OPTIONS,
          previewKind: "dots" as const,
        }
      : tab === "Eye"
        ? {
            setShape: setEyeShape,
            shape: eyeShape,
            options: CORNER_DOT_STYLE_OPTIONS,
            previewKind: "corner-dot" as const,
          }
        : {
            setShape: setFrameShape,
            shape: frameShape,
            options: CORNER_SQUARE_STYLE_OPTIONS,
            previewKind: "corner-square" as const,
          }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-2.5">
      <SegmentTabs items={["Module", "Eye", "Frame", "Logo"]} value={tab} onChange={setTab} />

      {tab === "Logo" ? (
        <>
          <IconGrid
            items={["G", "in", "X", "gh", "f", "ig", "yt", "t"]}
            selectedIndex={["G", "in", "X", "gh", "f", "ig", "yt", "t"].indexOf(selectedIcon)}
            onSelect={setSelectedIcon}
          />
          <SettingsSlider label="Size" value={logoSize} onChange={setLogoSize} />
          <SettingsSlider label="Opacity" value={logoOpacity} onChange={setLogoOpacity} />
          <SettingsFillPopover hint="Fill" value={logoFill} onValueChange={setLogoFill} />
        </>
      ) : (
        <>
          <QrStylePreviewGrid
            options={part.options}
            previewKind={part.previewKind}
            selected={part.shape}
            onSelect={part.setShape}
          />
          {tab === "Module" ? (
            <SettingsFillPopover hint="Fill" value={moduleFill} onValueChange={setModuleFill} />
          ) : (
            <SettingsFillPopover
              hint="Fill"
              value={tab === "Eye" ? eyeFill : frameFill}
              onValueChange={tab === "Eye" ? setEyeFill : setFrameFill}
            />
          )}
        </>
      )}
    </div>
  )
}

function ShapeTypePreviewRow({
  selected,
  onSelect,
}: {
  selected: QrBackgroundShapeId
  onSelect: (shapeId: QrBackgroundShapeId) => void
}) {
  const shapes = QR_BACKGROUND_SHAPES

  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0 scroll-fade-x scroll-fade-8"
    >
      <div className="flex min-w-max gap-1.5 py-1.5">
        {shapes.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              aria-label={`Use ${option.label} shape`}
              aria-pressed={isSelected}
              className={cn(PREVIEW_TILE, "size-14")}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.id)}
            >
              <span className="relative z-10 grid size-full place-items-center p-0.5 text-black dark:text-white">
                <svg
                  aria-hidden="true"
                  className="size-[90%] fill-current"
                  viewBox={`0 0 ${option.viewBox.width} ${option.viewBox.height}`}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={option.path} />
                </svg>
              </span>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function PaperShaderPreviewRow({
  selected,
  onSelect,
}: {
  selected: PaperShaderId
  onSelect: (shaderId: PaperShaderId) => void
}) {
  const shaders = getAllPaperShaderDefinitions()

  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0 scroll-fade-x scroll-fade-8"
    >
      <div className="flex min-w-max gap-1.5 py-1.5">
        {shaders.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              aria-label={`Use ${option.label} shader`}
              aria-pressed={isSelected}
              className={cn(PREVIEW_TILE, "size-14")}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.id)}
            >
              <PaperShaderOptionPreview
                className="relative z-10 block size-full overflow-hidden dn-squircle-xs"
                isSelected={isSelected}
                shaderId={option.id}
              />
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function MotionLoaderPresetGrid({
  selected,
  onSelect,
}: {
  selected: QrDotMatrixSquareLoader
  onSelect: (loader: QrDotMatrixSquareLoader) => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0 scroll-fade-x scroll-fade-8"
    >
      <div className="flex min-w-max gap-1.5 py-1.5">
        {QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((option) => {
          const isSelected = selected === option.value

          return (
            <button
              key={option.value}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={cn(
                "dn-option-tile h-9 shrink-0 px-3 text-[11px] font-medium tracking-tight dn-squircle-xs",
                isSelected && "text-foreground",
              )}
              type="button"
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function AnimatedPresetGrid({
  customColors,
  selected,
  onSelect,
}: {
  customColors?: { base: string; peak: string }
  selected: QrDotMatrixColorPreset
  onSelect: (preset: QrDotMatrixColorPreset) => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0 scroll-fade-x scroll-fade-8"
    >
      <div className="flex min-w-max gap-1.5 py-1.5">
        {QR_DOT_MATRIX_COLOR_PRESET_OPTIONS.map((preset) => {
          const [base, peak] =
            preset.value === "theme" && customColors
              ? [customColors.base, customColors.peak]
              : MOTION_COLOR_SWATCHES[preset.value]
          const isSelected = selected === preset.value

          return (
            <button
              key={preset.value}
              aria-label={preset.label}
              aria-pressed={isSelected}
              className={cn(
                "dn-pressable flex size-8 shrink-0 overflow-hidden border border-border/40 dn-squircle-xs",
                isSelected &&
                  "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
              type="button"
              onClick={() => onSelect(preset.value)}
            >
              <span aria-hidden className="flex-1" style={{ backgroundColor: base }} />
              <span aria-hidden className="flex-1" style={{ backgroundColor: peak }} />
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function CardSection() {
  const [shape, setShape] = useState<QrBackgroundShapeId>("circle")
  const [cardFill, setCardFill] = useState(() => formatFill(fillFromHex("#ffffff")))

  return (
    <div className={SECTION_STACK}>
      <ShapeTypePreviewRow selected={shape} onSelect={setShape} />
      <SettingsFillPopover hint="Fill" value={cardFill} onValueChange={setCardFill} />
      <SettingsSlider label="Padding" value={32} />
    </div>
  )
}

function SceneSection() {
  const [tab, setTab] = useState("Shader")
  const [shader, setShader] = useState<PaperShaderId>(DEFAULT_PAPER_SHADER_ID)
  const [paused, setPaused] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState("None")
  const [backgroundFill, setBackgroundFill] = useState(() => formatFill(fillFromHex("#171717")))

  return (
    <div className={SECTION_STACK}>
      <SegmentTabs items={["Shader", "Image", "Color"]} value={tab} onChange={setTab} />
      {tab === "Shader" ? (
        <>
          <PaperShaderPreviewRow selected={shader} onSelect={setShader} />
          <SettingsSwitchRow checked={paused} label="Pause" onChange={setPaused} />
          <SettingsSlider label="Speed" value={100} />
        </>
      ) : tab === "Image" ? (
        <>
          <SettingsRowPopover hint="Image" title="Image" trigger={backgroundImage}>
            <PresetList
              items={["None", "Studio", "Paper", "Texture"]}
              selected={backgroundImage}
              onSelect={setBackgroundImage}
            />
          </SettingsRowPopover>
          <SettingsSlider label="Opacity" value={100} />
        </>
      ) : (
        <SettingsFillPopover hint="Fill" value={backgroundFill} onValueChange={setBackgroundFill} />
      )}
    </div>
  )
}

function MotionSection() {
  const [enabled, setEnabled] = useState(true)
  const [motionLoader, setMotionLoader] = useState<QrDotMatrixSquareLoader>("neon-drift")
  const [animatedPreset, setAnimatedPreset] = useState<QrDotMatrixColorPreset>("theme")
  const [animatedBaseFill, setAnimatedBaseFill] = useState(() => formatFill(fillFromHex("#22d3ee")))
  const [animatedPeakFill, setAnimatedPeakFill] = useState(() => formatFill(fillFromHex("#f0abfc")))

  const selectAnimatedPreset = (nextPreset: QrDotMatrixColorPreset) => {
    const [base, accent] = MOTION_COLOR_SWATCHES[nextPreset]
    setAnimatedPreset(nextPreset)
    setAnimatedBaseFill(formatFill(fillFromHex(base)))
    setAnimatedPeakFill(formatFill(fillFromHex(accent)))
  }

  return (
    <div className={SECTION_STACK}>
      <SettingsSwitchRow checked={enabled} label="Enabled" onChange={setEnabled} />
      {enabled ? (
        <>
          <MotionLoaderPresetGrid selected={motionLoader} onSelect={setMotionLoader} />
          <AnimatedPresetGrid
            customColors={{
              base: fillPreviewHex(animatedBaseFill),
              peak: fillPreviewHex(animatedPeakFill),
            }}
            selected={animatedPreset}
            onSelect={selectAnimatedPreset}
          />
          <SettingsFillPopover
            hint="Base"
            value={animatedBaseFill}
            onValueChange={(fill) => {
              setAnimatedPreset("theme")
              setAnimatedBaseFill(fill)
            }}
          />
          <SettingsFillPopover
            hint="Peak"
            value={animatedPeakFill}
            onValueChange={(fill) => {
              setAnimatedPreset("theme")
              setAnimatedPeakFill(fill)
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function ExportSection() {
  const [target, setTarget] = useState("Current QR")
  const [format, setFormat] = useState("PNG")

  return (
    <div className={SECTION_STACK}>
      <SettingsRowPopover hint="Target" title="Target" trigger={target}>
        <PresetList
          items={["Current QR", "All QR codes", "Full surface"]}
          selected={target}
          onSelect={setTarget}
        />
      </SettingsRowPopover>
      <SettingsRowPopover hint="Format" title="Format" trigger={format}>
        <OptionGrid
          columns={4}
          items={["SVG", "PNG", "WEBP", "JPEG"]}
          selected={format}
          onSelect={setFormat}
        />
      </SettingsRowPopover>
      <SettingsRowPopover hint="Platform size" title="Platform size" trigger="Web & social">
        <PresetList items={["Web & social", "Print", "Custom"]} selected="Web & social" onSelect={() => undefined} />
      </SettingsRowPopover>
      <SettingsRowPopover hint="Quality" title="Quality" trigger="Web & social">
        <PresetList items={["Web & social", "High", "Lossless"]} selected="Web & social" onSelect={() => undefined} />
      </SettingsRowPopover>
      <SettingsPrimaryButton>Download</SettingsPrimaryButton>
    </div>
  )
}

function SectionBody({ id }: { id: SectionId }) {
  switch (id) {
    case "Content":
      return <ContentSection />
    case "QR":
      return <QrStyleSection />
    case "Shape":
      return <CardSection />
    case "Background":
      return <SceneSection />
    case "Motion":
      return <MotionSection />
    case "Export":
      return <ExportSection />
    default:
      return null
  }
}

export function DesktopNewSettingsPanel() {
  const [openSection, setOpenSection] = useState<string | undefined>()

  return (
    <SettingsPanelShell>
      <SettingsScroll>
        <SettingsAccordion
          openSection={openSection}
          renderSection={(section) => <SectionBody id={section as SectionId} />}
          sections={SECTIONS}
          onOpenSectionChange={setOpenSection}
        />
      </SettingsScroll>
    </SettingsPanelShell>
  )
}

export function DesktopNewShell() {
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme === "dark" ? "dark" : "light"

  return (
    <ShapeProvider defaultShape="rounded">
      <div className="desktopnew-root desktopnew-shell" data-theme={theme}>
        <Button
          className="dn-pressable fixed right-4 top-4 h-8 border-border/80 px-3 text-xs tracking-tight dn-squircle-sm"
          type="button"
          variant="outline"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
        <DesktopNewSettingsPanel />
      </div>
    </ShapeProvider>
  )
}
