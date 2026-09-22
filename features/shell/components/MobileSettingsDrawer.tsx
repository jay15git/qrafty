"use client"

import { Check, ChevronLeft, X } from "lucide-react"
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerContent,
  FamilyDrawerPortal,
  FamilyDrawerRoot,
  useFamilyDrawer,
  type ViewsRegistry,
} from "@/components/ui/family-drawer"
import { getMobileDrawerMaxHeightPx } from "@/features/shell/components/mobile-family-drawer-viewport"
import type { DesktopInspectorModel } from "@/features/shell/hooks/useDesktopToolbarInspectorModel"
import {
  getDesktopSettingsSectionLabel,
  type DesktopSettingsSectionId,
} from "@/features/shell/inspector/settings-panel-meta"
import {
  MobileDetailStackOutlets,
  useMobileDrawerNavigation,
} from "@/features/shell/inspector/mobile-drawer-navigation-context"
import { SettingsSectionBody } from "@/features/shell/inspector/settings-sections"
import { DesktopnewThemeContext } from "@/features/shell/inspector/theme-context"
import { MobileInspectorDensityContext } from "@/features/shell/inspector/mobile-inspector-density-context"
import { MobileSettingsTabDockProvider } from "@/features/shell/inspector/mobile-settings-tab-dock"
import { getContentTypeLabel } from "@/features/qr/content/input-options"

import "@/features/shell/inspector/inspector.css"
import "@/features/shell/inspector/mobile-inspector.css"

const MOBILE_DRAWER_MAX_VIEWPORT_RATIO = 0.5
export const MOBILE_DRAWER_SECTION_VIEW = "section"
export const MOBILE_DRAWER_DETAIL_VIEW = "setting-detail"

type MobileDrawerViewProps = {
  model: DesktopInspectorModel
  onDiscard: () => void
  onSave: () => void
  section: DesktopSettingsSectionId | null
  title: string | undefined
}

const MobileDrawerViewPropsContext = createContext<MobileDrawerViewProps | null>(
  null,
)

function useMobileDrawerMaxHeight() {
  const [maxHeight, setMaxHeight] = useState<number>()

  useLayoutEffect(() => {
    const update = () => {
      setMaxHeight(
        getMobileDrawerMaxHeightPx(
          window.innerHeight,
          window.visualViewport,
          MOBILE_DRAWER_MAX_VIEWPORT_RATIO,
        ),
      )
    }

    update()
    window.addEventListener("resize", update)
    window.visualViewport?.addEventListener("resize", update)
    window.visualViewport?.addEventListener("scroll", update)

    return () => {
      window.removeEventListener("resize", update)
      window.visualViewport?.removeEventListener("resize", update)
      window.visualViewport?.removeEventListener("scroll", update)
    }
  }, [])

  return maxHeight
}

function MobileDrawerHeader({
  onDiscard,
  onSave,
  title,
}: {
  onDiscard: () => void
  onSave: () => void
  title: string
}) {
  return (
    <header className="dn-mobile-drawer-nested-header">
      <button
        aria-label="Discard changes"
        className="dn-mobile-drawer-back"
        data-vaul-no-drag=""
        type="button"
        onClick={onDiscard}
      >
        <X aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
      </button>
      <h2 className="dn-mobile-drawer-nested-header__title">{title}</h2>
      <button
        aria-label="Save changes"
        className="dn-mobile-drawer-back"
        data-vaul-no-drag=""
        type="button"
        onClick={onSave}
      >
        <Check aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
      </button>
    </header>
  )
}

/**
 * Pushes the view the rail-level navigation provider asks for into the drawer's
 * internal view state (owned by `FamilyDrawerRoot`, which has no controlled
 * `view` prop). One-way only — nothing inside the drawer sets the view itself,
 * and reporting inner→outer caused a mount/commit flap loop.
 */
function FamilyDrawerViewBridge({ children, view }: { children: ReactNode; view: string }) {
  const { setView, view: innerView } = useFamilyDrawer()

  useEffect(() => {
    if (innerView !== view) {
      setView(view)
    }
  }, [innerView, setView, view])

  return <>{children}</>
}

/** Detail page pushed on top of a section — pickers, insert menus, layer tools. */
function MobileSettingDetailView({
  model,
  onDiscard,
}: {
  model: DesktopInspectorModel
  onDiscard: () => void
}) {
  const navigation = useMobileDrawerNavigation()
  const theme = model.actualDesktopTheme
  const title = navigation?.detailPayload?.title ?? "Setting"

  return (
    <div
      className="desktopnew-root w-full min-w-0"
      data-mobile-inspector=""
      data-theme={theme}
    >
      <DesktopnewThemeContext.Provider value={theme}>
        <MobileInspectorDensityContext.Provider value={true}>
          <header className="dn-mobile-drawer-nested-header">
            <button
              aria-label="Back"
              className="dn-mobile-drawer-back"
              data-vaul-no-drag=""
              type="button"
              onClick={() => navigation?.closeDetail()}
            >
              <ChevronLeft aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
            </button>
            <h2 className="dn-mobile-drawer-nested-header__title">{title}</h2>
            <button
              aria-label="Discard changes"
              className="dn-mobile-drawer-back"
              data-vaul-no-drag=""
              type="button"
              onClick={onDiscard}
            >
              <X aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
            </button>
          </header>
          <MobileDetailStackOutlets />
        </MobileInspectorDensityContext.Provider>
      </DesktopnewThemeContext.Provider>
    </div>
  )
}

