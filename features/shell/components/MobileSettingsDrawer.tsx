"use client";

import { Check, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import useMeasure, { type RectReadOnly } from "react-use-measure";
import { m } from "motion/react";
import { Drawer } from "vaul";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
        <X aria-hidden className="size-[1.125rem] shrink-0" strokeWidth={2.25} />
      </button>
      <h2 className="ds-mobile-drawer-nested-header__title">{title}</h2>
      <button
        aria-label="Save changes"
        className="ds-mobile-drawer-back"
        data-vaul-no-drag=""
        type="button"
        onClick={onSave}
      >
        <Check aria-hidden className="size-[1.125rem] shrink-0" strokeWidth={2.25} />
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
              <X aria-hidden className="size-[1.125rem] shrink-0" strokeWidth={2.25} />
            </button>
            <h2 className="ds-mobile-drawer-nested-header__title">{title}</h2>
            <button
              aria-label="Save changes"
              className="ds-mobile-drawer-back"
              data-vaul-no-drag=""
              type="button"
              onClick={onSave}
            >
              <Check aria-hidden className="size-[1.125rem] shrink-0" strokeWidth={2.25} />
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

// ---------------------------------------------------------------------------
// Drawer internals — the old shared `components/ui/family-drawer` module,
// inlined. This file is the only consumer and always drives it the same way:
// controlled open, non-modal, non-dismissible, repositionInputs off (vaul's
// keyboard lift conflicts with the card's own height animation).
// ---------------------------------------------------------------------------

type ViewComponent = ComponentType<Record<string, unknown>>;
type ViewsRegistry = Record<string, ViewComponent>;

interface FamilyDrawerContextValue {
  isOpen: boolean;
  view: string;
  setView: (view: string) => void;
  opacityDuration: number;
  elementRef: (element: HTMLElement | SVGElement | null) => void;
  bounds: RectReadOnly;
  /** True while no fresh measurement exists for this open — frame must size to `auto`. */
  measuringOpen: boolean;
  /** True on the render carrying the first post-open measurement — height snaps, never animates. */
  snapHeight: boolean;
  views: ViewsRegistry;
}

const FamilyDrawerContext = createContext<FamilyDrawerContextValue | undefined>(undefined);

function useFamilyDrawer() {
  const context = useContext(FamilyDrawerContext);
  if (!context) {
    throw new Error("FamilyDrawer components must be used within FamilyDrawerRoot");
  }
  return context;
}

const MIN_OPACITY_DURATION = 0.15;
const MAX_OPACITY_DURATION = 0.27;

function FamilyDrawerRoot({
  children,
  open,
  onOpenChange,
  views,
}: {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  views: ViewsRegistry;
}) {
  const [view, setView] = useState(MOBILE_DRAWER_SECTION_VIEW);
  const [elementRef, bounds, refreshBounds] = useMeasure();

  // Previous measured height and the opacity duration derived from it. Both
  // live in state so the duration is computed during render without reading a
  // ref (unsafe under concurrent React). Adjusting state during render — the
  // documented prev-prop pattern — keeps the duration identical to the old
  // ref-based computation: the render that observes a new height derives the
  // delta against the height it replaced, and the follow-up render (now
  // equal) leaves the duration alone.
  const [previousHeight, setPreviousHeight] = useState(0);
  const [opacityDuration, setOpacityDuration] = useState(MIN_OPACITY_DURATION);

  if (bounds.height !== previousHeight) {
    setPreviousHeight(bounds.height);
    setOpacityDuration(
      !previousHeight
        ? MIN_OPACITY_DURATION
        : Math.min(
            Math.max(Math.abs(bounds.height - previousHeight) / 500, MIN_OPACITY_DURATION),
            MAX_OPACITY_DURATION,
          ),
    );
  }

  // useMeasure keeps the last bounds across close/unmount, so on reopen the
  // frame first renders at a stale height and animates to the real one — the
  // "expands then settles" wobble. Until the first post-open measurement the
  // frame renders `auto` (no stale height), and that measurement snaps in
  // instantly instead of animating.
  const [boundsAtOpen, setBoundsAtOpen] = useState<RectReadOnly | null>(null);
  const measuringOpen = boundsAtOpen !== null && bounds === boundsAtOpen;
  const justMeasuredOpen = boundsAtOpen !== null && bounds !== boundsAtOpen;

  if (open && boundsAtOpen === null) {
    setBoundsAtOpen(bounds);
  }
  if (open && justMeasuredOpen) {
    setBoundsAtOpen(null);
  }
  if (!open && boundsAtOpen !== null) {
    setBoundsAtOpen(null);
  }

  // The portal mounts the measured wrapper in the same commit the drawer
  // opens; the observer can miss that first layout when the drawer opens
  // straight onto a detail view, leaving the frame stuck at a stale height.
  useLayoutEffect(() => {
    if (open) {
      refreshBounds();
    }
  }, [open, view, refreshBounds]);

  // An identical re-measurement dedupes inside useMeasure — no bounds update
  // arrives, so nothing else would end the measuring window. Re-arm on a
  // short timer (rAF never fires while the tab is hidden); stale and real
  // heights are equal in that case anyway.
  useEffect(() => {
    if (boundsAtOpen === null || bounds !== boundsAtOpen) {
      return;
    }
    const timer = window.setTimeout(() => setBoundsAtOpen(null), 50);
    return () => window.clearTimeout(timer);
  }, [boundsAtOpen, bounds]);

  const handleViewChange = useCallback(
    (newView: string) => {
      if (!(newView in views)) {
        return;
      }
      setView(newView);
    },
    [views],
  );

  const contextValue: FamilyDrawerContextValue = useMemo(
    () => ({
      isOpen: open,
      view,
      setView: handleViewChange,
      opacityDuration,
      elementRef,
      bounds,
      measuringOpen,
      snapHeight: justMeasuredOpen,
      views,
    }),
    [
      open,
      view,
      handleViewChange,
      opacityDuration,
      elementRef,
      bounds,
      measuringOpen,
      justMeasuredOpen,
      views,
    ],
  );

  return (
    <FamilyDrawerContext.Provider value={contextValue}>
      <Drawer.Root
        dismissible={false}
        modal={false}
        open={open}
        onOpenChange={onOpenChange}
        repositionInputs={false}
      >
        {children}
      </Drawer.Root>
    </FamilyDrawerContext.Provider>
  );
}

type FamilyDrawerContentProps = {
  children: ReactNode;
  className?: string;
  /** Screen-reader label for the drawer dialog. */
  accessibilityTitle?: string;
  /** Pixel cap for the animated frame; overflowing content uses this frame's native scroller. */
  maxHeight?: number;
} & Record<string, unknown>;

function FamilyDrawerContent({
  children,
  className,
  accessibilityTitle,
  maxHeight,
  ...rest
}: FamilyDrawerContentProps) {
  const { bounds, isOpen, measuringOpen, snapHeight, view } = useFamilyDrawer();
  const [lastPositiveHeight, setLastPositiveHeight] = useState(0);
  const isCapped = maxHeight !== undefined;

  // Remember the last non-zero measured height so a transient 0 (the frame
  // collapsing mid-transition) doesn't snap the card to nothing. Only tracked
  // while open — once the drawer starts its exit slide the height freezes, so
  // callers unmounting content on close can't shrink the card mid-slide.
  if (isOpen && bounds.height > 0 && bounds.height !== lastPositiveHeight) {
    setLastPositiveHeight(bounds.height);
  }

  const measuredHeight = isOpen
    ? bounds.height > 0
      ? bounds.height
      : lastPositiveHeight
    : lastPositiveHeight;
  const displayedHeight = isCapped ? Math.min(measuredHeight, maxHeight) : measuredHeight;

  return (
    <Drawer.Content
      className={cn(
        "fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-[var(--z-chrome)] overflow-hidden rounded-[36px] bg-background outline-none",
        className,
      )}
      {...rest}
    >
      <m.div
        // While measuringOpen the stored bounds belong to the previous open —
        // render `auto` instead of animating toward a stale height. snapHeight
        // lands the first real measurement instantly (duration 0). max-height
        // still applies during `auto` so tall content can't blow past the cap
        // while the measurement is pending.
        animate={{ height: measuringOpen || displayedHeight <= 0 ? "auto" : displayedHeight }}
        initial={false}
        style={{ maxHeight: isCapped ? maxHeight : undefined }}
        transition={{
          duration: snapHeight ? 0 : 0.27,
          ease: [0.25, 1, 0.5, 1],
        }}
        className="min-w-0 overflow-hidden"
      >
        <Drawer.Title className="sr-only">
          {accessibilityTitle ?? (view === MOBILE_DRAWER_DETAIL_VIEW ? "Setting" : "Settings")}
        </Drawer.Title>
        {isCapped ? (
          <ScrollArea
            chevron={false}
            // Own the cap too: while the frame is height:auto (measuringOpen),
            // h-full alone lets the area render at natural height and the frame
            // clips it with overflow-hidden — bottom rows unreachable.
            className="h-full min-w-0 overscroll-contain"
            cueSize="tight"
            persistKey={`family-drawer-frame:${view}`}
            style={{ maxHeight }}
            viewportClassName="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-h-[inherit]"
            data-vaul-no-drag=""
          >
            {children}
          </ScrollArea>
        ) : (
          children
        )}
      </m.div>
    </Drawer.Content>
  );
}

function FamilyDrawerAnimatedWrapper({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & Record<string, unknown>) {
  const { elementRef } = useFamilyDrawer();

  return (
    <div ref={elementRef} className={cn("px-6 pb-6 pt-2.5 antialiased", className)} {...rest}>
      {children}
    </div>
  );
}

function FamilyDrawerAnimatedContent() {
  const { view, opacityDuration, views } = useFamilyDrawer();
  // Visited views stay mounted so a pushed detail page keeps the section's
  // scroll and input state; only the active one is visible and interactive.
  const [visitedViews, setVisitedViews] = useState<string[]>(() => [view]);

  if (!visitedViews.includes(view)) {
    setVisitedViews((current) => (current.includes(view) ? current : [...current, view]));
  }

  return (
    <>
      {visitedViews.map((viewName) => {
        const isActive = viewName === view;
        const ViewComponent = views[viewName];

        return (
          <div
            key={viewName}
            aria-hidden={!isActive}
            className={cn(!isActive && "pointer-events-none hidden")}
            inert={isActive ? undefined : true}
          >
            <m.div
              animate={isActive ? { opacity: 1, scale: 1, y: 0 } : false}
              initial={false}
              transition={{
                duration: opacityDuration,
                ease: [0.26, 0.08, 0.25, 1],
              }}
            >
              {ViewComponent ? <ViewComponent /> : null}
            </m.div>
          </div>
        );
      })}
    </>
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
      open={open}
      views={views}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <Drawer.Portal>
        {/* Non-modal + non-dismissible: vaul won't close on outside taps, but
            nothing stops the hit itself — canvas taps would still select
            layers and rail buttons would fire under the open card. A
            transparent shield swallows the gesture; the settings rail fades
            itself via [data-drawer-open] instead of being dimmed here. */}
        <div
          aria-hidden
          className="ds-mobile-drawer-backdrop"
          onPointerDown={(event) => event.preventDefault()}
        />
        <FamilyDrawerContent
          accessibilityTitle={title}
          className="ds-root shadow-none"
          data-shell-theme={theme}
          data-mobile-settings=""
          data-slot="mobile-settings-drawer-root"
          data-theme={theme}
          maxHeight={maxHeight}
        >
          <FamilyDrawerAnimatedWrapper className="ds-mobile-drawer-body px-[var(--row-px)] pt-3">
            <MobileDrawerViewPropsContext.Provider value={viewProps}>
              <FamilyDrawerViewBridge view={renderView.current}>
                <FamilyDrawerAnimatedContent />
              </FamilyDrawerViewBridge>
            </MobileDrawerViewPropsContext.Provider>
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </Drawer.Portal>
    </FamilyDrawerRoot>
  );
}
