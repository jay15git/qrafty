"use client";

import { Check, X } from "lucide-react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerContent,
  FamilyDrawerPortal,
  FamilyDrawerRoot,
  useFamilyDrawer,
  type ViewsRegistry,
} from "@/components/ui/family-drawer";
import { getMobileDrawerMaxHeightPx } from "@/features/shell/components/mobile-family-drawer-viewport";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import {
  getSettingsSectionLabel,
  type SettingsSectionId,
} from "@/features/shell/settings/settings-panel-meta";
import {
  MobileDetailStackOutlets,
  useMobileDrawerNavigation,
} from "@/features/shell/settings/MobileDrawerNavigationContext";
import { SettingsSectionBody } from "@/features/shell/settings/SettingsSections";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import { MobileSettingsDensityContext } from "@/features/shell/settings/MobileSettingsDensityContext";
import { MobileSettingsTabDockProvider } from "@/features/shell/settings/MobileSettingsTabDock";
import { getContentTypeLabel } from "@/features/qr/content/input-options";

import "@/features/shell/settings/settings.css";
import "@/features/shell/settings/mobile-settings.css";

const MOBILE_DRAWER_MAX_VIEWPORT_RATIO = 0.5;
export const MOBILE_DRAWER_SECTION_VIEW = "section";
export const MOBILE_DRAWER_DETAIL_VIEW = "setting-detail";

type MobileDrawerViewProps = {
  model: SettingsModel;
  onDiscard: () => void;
  onSave: () => void;
  section: SettingsSectionId | null;
  title: string | undefined;
};

const MobileDrawerViewPropsContext = createContext<MobileDrawerViewProps | null>(null);

/** Below ~0.5px deltas nothing repaints anyway; viewport jitter must not churn the frame. */
const DRAWER_MAX_HEIGHT_EPSILON_PX = 1;

