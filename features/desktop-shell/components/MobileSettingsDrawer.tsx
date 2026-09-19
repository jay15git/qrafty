"use client"

import { Check, X } from "lucide-react"
import { useCallback, useLayoutEffect, useMemo, useState } from "react"

import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerContent,
  FamilyDrawerPortal,
  FamilyDrawerRoot,
  type ViewsRegistry,
} from "@/components/ui/family-drawer"
import { getMobileDrawerMaxHeightPx } from "@/features/desktop-shell/components/mobile-family-drawer-viewport"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  DESKTOP_SETTINGS_SECTIONS,
  getDesktopSettingsSectionLabel,
  type DesktopSettingsSectionId,
} from "@/features/desktop-shell/inspector/desktopnew-settings-panel-meta"
import { SettingsSectionBody } from "@/features/desktop-shell/inspector/desktopnew-settings-sections"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { MobileInspectorDensityContext } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { MobileSettingsTabDockProvider } from "@/features/desktop-shell/inspector/mobile-settings-tab-dock"
import { getContentTypeLabel } from "@/features/qr-code/content/input-options"

import "@/features/desktop-shell/inspector/desktopnew.css"
import "@/features/desktop-shell/inspector/mobile-inspector.css"

const MOBILE_DRAWER_MAX_VIEWPORT_RATIO = 0.5
const MOBILE_DRAWER_VIEW = "section"

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
  onClose,
  onNext,
  title,
}: {
  onClose: () => void
  onNext: () => void
  title: string
}) {
  return (
    <header className="dn-mobile-drawer-nested-header">
      <button
        aria-label="Close settings"
        className="dn-mobile-drawer-back"
        data-vaul-no-drag=""
        type="button"
        onClick={onClose}
      >
        <X aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
      </button>
      <h2 className="dn-mobile-drawer-nested-header__title">{title}</h2>
      <button
        aria-label="Next settings section"
        className="dn-mobile-drawer-back"
        data-vaul-no-drag=""
        type="button"
        onClick={onNext}
      >
        <Check aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
      </button>
    </header>
  )
}

function MobileSettingsSectionView({
  model,
  onClose,
  onNext,
  section,
  title,
}: {
  model: DesktopInspectorModel
  onClose: () => void
  onNext: () => void
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
            <MobileDrawerHeader onClose={onClose} onNext={onNext} title={title} />
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
  onSectionChange,
  section,
}: {
  model: DesktopInspectorModel
  onClose: () => void
  onSectionChange: (section: DesktopSettingsSectionId) => void
  section: DesktopSettingsSectionId | null
}) {
  const theme = model.actualDesktopTheme
  const maxHeight = useMobileDrawerMaxHeight()
  const open = section !== null

  // Content is reached by picking a content type on the rail, so its heading
  // names the option ("Link", "Text", …) rather than the section.
  const title = section
    ? section === "Content"
      ? getContentTypeLabel(model.actualContentType)
      : getDesktopSettingsSectionLabel(section)
    : undefined

  const goToNextSection = useCallback(() => {
    if (!section) {
      return
    }
    const index = DESKTOP_SETTINGS_SECTIONS.indexOf(section)
    onSectionChange(DESKTOP_SETTINGS_SECTIONS[(index + 1) % DESKTOP_SETTINGS_SECTIONS.length])
  }, [onSectionChange, section])

  const sectionView = useCallback(() => {
    if (!section) {
      return null
    }
    return (
      <MobileSettingsSectionView
        model={model}
        onClose={onClose}
        onNext={goToNextSection}
        section={section}
        title={title ?? getDesktopSettingsSectionLabel(section)}
      />
    )
  }, [goToNextSection, model, onClose, section, title])

  const views = useMemo<ViewsRegistry>(
    () => ({ [MOBILE_DRAWER_VIEW]: sectionView }),
    [sectionView],
  )

  return (
    <FamilyDrawerRoot
      defaultView={MOBILE_DRAWER_VIEW}
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
            <FamilyDrawerAnimatedContent />
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  )
}
