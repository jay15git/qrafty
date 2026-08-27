"use client"

import { ChevronLeft } from "lucide-react"
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerButton,
  FamilyDrawerContent,
  FamilyDrawerPortal,
  FamilyDrawerRoot,
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
import { previewDrawerResize } from "@/features/workspace/preview/preview-drawer-resize"
import { SettingsSectionIconFor } from "@/features/desktop-shell/inspector/settings-section-icons"
import { ScrollPersistScope } from "@/lib/persisted-element-scroll"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"
import "@/features/desktop-shell/inspector/mobile-inspector.css"

const MOBILE_DRAWER_BOTTOM_GAP_PX = 16
const MOBILE_DRAWER_MAX_VIEWPORT_RATIO = 0.5

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

function useMobileDrawerMaxHeight() {
  const [maxHeight, setMaxHeight] = useState<number>()

  useLayoutEffect(() => {
    const updateMaxHeight = () => {
      setMaxHeight((window.visualViewport?.height ?? window.innerHeight) * MOBILE_DRAWER_MAX_VIEWPORT_RATIO)
    }

    updateMaxHeight()
    window.addEventListener("resize", updateMaxHeight)
    window.visualViewport?.addEventListener("resize", updateMaxHeight)

    return () => {
      window.removeEventListener("resize", updateMaxHeight)
      window.visualViewport?.removeEventListener("resize", updateMaxHeight)
    }
  }, [])

  return maxHeight
}

function MobileDrawerHeightSync({ maxHeight }: { maxHeight?: number }) {
  const { bounds } = useFamilyDrawer()
  const lastSyncedHeightRef = useRef(0)

  useEffect(() => {
    const nextHeight =
      maxHeight === undefined ? bounds.height : Math.min(bounds.height, maxHeight)
    if (nextHeight <= 0) {
      return
    }

    if (nextHeight !== lastSyncedHeightRef.current) {
      previewDrawerResize.beginResize()
      lastSyncedHeightRef.current = nextHeight
    }

    syncMobileDrawerHeight(nextHeight)
  }, [bounds.height, maxHeight])

  useEffect(() => {
    return () => {
      syncMobileDrawerHeight(0)
    }
  }, [])

  return null
}

function MobileDrawerBackIcon() {
  return <ChevronLeft aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
}

function MobileNestedHeader({
  title,
  onClose,
}: {
  title: string
  onClose: () => void
}) {
  return (
    <header className="dn-mobile-drawer-nested-header">
      <button
        aria-label="Back"
        className="dn-mobile-drawer-back"
        data-vaul-no-drag=""
        type="button"
        onClick={onClose}
      >
        <MobileDrawerBackIcon />
      </button>
      <h2 className="dn-mobile-drawer-nested-header__title">{title}</h2>
      <span aria-hidden className="dn-mobile-drawer-back-spacer" />
    </header>
  )
}

function MobileSectionView({ section }: { section: DesktopSettingsSectionId }) {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()

  return (
    <div className="desktopnew-root w-full min-w-0" data-mobile-inspector="" data-theme={model.actualDesktopTheme}>
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

const MOBILE_MENU_ROW_CLASS = "flex min-w-max gap-1.5 px-1 py-0.5"

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
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      persistKey="mobile-drawer-menu"
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div className={MOBILE_MENU_ROW_CLASS}>
        {DESKTOP_SETTINGS_SECTIONS.map((section) => (
          <FamilyDrawerButton
            key={section}
            className="dn-mobile-drawer-menu-tile shrink-0"
            onClick={() => openSection(section)}
          >
            <SettingsSectionIconFor className="text-foreground" section={section} size={22} />
            <span className="dn-mobile-drawer-menu-tile__label">{section}</span>
          </FamilyDrawerButton>
        ))}
        {selectedLayer && controller?.onElementLayerPatch ? (
          <FamilyDrawerButton
            className="dn-mobile-drawer-menu-tile shrink-0"
            onClick={() => setView("element")}
          >
            <SettingsSectionIconFor className="text-foreground" section="Effects" size={22} />
            <span className="dn-mobile-drawer-menu-tile__label">Layer style</span>
          </FamilyDrawerButton>
        ) : null}
      </div>
    </ScrollArea>
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
    <div className="desktopnew-root w-full min-w-0" data-mobile-inspector="" data-theme={model.actualDesktopTheme}>
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileNestedHeader title="Layer style" onClose={() => setView("default")} />
        <ScrollPersistScope id="drawer:element">
          <DesktopElementInspector layer={layer} onPatch={onPatch} />
        </ScrollPersistScope>
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
      <ScrollPersistScope id="drawer:stock-photos">
        <DesktopPexelsPhotoInspector
          onClose={() => {
            controller?.onCloseComposeSidebar?.()
            setView("elements")
          }}
          onSelectPhoto={(imageUrl) => controller?.onSelectStockPhoto?.(imageUrl)}
        />
      </ScrollPersistScope>
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
    <div className="desktopnew-root w-full min-w-0" data-mobile-inspector="" data-theme={model.actualDesktopTheme}>
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileNestedHeader title={payload.title} onClose={() => navigation?.closeDetail()} />
        <ScrollPersistScope id="drawer:setting-detail">
          <div className="dn-portal-surface w-full min-w-0" data-mobile-inspector="">
            {payload.content}
          </div>
        </ScrollPersistScope>
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
  const maxHeight = useMobileDrawerMaxHeight()
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
        data-mobile-inspector=""
        data-slot="mobile-family-drawer-root"
        data-theme={theme}
        maxHeight={maxHeight}
        variant="card"
      >
        <MobileDrawerHeightSync maxHeight={maxHeight} />
        <FamilyDrawerAnimatedWrapper className="dn-mobile-drawer-body px-5 pt-4">
          <FamilyDrawerAnimatedContent />
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
