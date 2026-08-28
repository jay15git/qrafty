"use client"

import {
  ALargeSmallIcon,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Copy,
  Trash2,
  Type,
} from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import {
  MOBILE_LAYER_TOOLBAR_GAP_PX,
} from "@/features/desktop-shell/components/mobile-layer-toolbar-sync"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { useMobileDrawerNavigation } from "@/features/desktop-shell/inspector/mobile-drawer-navigation-context"
import { TextFontPickerContent } from "@/features/desktop-shell/inspector/text-font-picker-content"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  FillColorToolbarButton,
  LayerFloatingToolbarSettings,
  TextSizeSettings,
  TextTypographySettings,
} from "@/features/workspace/components/LayerFloatingToolbarSettings"
import { isDraftingEmojiLayer } from "@/features/workspace/model/layer-floating-settings"
import { cn } from "@/lib/utils"

function MobileLayerToolbarButton({
  ariaLabel,
  children,
  disabled = false,
  onClick,
}: {
  ariaLabel: string
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="dn-mobile-layer-toolbar-button flex size-[var(--dn-icon-hit)] shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--dn-fg)] transition-colors hover:bg-[var(--dn-control)] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dn-fg)]/20"
      data-slot="mobile-layer-toolbar-button"
      data-vaul-no-drag=""
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function MobileLayerToolbarSeparator() {
  return (
    <div
      aria-hidden
      className="mx-0.5 h-5 w-px shrink-0 bg-[color-mix(in_srgb,var(--dn-line)_55%,transparent)]"
      data-slot="mobile-layer-toolbar-separator"
    />
  )
}

function MobileLayerToolbarDetailButton({
  ariaLabel,
  content,
  title,
  children,
}: {
  ariaLabel: string
  content: ReactNode
  title: string
  children: ReactNode
}) {
  const mobileNav = useMobileDrawerNavigation()

  return (
    <MobileLayerToolbarButton
      ariaLabel={ariaLabel}
      onClick={() => {
        mobileNav?.openDetail({
          title,
          content: (
            <div className="dn-portal-surface w-full min-w-0" data-mobile-inspector="">
              {content}
            </div>
          ),
        })
      }}
    >
      {children}
    </MobileLayerToolbarButton>
  )
}

function MobileLayerTextTools({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  const mobileNav = useMobileDrawerNavigation()

  if (isDraftingEmojiLayer(layer)) {
    return (
      <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
        <LayerFloatingToolbarSettings layer={layer} onPatch={onPatch} theme={theme} />
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
      <FillColorToolbarButton
        ariaLabel="Text color"
        theme={theme}
        title="Text color"
        value={layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill}
        onValueChange={(_fill, css) =>
          onPatch({ fill: fillPreviewHex(css), textRuns: undefined })
        }
      />
      <MobileLayerToolbarDetailButton
        ariaLabel="Text font"
        content={
          <TextFontPickerContent
            layer={layer}
            onPatch={onPatch}
            onSelect={() => mobileNav?.closeDetail()}
          />
        }
        title="Text font"
      >
        <Type className="size-4" strokeWidth={2} />
      </MobileLayerToolbarDetailButton>
      <MobileLayerToolbarDetailButton
        ariaLabel="Text formatting"
        content={<TextTypographySettings layer={layer} onPatch={onPatch} />}
        title="Text formatting"
      >
        <span aria-hidden className="text-[15px] font-semibold leading-none">A</span>
      </MobileLayerToolbarDetailButton>
      <MobileLayerToolbarDetailButton
        ariaLabel="Text size"
        content={<TextSizeSettings layer={layer} onPatch={onPatch} />}
        title="Text size"
      >
        <ALargeSmallIcon className="size-4" strokeWidth={2} />
      </MobileLayerToolbarDetailButton>
    </div>
  )
}

function MobileLayerSpecificTools({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  if (layer.kind === "text") {
    return <MobileLayerTextTools layer={layer} onPatch={onPatch} theme={theme} />
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
      <LayerFloatingToolbarSettings layer={layer} onPatch={onPatch} theme={theme} />
    </div>
  )
}

export function MobileLayerToolbar({
  model,
  onToolbarHeightChange,
  theme,
}: {
  model: DesktopInspectorModel
  onToolbarHeightChange: (height: number) => void
  theme: DesktopThemeMode
}) {
  const controller = model.controller
  const selectedLayerIds = controller?.selectedLayerIds ?? []
  const selectedElementLayer = controller?.selectedElementLayer
  const onElementLayerPatch = controller?.onElementLayerPatch
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = toolbarRef.current
    if (!node || selectedLayerIds.length === 0) {
      onToolbarHeightChange(0)
      return
    }

    const updateHeight = () => {
      onToolbarHeightChange(Math.round(node.getBoundingClientRect().height))
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)

    return () => {
      observer.disconnect()
      onToolbarHeightChange(0)
    }
  }, [onToolbarHeightChange, selectedLayerIds.length])

  if (selectedLayerIds.length === 0) {
    return null
  }

  const canCopy = Boolean(controller?.canCopyLayers && controller?.onLayerCopy)
  const canDelete = selectedLayerIds.some(
    (layerId) => controller?.canDeleteLayer?.(layerId) ?? false,
  )
  const canReorder = Boolean(controller?.onLayerMenuAction)

  const showLayerTools =
    selectedLayerIds.length === 1 &&
    selectedElementLayer &&
    onElementLayerPatch &&
    (selectedElementLayer.kind === "text" ||
      selectedElementLayer.kind === "shape" ||
      selectedElementLayer.kind === "image" ||
      selectedElementLayer.kind === "shader")

  return (
    <DesktopnewThemeContext.Provider value={theme}>
      <div
        ref={toolbarRef}
        className={cn(
          "desktopnew-root pointer-events-auto fixed z-[35]",
          "left-[max(1rem,env(safe-area-inset-left,0px))]",
          "w-[calc(100%-max(1rem,env(safe-area-inset-left,0px))-max(1rem,env(safe-area-inset-right,0px)))]",
        )}
        data-desktop-theme={theme}
        data-mobile-inspector=""
        data-slot="mobile-layer-toolbar"
        data-theme={theme}
        style={{
          bottom: `calc(var(--desktop-mobile-drawer-height, 0px) + ${MOBILE_LAYER_TOOLBAR_GAP_PX}px)`,
        }}
      >
        <ScrollArea
          className="dn-mobile-layer-toolbar-scroll h-fit w-full min-w-0 max-w-full overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--dn-line)_45%,transparent)] bg-[var(--dn-bg)] shadow-[var(--dn-popover-shadow)]"
          chevron={false}
          cueSize="tight"
          orientation="horizontal"
          persistKey="mobile-layer-toolbar"
          scrollFade
          showScrollbar={false}
          viewportClassName="min-w-0 w-full max-w-full"
        >
          <div
            className="flex min-w-max items-center gap-0.5 px-2 py-1"
            data-slot="mobile-layer-toolbar-row"
            role="toolbar"
            aria-label="Layer actions"
          >
            {showLayerTools ? (
              <>
                <MobileLayerSpecificTools
                  layer={selectedElementLayer!}
                  onPatch={onElementLayerPatch!}
                  theme={theme}
                />
                <MobileLayerToolbarSeparator />
              </>
            ) : null}
            <MobileLayerToolbarButton
              ariaLabel="Copy selection"
              disabled={!canCopy}
              onClick={() => controller?.onLayerCopy?.()}
            >
              <Copy className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarButton
              ariaLabel="Delete selection"
              disabled={!canDelete || !controller?.onLayerMenuAction}
              onClick={() => controller?.onLayerMenuAction?.("delete")}
            >
              <Trash2 className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarSeparator />
            <MobileLayerToolbarButton
              ariaLabel="Bring to front"
              disabled={!canReorder}
              onClick={() => controller?.onLayerMenuAction?.("front")}
            >
              <ArrowUpToLine className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarButton
              ariaLabel="Bring forward"
              disabled={!canReorder}
              onClick={() => controller?.onLayerMenuAction?.("forward")}
            >
              <ArrowUp className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarButton
              ariaLabel="Send backward"
              disabled={!canReorder}
              onClick={() => controller?.onLayerMenuAction?.("backward")}
            >
              <ArrowDown className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarButton
              ariaLabel="Send to back"
              disabled={!canReorder}
              onClick={() => controller?.onLayerMenuAction?.("back")}
            >
              <ArrowDownToLine className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
          </div>
        </ScrollArea>
      </div>
    </DesktopnewThemeContext.Provider>
  )
}
