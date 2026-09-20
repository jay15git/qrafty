"use client"

import { Check, X } from "lucide-react"
import { AnimatePresence, m } from "motion/react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MobileRedoIcon,
  MobileUndoIcon,
} from "@/features/desktop-shell/components/MobileHistoryIcons"
import { MobileLayerToolbar } from "@/features/desktop-shell/components/MobileLayerToolbar"
import { MobileSettingsDrawer } from "@/features/desktop-shell/components/MobileSettingsDrawer"
import {
  clearMobileWorkspaceChromeInsets,
  syncMobileWorkspaceChromeInsets,
} from "@/features/desktop-shell/components/mobile-layer-toolbar-sync"
import { getMobileKeyboardInsetPx } from "@/features/desktop-shell/components/mobile-family-drawer-viewport"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  DESKTOP_SETTINGS_SECTIONS,
  getDesktopSettingsSectionLabel,
  type DesktopSettingsSectionId,
} from "@/features/desktop-shell/inspector/desktopnew-settings-panel-meta"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import {
  QR_STYLE_PART_DEFINITIONS,
  type QrStylePartId,
} from "@/features/desktop-shell/inspector/qr-style-parts"
import { SETTINGS_PREVIEW_TILE } from "@/features/desktop-shell/inspector/settings-preview-tiles"
import { SettingsSectionIconFor } from "@/features/desktop-shell/inspector/settings-section-icons"
import { QrStyleOptionPreview } from "@/features/qr-code/components/QrStyleOptionPreview"
import { ContentTypeGridIcon } from "@/features/qr-code/content/ContentTypeGridIcon"
import {
  PICKER_QR_INPUT_TYPES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"
import "@/features/desktop-shell/inspector/mobile-inspector.css"

const MOBILE_RAIL_BOTTOM_GAP_PX = 16

type MobileRailOption = {
  id: string
  label: string
  icon?: ReactNode
  /** Circle + label (default) or a plain text pill. */
  shape?: "circle" | "pill"
  /** Style part this option drills into, swapping the row for its catalogue. */
  drillsTo?: QrStylePartId
}

const RAIL_OPTION_ICON_CLASS = "dn-mobile-settings-rail__icon"

/** QR style parts, mirroring the `Part` control in the Style section. */
const QR_STYLE_PART_OPTIONS: MobileRailOption[] = [
  { id: "Module", label: "Module", shape: "pill", drillsTo: "Module" },
  { id: "Eye", label: "Eye", shape: "pill", drillsTo: "Eye" },
  { id: "Frame", label: "Frame", shape: "pill", drillsTo: "Frame" },
  { id: "Logo", label: "Logo", shape: "pill" },
]

/**
 * Options a family drills into. Families without an entry keep the rail on the
 * top-level list.
 */
const MOBILE_FAMILY_OPTIONS: Partial<Record<DesktopSettingsSectionId, MobileRailOption[]>> = {
  Content: PICKER_QR_INPUT_TYPES.map((type) => ({
    id: type,
    label: QR_INPUT_OPTIONS[type].label,
    icon: <ContentTypeGridIcon className={RAIL_OPTION_ICON_CLASS} type={type} />,
  })),
  QR: QR_STYLE_PART_OPTIONS,
}

/**
 * Second drill level: the style catalogue for one part, rendered in place of
 * the part row. Picking a tile applies it straight to the QR, so the rail stays
 * a quick-pick surface and the drawer is only needed for the long tail.
 */
function QrStylePartOptions({
  model,
  partId,
}: {
  model: DesktopInspectorModel
  partId: QrStylePartId
}) {
  const part = QR_STYLE_PART_DEFINITIONS[partId]
  const selected = part.readSelected(model)

  return part.options.map((option) => (
    <button
      key={option.value}
      aria-label={option.label}
      aria-pressed={selected === option.value}
      className={cn(SETTINGS_PREVIEW_TILE, "text-center")}
      data-slot="mobile-rail-style-option"
      title={option.label}
      type="button"
      onClick={() => part.applySelected(model, option.value)}
    >
      <span
        aria-hidden="true"
        className="grid size-full place-items-center overflow-hidden p-0.5 dn-squircle-xs"
      >
        <QrStyleOptionPreview
          className="size-full max-h-full max-w-full"
          previewKind={part.previewKind}
          value={option.value}
        />
      </span>
    </button>
  ))
}

function useMobileKeyboardInset() {
  const [keyboardInset, setKeyboardInset] = useState(0)

  useLayoutEffect(() => {
    let remeasureTimer = 0

    const update = () => {
      setKeyboardInset(getMobileKeyboardInsetPx(window.innerHeight, window.visualViewport))
    }

    const remeasureAfterKeyboard = () => {
      update()
      window.clearTimeout(remeasureTimer)
      // iOS often skips visualViewport.resize after blur; trailing pass catches close.
      remeasureTimer = window.setTimeout(update, 280)
    }

    update()
    window.addEventListener("resize", remeasureAfterKeyboard)
    window.visualViewport?.addEventListener("resize", remeasureAfterKeyboard)
    window.visualViewport?.addEventListener("scroll", update)
    document.addEventListener("focusout", remeasureAfterKeyboard)
    document.addEventListener("focusin", remeasureAfterKeyboard)

    return () => {
      window.clearTimeout(remeasureTimer)
      window.removeEventListener("resize", remeasureAfterKeyboard)
      window.visualViewport?.removeEventListener("resize", remeasureAfterKeyboard)
      window.visualViewport?.removeEventListener("scroll", update)
      document.removeEventListener("focusout", remeasureAfterKeyboard)
      document.removeEventListener("focusin", remeasureAfterKeyboard)
    }
  }, [])

  return keyboardInset
}

function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    // The rail's height feeds the workspace canvas inset, so an unthrottled
    // observer turns a height animation into per-frame React renders.
    let frame = 0
    const measure = () => {
      if (frame) {
        return
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setHeight(node.getBoundingClientRect().height)
      })
    }

    setHeight(node.getBoundingClientRect().height)

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return { height, ref }
}

