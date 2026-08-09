"use client"

import { useId } from "react"
import { ApertureIcon, CornersOutIcon, DropIcon, LinkIcon, PaletteIcon, ScanIcon } from "@phosphor-icons/react"

import { ExpandableTab, type ExpandableTabItem } from "@/components/atomixui/expandable-tab"
import type { QrFinderPatternOuterStyle } from "@/features/qr-code/model/types"
import { clampQrSize, setSquareQrSize, type StudioCornerDotStyle, type StudioDataModulesStyle } from "@/features/qr-code/model/state"
import { CORNER_DOT_STYLE_OPTIONS, CORNER_SQUARE_STYLE_OPTIONS, DOT_STYLE_OPTIONS } from "@/features/qr-code/styles/style-options"
import type { QrLabControlsProps } from "@/components/desktopexperiment/qr-lab-types"

const TOOLS: ExpandableTabItem[] = [
  { id: "content", label: "Content", icon: LinkIcon },
  { id: "modules", label: "Modules", icon: ApertureIcon },
  { id: "corners", label: "Corners", icon: CornersOutIcon },
  { id: "color", label: "Color", icon: PaletteIcon },
  { id: "background", label: "Background", icon: DropIcon },
  { id: "output", label: "Output", icon: ScanIcon },
] as const

export function QrLabControls({ setState, state }: QrLabControlsProps) {
  return <div className="qr-lab-expandable-tabs">
    <ExpandableTab
      defaultActiveId="content"
      panelWidth={420}
      tabs={TOOLS.map(({ icon: Icon, id, label }) => ({ id, label, icon: <Icon key={id} size={18} /> }))}
      renderPanel={(section) => renderTool(section, state, setState)}
    />
  </div>
}

function renderTool(section: string, state: QrLabControlsProps["state"], setState: QrLabControlsProps["setState"]) {
  if (section === "content") return <Tool title="Content"><textarea aria-label="Content" placeholder="Paste a link or write text" value={state.data} onChange={(event) => setState((current) => ({ ...current, data: event.target.value }))} />{!state.data.trim() ? <p className="qr-lab-error">Add a link or text to generate QR.</p> : null}</Tool>
  if (section === "modules") return <Tool title="Modules"><Select label="Shape" value={state.dataModulesSettings.type} options={DOT_STYLE_OPTIONS} onChange={(value) => setState((current) => ({ ...current, dataModulesSettings: { ...current.dataModulesSettings, type: value as StudioDataModulesStyle } }))} /><Toggle label="Rounded sizing" checked={state.dataModulesSettings.roundSize} onChange={(checked) => setState((current) => ({ ...current, dataModulesSettings: { ...current.dataModulesSettings, roundSize: checked } }))} /></Tool>
  if (section === "corners") return <Tool title="Corners"><Select label="Outer" value={state.finderPatternOuterSettings.type} options={CORNER_SQUARE_STYLE_OPTIONS} onChange={(value) => setState((current) => ({ ...current, finderPatternOuterSettings: { ...current.finderPatternOuterSettings, type: value as QrFinderPatternOuterStyle } }))} /><Select label="Inner" value={state.finderPatternInnerSettings.type} options={CORNER_DOT_STYLE_OPTIONS} onChange={(value) => setState((current) => ({ ...current, finderPatternInnerSettings: { ...current.finderPatternInnerSettings, type: value as StudioCornerDotStyle } }))} /></Tool>
  if (section === "color") return <Tool title="Color"><Color label="Modules" value={state.dataModulesSettings.color} onChange={(value) => setState((current) => ({ ...current, dataModulesSettings: { ...current.dataModulesSettings, color: value }, finderPatternOuterSettings: { ...current.finderPatternOuterSettings, color: value }, finderPatternInnerSettings: { ...current.finderPatternInnerSettings, color: value } }))} /></Tool>
  if (section === "background") return <Tool title="Background"><Color label="Canvas" value={state.backgroundOptions.color} onChange={(value) => setState((current) => ({ ...current, backgroundOptions: { ...current.backgroundOptions, color: value } }))} /><Range label="Corners" value={state.backgroundOptions.round} min={0} max={48} unit="px" onChange={(value) => setState((current) => ({ ...current, backgroundOptions: { ...current.backgroundOptions, round: value } }))} /></Tool>
  return <Tool title="Output"><Range label="Size" value={state.width} min={120} max={720} unit="px" onChange={(value) => setState((current) => setSquareQrSize(current, clampQrSize(value)))} /><Range label="Quiet zone" value={state.margin} min={0} max={48} unit="px" onChange={(value) => setState((current) => ({ ...current, margin: value }))} /><Select label="Correction" value={state.qrOptions.errorCorrectionLevel} options={[{ label: "Low", value: "L" }, { label: "Medium", value: "M" }, { label: "Quartile", value: "Q" }, { label: "High", value: "H" }]} onChange={(value) => setState((current) => ({ ...current, qrOptions: { ...current.qrOptions, errorCorrectionLevel: value as typeof current.qrOptions.errorCorrectionLevel } }))} /></Tool>
}

function Tool({ children, title }: { children: React.ReactNode; title: string }) { return <section className="qr-lab-tool-content"><h2>{title}</h2>{children}</section> }
function Select({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: ReadonlyArray<{ label: string; value: string }>; value: string }) { const id = useId(); return <label className="qr-lab-field" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> }
function Color({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) { const id = useId(); return <label className="qr-lab-field" htmlFor={id}><span>{label}</span><span className="qr-lab-color"><input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value)} /><code>{value.toUpperCase()}</code></span></label> }
function Range({ label, max, min, onChange, unit, value }: { label: string; max: number; min: number; onChange: (value: number) => void; unit: string; value: number }) { const id = useId(); return <label className="qr-lab-field" htmlFor={id}><span>{label}</span><span className="qr-lab-range"><input id={id} min={min} max={max} type="range" value={value} onChange={(event) => onChange(Number(event.target.value))} /><output>{value}{unit}</output></span></label> }
function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) { const id = useId(); return <label className="qr-lab-toggle" htmlFor={id}><span>{label}</span><input checked={checked} id={id} type="checkbox" onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label> }
