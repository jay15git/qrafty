"use client"

import { ArrowLeftIcon } from "lucide-react"
import { createContext, useContext, useEffect, type ReactNode } from "react"

import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerButton,
  FamilyDrawerContent,
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
import { SettingsSectionIconFor } from "@/features/desktop-shell/inspector/settings-section-icons"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"

const MobileInspectorContext = createContext<DesktopInspectorModel | null>(null)

function useMobileInspectorModel() {
  const model = useContext(MobileInspectorContext)
  if (!model) {
    throw new Error("MobileFamilyDrawer views require MobileInspectorContext")
  }
  return model
}

function syncMobileDrawerHeight(height: number) {
  const value = `${Math.max(0, Math.round(height))}px`
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

function MobileSectionHeader({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  return (
    <header className="mb-3 flex items-center gap-2 border-b border-border pb-3">
      <button
        aria-label="Back"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent"
        data-vaul-no-drag=""
        type="button"
        onClick={onBack}
      >
        <ArrowLeftIcon className="size-4" />
      </button>
      <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
    </header>
  )
}

function MobileSectionView({ section }: { section: DesktopSettingsSectionId }) {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()

  return (
    <div className="desktopnew-root desktopnew-embedded w-full min-w-0" data-theme={model.actualDesktopTheme}>
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileSectionHeader title={section} onBack={() => setView("default")} />
        <div className="max-h-[min(52dvh,24rem)] overflow-y-auto overflow-x-hidden">
          <SettingsSectionBody id={section} model={model} />
        </div>
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
    <div className="flex flex-col gap-2">
      <h2 className="mb-1 text-[17px] font-semibold text-foreground">Settings</h2>
      <div className="flex flex-col gap-2">
        {DESKTOP_SETTINGS_SECTIONS.map((section) => (
          <FamilyDrawerButton key={section} onClick={() => openSection(section)}>
            <SettingsSectionIconFor className="text-foreground" section={section} size={18} />
            <span>{section}</span>
          </FamilyDrawerButton>
        ))}
        {selectedLayer && controller?.onElementLayerPatch ? (
          <FamilyDrawerButton onClick={() => setView("element")}>
            <SettingsSectionIconFor className="text-foreground" section="Effects" size={18} />
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
      <MobileSectionHeader title="Layer style" onBack={() => setView("default")} />
    )
  }

  return (
    <div
      className="desktopnew-root desktopnew-embedded w-full min-w-0"
      data-theme={model.actualDesktopTheme}
    >
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileSectionHeader title="Layer style" onBack={() => setView("default")} />
        <div className="max-h-[min(52dvh,24rem)] overflow-y-auto overflow-x-hidden">
          <DesktopElementInspector layer={layer} onPatch={onPatch} />
        </div>
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
      <MobileSectionHeader
        title="Stock photos"
        onBack={() => {
          controller?.onCloseComposeSidebar?.()
          setView("elements")
        }}
      />
      <div className="max-h-[min(52dvh,24rem)] overflow-y-auto overflow-x-hidden">
        <DesktopPexelsPhotoInspector
          onClose={() => {
            controller?.onCloseComposeSidebar?.()
            setView("elements")
          }}
          onSelectPhoto={(imageUrl) => controller?.onSelectStockPhoto?.(imageUrl)}
        />
      </div>
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

  return (
    <MobileInspectorContext.Provider value={model}>
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
              "border-t border-border shadow-[0_-8px_32px_rgba(0,0,0,0.12)]",
              className,
            )}
            variant="sheet"
          >
            <MobileDrawerHeightSync />
            <FamilyDrawerAnimatedWrapper
              className="px-4 pb-4 pt-3"
              data-slot="mobile-family-drawer"
            >
              <FamilyDrawerAnimatedContent>
                <FamilyDrawerViewContent />
              </FamilyDrawerAnimatedContent>
            </FamilyDrawerAnimatedWrapper>
          </FamilyDrawerContent>
        </FamilyDrawerPortal>
      </FamilyDrawerRoot>
    </MobileInspectorContext.Provider>
  )
}
