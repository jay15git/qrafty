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
import { DesktopWallpaperInspector } from "@/features/desktop-shell/components/DesktopWallpaperInspector"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import {
  DESKTOP_SETTINGS_SECTIONS,
  MOBILE_DRAWER_VIEW_FOR_SECTION,
  SECTION_TO_TOOL,
  getDesktopSettingsSectionLabel,
  type DesktopSettingsSectionId,
} from "@/features/desktop-shell/inspector/desktopnew-settings-panel-meta"
import { SettingsSectionBody } from "@/features/desktop-shell/inspector/desktopnew-settings-sections"
import {
  MobileInspectorDensityContext,
} from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import {
  MobileDetailStackOutlets,
  MobileDrawerNavigationProvider,
  useMobileDrawerNavigation,
} from "@/features/desktop-shell/inspector/mobile-drawer-navigation-context"
import { MobileLayerToolbar } from "@/features/desktop-shell/components/MobileLayerToolbar"
import {
  clearMobileWorkspaceChromeInsets,
  syncMobileWorkspaceChromeInsets,
} from "@/features/desktop-shell/components/mobile-layer-toolbar-sync"
import {
  getMobileDrawerMaxHeightPx,
  getMobileKeyboardInsetPx,
} from "@/features/desktop-shell/components/mobile-family-drawer-viewport"
import { SettingsSectionIconFor } from "@/features/desktop-shell/inspector/settings-section-icons"
import { previewDrawerResize } from "@/features/workspace/preview/preview-drawer-resize"
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

function useMobileDrawerViewport() {
  const [maxHeight, setMaxHeight] = useState<number>()
  const [keyboardInset, setKeyboardInset] = useState(0)

  useLayoutEffect(() => {
    let remeasureTimer = 0

    const update = () => {
      const visualViewport = window.visualViewport
      setMaxHeight(
        getMobileDrawerMaxHeightPx(
          window.innerHeight,
          visualViewport,
          MOBILE_DRAWER_MAX_VIEWPORT_RATIO,
        ),
      )
      setKeyboardInset(getMobileKeyboardInsetPx(window.innerHeight, visualViewport))
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

  return { keyboardInset, maxHeight }
}

function MobileDrawerHeightSync({
  maxHeight,
  onHeightChange,
}: {
  maxHeight?: number
  onHeightChange: (height: number) => void
}) {
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

    onHeightChange(nextHeight)
  }, [bounds.height, maxHeight, onHeightChange])

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
            <span className="dn-mobile-drawer-menu-tile__label">
              {getDesktopSettingsSectionLabel(section)}
            </span>
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

function MobileWallpapersView() {
  const model = useMobileInspectorModel()
  const { setView } = useFamilyDrawer()
  const controller = model.controller

  return (
    <div className="flex min-h-0 flex-col">
      <MobileNestedHeader
        title="Wallpapers"
        onClose={() => {
          controller?.onCloseComposeSidebar?.()
          setView("elements")
        }}
      />
      <ScrollPersistScope id="drawer:wallpapers">
        <DesktopWallpaperInspector
          onClose={() => {
            controller?.onCloseComposeSidebar?.()
            setView("elements")
          }}
          onSelectWallpaper={(imagePath) => controller?.onSelectWallpaper?.(imagePath)}
        />
      </ScrollPersistScope>
    </div>
  )
}

function MobileSettingDetailView() {
  const model = useMobileInspectorModel()
  const navigation = useMobileDrawerNavigation()
  const payload = navigation?.detailPayload
  const title = payload?.title ?? "Settings"

  return (
    <div
      className="desktopnew-root w-full min-h-[4.5rem] min-w-0"
      data-mobile-inspector=""
      data-theme={model.actualDesktopTheme}
    >
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileNestedHeader title={title} onClose={() => navigation?.closeDetail()} />
        {payload ? (
          <ScrollPersistScope id="drawer:setting-detail">
            <div className="dn-portal-surface w-full min-w-0" data-mobile-inspector="">
              <MobileDetailStackOutlets />
            </div>
          </ScrollPersistScope>
        ) : (
          <div
            aria-hidden
            className="min-h-[2rem]"
            data-slot="mobile-setting-detail-placeholder"
          />
        )}
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
  "wallpapers": MobileWallpapersView,
  "setting-detail": MobileSettingDetailView,
}

function MobileDrawerViewRouter({ model }: { model: DesktopInspectorModel }) {
  const { setView } = useFamilyDrawer()
  const composePanel = model.controller?.composeSidebarPanel

  useEffect(() => {
    if (composePanel === "wallpapers") {
      setView("wallpapers")
    }
  }, [composePanel, setView])

  return null
}

function MobileFamilyDrawerChrome({
  className,
  maxHeight,
  onDrawerHeightChange,
  theme,
}: {
  className?: string
  maxHeight?: number
  onDrawerHeightChange: (height: number) => void
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
          "desktopnew-root shadow-none",
          className,
        )}
        data-desktop-theme={theme}
        data-mobile-inspector=""
        data-slot="mobile-family-drawer-root"
        data-theme={theme}
        maxHeight={maxHeight}
        style={{
          bottom:
            "max(1rem, env(safe-area-inset-bottom, 0px), var(--mobile-drawer-keyboard-inset, 0px))",
        }}
        variant="card"
      >
        <MobileDrawerHeightSync maxHeight={maxHeight} onHeightChange={onDrawerHeightChange} />
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
  const { keyboardInset, maxHeight } = useMobileDrawerViewport()
  const [drawerHeight, setDrawerHeight] = useState(0)
  const [toolbarHeight, setToolbarHeight] = useState(0)

  useEffect(() => {
    syncMobileWorkspaceChromeInsets({
      drawerHeight,
      toolbarHeight,
      drawerBottomGapPx: MOBILE_DRAWER_BOTTOM_GAP_PX,
      keyboardInsetPx: keyboardInset,
    })
  }, [drawerHeight, keyboardInset, toolbarHeight])

  useEffect(() => {
    return () => {
      clearMobileWorkspaceChromeInsets()
    }
  }, [])

  return (
    <MobileDrawerNavigationProvider currentView={view} setView={setView}>
      <MobileDrawerViewRouter model={model} />
      <MobileLayerToolbar
        onToolbarHeightChange={setToolbarHeight}
        model={model}
        theme={theme}
      />
      <MobileFamilyDrawerChrome
        className={className}
        maxHeight={maxHeight}
        onDrawerHeightChange={setDrawerHeight}
        theme={theme}
      />
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
          repositionInputs={false}
          views={MOBILE_VIEWS}
        >
          <MobileFamilyDrawerShell className={className} model={model} />
        </FamilyDrawerRoot>
      </MobileInspectorDensityContext.Provider>
    </MobileInspectorContext.Provider>
  )
}
