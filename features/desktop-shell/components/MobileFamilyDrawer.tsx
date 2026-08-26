"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"

import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerButton,
  FamilyDrawerContent,
  FamilyDrawerHeader,
  FamilyDrawerPortal,
  FamilyDrawerRoot,
  FamilyDrawerViewContent,
  useFamilyDrawer,
  type ViewsRegistry,
} from "@/components/ui/family-drawer"
import { DesktopElementInspector } from "@/features/desktop-shell/components/DesktopElementInspector"
import { DesktopPexelsPhotoInspector } from "@/features/desktop-shell/components/DesktopPexelsPhotoInspector"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import {
  DESKTOP_SETTINGS_SECTIONS,
  MOBILE_DRAWER_VIEW_FOR_SECTION,
  SECTION_TO_TOOL,
  type DesktopSettingsSectionId,
} from "@/features/desktop-shell/inspector/desktopnew-settings-panel-meta"
import { SettingsSectionBody } from "@/features/desktop-shell/inspector/desktopnew-settings-sections"
import {
  MobileInspectorDensityContext,
} from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { SettingsSectionIconFor } from "@/features/desktop-shell/inspector/settings-section-icons"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"
import "@/features/desktop-shell/inspector/mobile-inspector.css"

const MOBILE_DRAWER_BOTTOM_GAP_PX = 16

const MobileInspectorContext = createContext<DesktopInspectorModel | null>(null)

function useMobileInspectorModel() {
  const model = useContext(MobileInspectorContext)
  if (!model) {
    throw new Error("MobileFamilyDrawer views require MobileInspectorContext")
  }
  return model
}

function syncMobileDrawerHeight(height: number) {
  const inset = Math.max(0, Math.round(height + MOBILE_DRAWER_BOTTOM_GAP_PX))
  const value = `${inset}px`
  const targets: Array<HTMLElement | null> = [
    document.documentElement,
    document.querySelector<HTMLElement>('[data-slot="desktop-workspace"]'),
    document.querySelector<HTMLElement>('[data-slot="desktop-floating-toolbar-root"]'),
  ]

  for (const target of targets) {
    target?.style.setProperty("--desktop-mobile-drawer-height", value)
    target?.style.setProperty("--desktop-workspace-canvas-inset-bottom", value)
  }
}

function MobileDrawerHeightSync() {
  const { bounds } = useFamilyDrawer()

  useEffect(() => {
    syncMobileDrawerHeight(bounds.height)
  }, [bounds.height])

  useEffect(() => {
    return () => {
      syncMobileDrawerHeight(0)
    }
  }, [])

  return null
}

function MobileDrawerCloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10.4854 1.99998L2.00007 10.4853"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.4854 10.4844L2.00007 1.99908"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MobileNestedHeader({
  title,
  onClose,
}: {
  title: string
  onClose: () => void
}) {
  return (
    <header className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-3">
      <h2 className="text-[19px] font-semibold text-foreground">{title}</h2>
      <button
        aria-label="Back"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        data-vaul-no-drag=""
        type="button"
        onClick={onClose}
      >
        <MobileDrawerCloseIcon />
      </button>
    </header>
  )
}

function MobileInspectorScroll({ children }: { children: ReactNode }) {
  return (
    <div
      className="max-h-[min(52dvh,24rem)] overflow-y-auto overflow-x-hidden"
      data-mobile-inspector=""
    >
      {children}
    </div>
  )
}

function MobileSectionView({ section }: { section: DesktopSettingsSectionId }) {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()

  return (
    <div className="desktopnew-root w-full min-w-0" data-theme={model.actualDesktopTheme}>
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileNestedHeader title={section} onClose={() => setView("default")} />
        <MobileInspectorScroll>
          <SettingsSectionBody id={section} model={model} />
        </MobileInspectorScroll>
      </DesktopnewThemeContext.Provider>
    </div>
  )
}