function useMobileDrawerMaxHeight() {
  // Lazy-initialized: the first painted frame must already be capped, or
  // FamilyDrawerContent flips isCapped after mount and remounts the whole
  // scroll frame + view subtree (visible jump, scroll/animator state loss).
  const [maxHeight, setMaxHeight] = useState<number | undefined>(() =>
    typeof window === "undefined"
      ? undefined
      : getMobileDrawerMaxHeightPx(
          window.innerHeight,
          window.visualViewport,
          MOBILE_DRAWER_MAX_VIEWPORT_RATIO,
        ),
  );

  useLayoutEffect(() => {
    const update = () => {
      const next = getMobileDrawerMaxHeightPx(
        window.innerHeight,
        window.visualViewport,
        MOBILE_DRAWER_MAX_VIEWPORT_RATIO,
      );
      setMaxHeight((current) =>
        current !== undefined && Math.abs(next - current) < DRAWER_MAX_HEIGHT_EPSILON_PX
          ? current
          : next,
      );
    };

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  return maxHeight;
}

function MobileDrawerHeader({
  onDiscard,
  onSave,
  title,
}: {
  onDiscard: () => void;
  onSave: () => void;
  title: string;
}) {
  return (
    <header className="ds-mobile-drawer-nested-header">
      <button
        aria-label="Discard changes"
        className="ds-mobile-drawer-back"
        data-vaul-no-drag=""
        type="button"
        onClick={onDiscard}
      >
        <X aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
      </button>
      <h2 className="ds-mobile-drawer-nested-header__title">{title}</h2>
      <button
        aria-label="Save changes"
        className="ds-mobile-drawer-back"
        data-vaul-no-drag=""
        type="button"
        onClick={onSave}
      >
        <Check aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
      </button>
    </header>
  );
}

/**
 * Pushes the view the rail-level navigation provider asks for into the drawer's
 * internal view state (owned by `FamilyDrawerRoot`, which has no controlled
 * `view` prop). One-way only — nothing inside the drawer sets the view itself,
 * and reporting inner→outer caused a mount/commit flap loop.
 */
function FamilyDrawerViewBridge({ children, view }: { children: ReactNode; view: string }) {
  const { setView, view: innerView } = useFamilyDrawer();

  // Layout effect, not useEffect: the bridge remounts with the portal on each
  // open, and the inner view survives closed on the root — a stale view must
  // be corrected before the first paint or the old view flashes one frame.
  useLayoutEffect(() => {
    if (innerView !== view) {
      setView(view);
    }
  }, [innerView, setView, view]);

  return <>{children}</>;
}

/** Detail page pushed on top of a section — pickers, insert menus, layer tools. */
function MobileSettingDetailView({ model, onSave }: { model: SettingsModel; onSave: () => void }) {
  const navigation = useMobileDrawerNavigation();
  const theme = model.actualTheme;
  const title = navigation?.detailPayload?.title ?? "Setting";

  return (
    <div className="ds-root w-full min-w-0" data-mobile-settings="" data-theme={theme}>
      <SettingsThemeContext.Provider value={theme}>
        <MobileSettingsDensityContext.Provider value={true}>
          <header className="ds-mobile-drawer-nested-header">
            <button
              aria-label="Back"
              className="ds-mobile-drawer-back"
              data-vaul-no-drag=""
              type="button"
              onClick={() => navigation?.closeDetail()}
            >
              <X aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
            </button>
            <h2 className="ds-mobile-drawer-nested-header__title">{title}</h2>
            <button
              aria-label="Save changes"
              className="ds-mobile-drawer-back"
              data-vaul-no-drag=""
              type="button"
              onClick={onSave}
            >
              <Check aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
            </button>
          </header>
          <MobileDetailStackOutlets />
        </MobileSettingsDensityContext.Provider>
      </SettingsThemeContext.Provider>
    </div>
  );
}

function MobileSettingsSectionView({
  model,
  onDiscard,
  onSave,
  section,
  title,
}: {
  model: SettingsModel;
  onDiscard: () => void;
  onSave: () => void;
  section: SettingsSectionId;
  title: string;
}) {
  return (
    <div className="ds-root w-full min-w-0" data-mobile-settings="" data-theme={model.actualTheme}>
      <SettingsThemeContext.Provider value={model.actualTheme}>
        <MobileSettingsDensityContext.Provider value={true}>
          <MobileSettingsTabDockProvider active>
            <MobileDrawerHeader onDiscard={onDiscard} onSave={onSave} title={title} />
            <SettingsSectionBody hideContentTypeBrowser id={section} model={model} />
          </MobileSettingsTabDockProvider>
        </MobileSettingsDensityContext.Provider>
      </SettingsThemeContext.Provider>
    </div>
  );
}

export function MobileSettingsDrawer({
  model,
  onClose,
  onDiscard,
  onSave,
  section,
  view,
}: {
  model: SettingsModel;
  onClose: () => void;
  /** X in the header — replays the session snapshots, then closes. */
  onDiscard: () => void;
  /** ✓ in the header — keeps the live-applied edits, then closes. */
  onSave: () => void;
  section: SettingsSectionId | null;
  /** `"section"` or `"setting-detail"` — the rail-level nav provider drives it. */
  view: string;
}) {
  const theme = model.actualTheme;
  const maxHeight = useMobileDrawerMaxHeight();
  const open = section !== null || view === MOBILE_DRAWER_DETAIL_VIEW;

  // Retain the last rendered section/view for the exit: `section`→null and
  // `view`→"section" commit in the same tick as open→false, but the portal
  // stays mounted through vaul's close transition. Rendering null or swapping
  // views there collapses the measured height mid-slide — a visible squash.
  const renderSection = useRef<SettingsSectionId | null>(section);
  const renderView = useRef(view);
  if (open) {
    renderSection.current = section;
    renderView.current = view;
  }

  // Content is reached by picking a content type on the rail, so its heading
  // names the option ("Link", "Text", …) rather than the section.
  const title = renderSection.current
    ? renderSection.current === "Content"
      ? getContentTypeLabel(model.actualContentType)
      : getSettingsSectionLabel(renderSection.current)
    : undefined;

  // `views` entries are rendered as component types — if they change identity
  // on every render (e.g. model updates per keystroke/color-drag tick),
  // FamilyDrawerViewContent remounts the whole view and inputs lose focus.
  // Keep the registry components stable and feed them the latest props through
  // context, which propagates across renders without remounting.
  const views = useMemo<ViewsRegistry>(
    () => ({
      [MOBILE_DRAWER_SECTION_VIEW]: function MobileDrawerSectionView() {
        const p = useContext(MobileDrawerViewPropsContext);
        if (!p?.section) {
          return null;
        }
        return (
          <MobileSettingsSectionView
            model={p.model}
            onDiscard={p.onDiscard}
            onSave={p.onSave}
            section={p.section}
            title={p.title ?? getSettingsSectionLabel(p.section)}
          />
        );
      },
      [MOBILE_DRAWER_DETAIL_VIEW]: function MobileDrawerDetailView() {
        const p = useContext(MobileDrawerViewPropsContext);
        if (!p) {
          return null;
        }
        return <MobileSettingDetailView model={p.model} onSave={p.onSave} />;
      },
    }),
    [],
  );

  const viewProps = useMemo(
    () => ({ model, onDiscard, onSave, section: renderSection.current, title }),
    [model, onDiscard, onSave, title],
  );

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
          onClose();
        }
      }}
    >
      <FamilyDrawerPortal>
        <FamilyDrawerContent
          accessibilityTitle={title}
          className="ds-root shadow-none"
          data-shell-theme={theme}
          data-mobile-settings=""
          data-slot="mobile-settings-drawer-root"
          data-theme={theme}
          maxHeight={maxHeight}
          variant="card"
        >
          <FamilyDrawerAnimatedWrapper className="ds-mobile-drawer-body px-[var(--row-px)] pt-3">
            <MobileDrawerViewPropsContext.Provider value={viewProps}>
              <FamilyDrawerViewBridge view={renderView.current}>
                <FamilyDrawerAnimatedContent />
              </FamilyDrawerViewBridge>
            </MobileDrawerViewPropsContext.Provider>
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  );
}