function MobileSettingsSectionView({
  model,
  onDiscard,
  onSave,
  section,
  title,
}: {
  model: DesktopInspectorModel
  onDiscard: () => void
  onSave: () => void
  section: DesktopSettingsSectionId
  title: string
}) {
  return (
    <div
      className="desktopnew-root w-full min-w-0"
      data-mobile-inspector=""
      data-theme={model.actualDesktopTheme}
    >
      <DesktopnewThemeContext.Provider value={model.actualDesktopTheme}>
        <MobileInspectorDensityContext.Provider value={true}>
          <MobileSettingsTabDockProvider active>
            <MobileDrawerHeader onDiscard={onDiscard} onSave={onSave} title={title} />
            <SettingsSectionBody hideContentTypeBrowser id={section} model={model} />
          </MobileSettingsTabDockProvider>
        </MobileInspectorDensityContext.Provider>
      </DesktopnewThemeContext.Provider>
    </div>
  )
}

export function MobileSettingsDrawer({
  model,
  onClose,
  onDiscard,
  onSave,
  section,
  view,
}: {
  model: DesktopInspectorModel
  onClose: () => void
  /** X in the header — replays the session snapshots, then closes. */
  onDiscard: () => void
  /** ✓ in the header — keeps the live-applied edits, then closes. */
  onSave: () => void
  section: DesktopSettingsSectionId | null
  /** `"section"` or `"setting-detail"` — the rail-level nav provider drives it. */
  view: string
}) {
  const theme = model.actualDesktopTheme
  const maxHeight = useMobileDrawerMaxHeight()
  const open = section !== null || view === MOBILE_DRAWER_DETAIL_VIEW

  // Content is reached by picking a content type on the rail, so its heading
  // names the option ("Link", "Text", …) rather than the section.
  const title = section
    ? section === "Content"
      ? getContentTypeLabel(model.actualContentType)
      : getDesktopSettingsSectionLabel(section)
    : undefined

  // `views` entries are rendered as component types — if they change identity
  // on every render (e.g. model updates per keystroke/color-drag tick),
  // FamilyDrawerViewContent remounts the whole view and inputs lose focus.
  // Keep the registry components stable and feed them the latest props through
  // context, which propagates across renders without remounting.
  const views = useMemo<ViewsRegistry>(
    () => ({
      [MOBILE_DRAWER_SECTION_VIEW]: function MobileDrawerSectionView() {
        const p = useContext(MobileDrawerViewPropsContext)
        if (!p?.section) {
          return null
        }
        return (
          <MobileSettingsSectionView
            model={p.model}
            onDiscard={p.onDiscard}
            onSave={p.onSave}
            section={p.section}
            title={p.title ?? getDesktopSettingsSectionLabel(p.section)}
          />
        )
      },
      [MOBILE_DRAWER_DETAIL_VIEW]: function MobileDrawerDetailView() {
        const p = useContext(MobileDrawerViewPropsContext)
        if (!p) {
          return null
        }
        return <MobileSettingDetailView model={p.model} onDiscard={p.onDiscard} />
      },
    }),
    [],
  )

  const viewProps = useMemo(
    () => ({ model, onDiscard, onSave, section, title }),
    [model, onDiscard, onSave, section, title],
  )

  return (
    <FamilyDrawerRoot
      defaultView={MOBILE_DRAWER_SECTION_VIEW}
      dismissible={false}
      modal={false}
      open={open}
      repositionInputs={false}
      views={views}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
        }
      }}
    >
      <FamilyDrawerPortal>
        <FamilyDrawerContent
          accessibilityTitle={title}
          className="desktopnew-root shadow-none"
          data-desktop-theme={theme}
          data-mobile-inspector=""
          data-slot="mobile-family-drawer-root"
          data-theme={theme}
          maxHeight={maxHeight}
          variant="card"
        >
          <FamilyDrawerAnimatedWrapper className="dn-mobile-drawer-body px-5 pt-4">
            <MobileDrawerViewPropsContext.Provider value={viewProps}>
              <FamilyDrawerViewBridge view={view}>
                <FamilyDrawerAnimatedContent />
              </FamilyDrawerViewBridge>
            </MobileDrawerViewPropsContext.Provider>
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  )
}
