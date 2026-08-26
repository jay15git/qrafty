"use client"

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  type ReactNode,
} from "react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
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
import {
  MobileDrawerNavigationProvider,
  useMobileDrawerNavigation,
} from "@/features/desktop-shell/inspector/mobile-drawer-navigation-context"
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
    const nextHeight = bounds.height
    if (nextHeight <= 0) {
      return
    }

    syncMobileDrawerHeight(nextHeight)
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

function MobileSectionView({ section }: { section: DesktopSettingsSectionId }) {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()

  return (
    <div className="desktopnew-root w-full min-w-0" data-theme={model.actualDesktopTheme}>
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileNestedHeader title={section} onClose={() => setView("default")} />
        <SettingsSectionBody id={section} model={model} />
      </DesktopnewThemeContext.Provider>
    </div>
  )
}

function MobileContentSectionView() {
  return <MobileSectionView section="Content" />
}

function MobileQrSectionView() {
  return <MobileSectionView section="QR" />
}

function MobileMotionSectionView() {
  return <MobileSectionView section="Motion" />
}

function MobileShapeSectionView() {
  return <MobileSectionView section="Shape" />
}

function MobileBackgroundSectionView() {
  return <MobileSectionView section="Background" />
}

function MobileElementsSectionView() {
  return <MobileSectionView section="Elements" />
}

const MOBILE_MENU_ROW_CLASS = "flex min-w-max gap-2 px-1 py-1"

function MobileMenuView() {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()
  const controller = model.controller
  const selectedLayer = controller?.selectedElementLayer

  function openSection(section: DesktopSettingsSectionId) {
    setView(MOBILE_DRAWER_VIEW_FOR_SECTION[section])
    const tool = SECTION_TO_TOOL[section]
    if (tool) {
      startTransition(() => {
        model.onActiveToolChange(tool)
      })
    }
  }

  return (
    <div className="flex flex-col">
      <FamilyDrawerHeader
        className="mb-3 gap-0 border-b border-border pb-3"
        title="Settings"
      />
      <ScrollArea
        className="w-full min-w-0 max-w-full overflow-hidden"
        chevron={false}
        cueSize="tight"
        orientation="horizontal"
        scrollFade
        showScrollbar={false}
        viewportClassName="min-w-0"
      >
        <div className={MOBILE_MENU_ROW_CLASS}>
          {DESKTOP_SETTINGS_SECTIONS.map((section) => (
            <FamilyDrawerButton
              key={section}
              className="h-14 w-auto shrink-0"
              onClick={() => openSection(section)}
            >
              <SettingsSectionIconFor className="text-foreground" section={section} size={22} />
              <span>{section}</span>
            </FamilyDrawerButton>
          ))}
          {selectedLayer && controller?.onElementLayerPatch ? (
            <FamilyDrawerButton className="h-14 w-auto shrink-0" onClick={() => setView("element")}>
              <SettingsSectionIconFor className="text-foreground" section="Effects" size={22} />
              <span>Layer style</span>
            </FamilyDrawerButton>
          ) : null}
        </div>
      </ScrollArea>
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
        <DesktopElementInspector layer={layer} onPatch={onPatch} />
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
      <DesktopPexelsPhotoInspector
        onClose={() => {
          controller?.onCloseComposeSidebar?.()
          setView("elements")
        }}
        onSelectPhoto={(imageUrl) => controller?.onSelectStockPhoto?.(imageUrl)}
      />
    </div>
  )
}

function MobileSettingDetailView() {
  const model = useMobileInspectorModel()
  const navigation = useMobileDrawerNavigation()
  const payload = navigation?.detailPayload

  if (!payload) {
    return null
  }

  return (
    <div className="desktopnew-root w-full min-w-0" data-theme={model.actualDesktopTheme}>
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileNestedHeader title={payload.title} onClose={() => navigation?.closeDetail()} />
        <div className="dn-portal-surface w-full min-w-0">{payload.content}</div>
      </DesktopnewThemeContext.Provider>
    </div>
  )
}

const MOBILE_VIEWS: ViewsRegistry = {
  default: MobileMenuView,
  content: MobileContentSectionView,
  qr: MobileQrSectionView,
  motion: MobileMotionSectionView,
  shape: MobileShapeSectionView,
  background: MobileBackgroundSectionView,
  elements: MobileElementsSectionView,
  element: MobileElementView,
  "stock-photos": MobileStockPhotosView,
  "setting-detail": MobileSettingDetailView,
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

function MobileFamilyDrawerChrome({
  className,
  theme,
}: {
  className?: string
  theme: "light" | "dark"
}) {
  const { view } = useFamilyDrawer()
  const navigation = useMobileDrawerNavigation()
  const accessibilityTitle =
    view === "setting-detail" ? navigation?.detailPayload?.title : undefined

  return (
    <FamilyDrawerPortal>
      <FamilyDrawerContent
        accessibilityTitle={accessibilityTitle}
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
  )
}

function MobileFamilyDrawerShell({
  className,
  model,
}: {
  className?: string
  model: DesktopInspectorModel
}) {
  const { view, setView } = useFamilyDrawer()
  const theme = model.actualDesktopTheme

  return (
    <MobileDrawerNavigationProvider currentView={view} setView={setView}>
      <MobileDrawerViewRouter model={model} />
      <MobileFamilyDrawerChrome className={className} theme={theme} />
    </MobileDrawerNavigationProvider>
  )
}

export function MobileFamilyDrawer({
  className,
  model,
}: {
  className?: string
  model: DesktopInspectorModel
}) {
  return (
    <MobileInspectorContext.Provider value={model}>
      <MobileInspectorDensityContext.Provider value={true}>
        <FamilyDrawerRoot
          dismissible={false}
          defaultOpen
          modal={false}
          open
          views={MOBILE_VIEWS}
        >
          <MobileFamilyDrawerShell className={className} model={model} />
        </FamilyDrawerRoot>
      </MobileInspectorDensityContext.Provider>
    </MobileInspectorContext.Provider>
  )
}