export function MobileSettingsRail({ model }: { model: DesktopInspectorModel }) {
  const { controller } = model
  const theme = model.actualDesktopTheme
  const { height: railHeight, ref: railRef } = useMeasuredHeight<HTMLDivElement>()
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const [openFamily, setOpenFamily] = useState<DesktopSettingsSectionId | null>(null)
  const [openPart, setOpenPart] = useState<QrStylePartId | null>(null)
  const [drawerSection, setDrawerSection] = useState<DesktopSettingsSectionId | null>(null)
  const keyboardInset = useMobileKeyboardInset()

  const options = openFamily ? MOBILE_FAMILY_OPTIONS[openFamily] : undefined
  const part = openPart ? QR_STYLE_PART_DEFINITIONS[openPart] : undefined
  const railViewKey = part ? `part:${openPart}` : options ? `family:${openFamily}` : "families"

  const goToNextFamily = useCallback(() => {
    if (!openFamily) {
      return
    }
    setOpenPart(null)
    const index = DESKTOP_SETTINGS_SECTIONS.indexOf(openFamily)
    for (let step = 1; step <= DESKTOP_SETTINGS_SECTIONS.length; step += 1) {
      const candidate =
        DESKTOP_SETTINGS_SECTIONS[(index + step) % DESKTOP_SETTINGS_SECTIONS.length]
      if (MOBILE_FAMILY_OPTIONS[candidate]) {
        setOpenFamily(candidate)
        return
      }
    }
  }, [openFamily])

  // The corner cross steps back one drill level before it leaves the family.
  const goBack = useCallback(() => {
    if (openPart) {
      setOpenPart(null)
      return
    }
    setOpenFamily(null)
  }, [openPart])

  useEffect(() => {
    syncMobileWorkspaceChromeInsets({
      drawerHeight: railHeight,
      toolbarHeight,
      drawerBottomGapPx: MOBILE_RAIL_BOTTOM_GAP_PX,
      keyboardInsetPx: keyboardInset,
    })
  }, [keyboardInset, railHeight, toolbarHeight])

  useEffect(() => {
    return () => {
      clearMobileWorkspaceChromeInsets()
    }
  }, [])

  return (
    <DesktopnewThemeContext.Provider value={theme}>
      <MobileLayerToolbar onToolbarHeightChange={setToolbarHeight} model={model} theme={theme} />
      <div
        ref={railRef}
        className="desktopnew-root pointer-events-auto fixed z-[35]"
        data-desktop-theme={theme}
        data-mobile-inspector=""
        data-slot="mobile-settings-rail-root"
        data-theme={theme}
      >
        <ScrollArea
          className="dn-mobile-settings-rail__scroll w-full min-w-0 max-w-full overflow-hidden"
          chevron={false}
          cueSize="tight"
          orientation="horizontal"
          persistKey={`mobile-settings-rail:${railViewKey}`}
          scrollFade
          showScrollbar={false}
          viewportClassName="min-w-0"
        >
          <AnimatePresence initial={false} mode="wait">
            <m.div
              key={railViewKey}
              animate={{ opacity: 1 }}
              aria-label={
                part
                  ? `${openPart} options`
                  : options
                    ? `${openFamily} options`
                    : "Settings sections"
              }
              className="dn-mobile-settings-rail__row"
              exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeIn" } }}
              initial={{ opacity: 0 }}
              role="group"
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {part && openPart ? (
                <QrStylePartOptions model={model} partId={openPart} />
              ) : options ? (
                options.map((option) => (
                  <button
                    key={option.id}
                    className={
                      option.shape === "pill"
                        ? "dn-mobile-settings-rail__item dn-mobile-settings-rail__item--pill"
                        : "dn-mobile-settings-rail__item"
                    }
                    type="button"
                    onClick={() => {
                      if (option.drillsTo) {
                        setOpenPart(option.drillsTo)
                        return
                      }
                      if (openFamily === "Content") {
                        model.onContentTypeChange(option.id as QrInputType)
                      }
                      setDrawerSection(openFamily)
                    }}
                  >
                    {option.shape === "pill" ? (
                      <span className="dn-mobile-settings-rail__pill">{option.label}</span>
                    ) : (
                      <>
                        <span className="dn-mobile-settings-rail__circle">{option.icon}</span>
                        <span className="dn-mobile-settings-rail__label">{option.label}</span>
                      </>
                    )}
                  </button>
                ))
              ) : (
                DESKTOP_SETTINGS_SECTIONS.map((section) => (
                  <button
                    key={section}
                    className="dn-mobile-settings-rail__item"
                    type="button"
                    onClick={() =>
                      setOpenFamily((current) => (current === section ? null : section))
                    }
                  >
                    <span className="dn-mobile-settings-rail__circle">
                      <SettingsSectionIconFor
                        className="dn-mobile-settings-rail__icon"
                        section={section}
                        size={20}
                      />
                    </span>
                    <span className="dn-mobile-settings-rail__label">
                      {getDesktopSettingsSectionLabel(section)}
                    </span>
                  </button>
                ))
              )}
            </m.div>
          </AnimatePresence>
        </ScrollArea>
        <AnimatePresence initial={false}>
          {options ? (
            <m.div
              key="rail-actions"
              animate={{ height: "auto", opacity: 1 }}
              className="dn-mobile-settings-rail__actions"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            >
              <button
                aria-label="Close options"
                className="dn-mobile-settings-rail__action"
                type="button"
                onClick={goBack}
              >
                <X aria-hidden size={18} strokeWidth={2.25} />
              </button>
              {/* History lives in the thumb zone, between the corners. */}
              <span
                className="dn-mobile-settings-rail__history"
                data-slot="mobile-rail-history"
              >
                <button
                  aria-label="Undo"
                  className="dn-mobile-settings-rail__action dn-mobile-settings-rail__action--history"
                  disabled={!controller?.canUndo || !controller?.onUndo}
                  type="button"
                  onClick={() => controller?.onUndo?.()}
                >
                  <MobileUndoIcon className="size-4" />
                </button>
                <button
                  aria-label="Redo"
                  className="dn-mobile-settings-rail__action dn-mobile-settings-rail__action--history"
                  disabled={!controller?.canRedo || !controller?.onRedo}
                  type="button"
                  onClick={() => controller?.onRedo?.()}
                >
                  <MobileRedoIcon className="size-4" />
                </button>
              </span>
              <button
                aria-label="Next settings family"
                className="dn-mobile-settings-rail__action"
                type="button"
                onClick={goToNextFamily}
              >
                <Check aria-hidden size={18} strokeWidth={2.25} />
              </button>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
      <MobileSettingsDrawer
        model={model}
        onClose={() => setDrawerSection(null)}
        onSectionChange={setDrawerSection}
        section={drawerSection}
      />
    </DesktopnewThemeContext.Provider>
  )
}