function MobileMenuView() {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()
  const controller = model.controller
  const selectedLayer = controller?.selectedElementLayer

  function openSection(section: DesktopSettingsSectionId) {
    const tool = SECTION_TO_TOOL[section]
    if (tool) {
      model.onActiveToolChange(tool)
    }
    setView(MOBILE_DRAWER_VIEW_FOR_SECTION[section])
  }

  return (
    <div className="flex flex-col">
      <FamilyDrawerHeader
        className="mb-3 gap-0 border-b border-border pb-3"
        title="Settings"
      />
      <div className="flex flex-col gap-2">
        {DESKTOP_SETTINGS_SECTIONS.map((section) => (
          <FamilyDrawerButton key={section} onClick={() => openSection(section)}>
            <SettingsSectionIconFor className="text-foreground" section={section} size={22} />
            <span>{section}</span>
          </FamilyDrawerButton>
        ))}
        {selectedLayer && controller?.onElementLayerPatch ? (
          <FamilyDrawerButton onClick={() => setView("element")}>
            <SettingsSectionIconFor className="text-foreground" section="Effects" size={22} />
            <span>Layer style</span>
          </FamilyDrawerButton>
        ) : null}
      </div>
    </div>
  )
}

function MobileElementView() {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()
  const layer = model.controller?.selectedElementLayer
  const onPatch = model.controller?.onElementLayerPatch

  if (!layer || !onPatch) {
    return (
      <MobileNestedHeader title="Layer style" onClose={() => setView("default")} />
    )
  }

  return (
    <div className="desktopnew-root w-full min-w-0" data-theme={model.actualDesktopTheme}>
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileNestedHeader title="Layer style" onClose={() => setView("default")} />
        <MobileInspectorScroll>
          <DesktopElementInspector layer={layer} onPatch={onPatch} />
        </MobileInspectorScroll>
      </DesktopnewThemeContext.Provider>
    </div>
  )
}

function MobileStockPhotosView() {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()
  const controller = model.controller

  return (
    <div className="flex min-h-0 flex-col">
      <MobileNestedHeader
        title="Stock photos"
        onClose={() => {
          controller?.onCloseComposeSidebar?.()
          setView("elements")
        }}
      />
      <MobileInspectorScroll>
        <DesktopPexelsPhotoInspector
          onClose={() => {
            controller?.onCloseComposeSidebar?.()
            setView("elements")
          }}
          onSelectPhoto={(imageUrl) => controller?.onSelectStockPhoto?.(imageUrl)}
        />
      </MobileInspectorScroll>
    </div>
  )
}

function createMobileViews(): ViewsRegistry {
  return {
    default: MobileMenuView,
    content: () => <MobileSectionView section="Content" />,
    qr: () => <MobileSectionView section="QR" />,
    motion: () => <MobileSectionView section="Motion" />,
    shape: () => <MobileSectionView section="Shape" />,
    background: () => <MobileSectionView section="Background" />,
    elements: () => <MobileSectionView section="Elements" />,
    element: MobileElementView,
    "stock-photos": MobileStockPhotosView,
  }
}

function MobileDrawerViewRouter({ model }: { model: DesktopInspectorModel }) {
  const { setView } = useFamilyDrawer()
  const composePanel = model.controller?.composeSidebarPanel

  useEffect(() => {
    if (composePanel === "stock-photos") {
      setView("stock-photos")
    }
  }, [composePanel, setView])

  return null
}

export function MobileFamilyDrawer({
  className,
  model,
}: {
  className?: string
  model: DesktopInspectorModel
}) {
  const views = createMobileViews()
  const theme = model.actualDesktopTheme

  return (
    <MobileInspectorContext.Provider value={model}>
      <MobileInspectorDensityContext.Provider value={true}>
        <FamilyDrawerRoot
          dismissible={false}
          defaultOpen
          modal={false}
          open
          views={views}
        >
          <MobileDrawerViewRouter model={model} />
          <FamilyDrawerPortal>
            <FamilyDrawerContent
              className={cn(
                "desktopnew-root shadow-[var(--dn-popover-shadow)]",
                className,
              )}
              data-desktop-theme={theme}
              data-slot="mobile-family-drawer-root"
              data-theme={theme}
              variant="card"
            >
              <MobileDrawerHeightSync />
              <FamilyDrawerAnimatedWrapper className="px-5 pb-5 pt-4">
                <FamilyDrawerAnimatedContent>
                  <FamilyDrawerViewContent />
                </FamilyDrawerAnimatedContent>
              </FamilyDrawerAnimatedWrapper>
            </FamilyDrawerContent>
          </FamilyDrawerPortal>
        </FamilyDrawerRoot>
      </MobileInspectorDensityContext.Provider>
    </MobileInspectorContext.Provider>
  )
}
