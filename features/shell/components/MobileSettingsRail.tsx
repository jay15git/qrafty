"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileLayerToolbar } from "@/features/shell/components/MobileLayerToolbar";
import {
  MobileSettingsDrawer,
  MOBILE_DRAWER_DETAIL_VIEW,
  MOBILE_DRAWER_SECTION_VIEW,
} from "@/features/shell/components/MobileSettingsDrawer";
import {
  clearMobileWorkspaceChromeInsets,
  syncMobileWorkspaceChromeInsets,
} from "@/features/shell/components/mobile-layer-toolbar-sync";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import { MobileDrawerNavigationProvider } from "@/features/shell/settings/MobileDrawerNavigationContext";
import { MobileSettingsDensityContext } from "@/features/shell/settings/MobileSettingsDensityContext";
import type { SettingsSectionId } from "@/features/shell/settings/settings-panel-meta";
import { ContentTypeGridIcon } from "@/features/qr/content/ContentTypeGridIcon";
import {
  PICKER_QR_INPUT_TYPES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr/content/input-options";

import {
  MobileDrawerStackReset,
  MobileRailActions,
  MobileRailFamilyFooter,
  MobileRailRowContent,
} from "./mobile-settings-rail/frame";
import {
  useMeasuredHeight,
  useMobileDrawerHeight,
  useMobileKeyboardInset,
} from "./mobile-settings-rail/rail-hooks";
import {
  MobileRailModeContext,
  MobileRailPartContext,
  useLatestModel,
  type MobileRailOption,
  type MobileRailRowProps,
} from "./mobile-settings-rail/rail-context";
import {
  captureFamilySnapshot,
  restoreFamilySnapshot,
  type MobileFamilySnapshot,
} from "./mobile-settings-rail/snapshots";
import { useRailViewState } from "./mobile-settings-rail/use-rail-view-state";
import {
  MobileBackgroundRailFooter,
  MobileBackgroundRailRow,
} from "./mobile-settings-rail/rows/background";
import { MobileColorRailFooter, MobileColorRailRow } from "./mobile-settings-rail/rows/color";
import { MobileMotionRailRow } from "./mobile-settings-rail/rows/motion";
import { MobileQrRailFooter, MobileQrRailRow } from "./mobile-settings-rail/rows/qr";
import { MobileShapeRailFooter, MobileShapeRailRow } from "./mobile-settings-rail/rows/shape";

import "@/features/shell/settings/settings.css";
import "@/features/shell/settings/mobile-settings.css";

const MOBILE_RAIL_BOTTOM_GAP_PX = 16;

const RAIL_OPTION_ICON_CLASS = "ds-mobile-settings-rail__icon";

/**
 * Options a family drills into. Families without an entry keep the rail on the
 * top-level list.
 */
const MOBILE_FAMILY_OPTIONS: Partial<Record<SettingsSectionId, MobileRailOption[]>> = {
  Content: PICKER_QR_INPUT_TYPES.map((type) => ({
    id: type,
    label: QR_INPUT_OPTIONS[type].label,
    icon: <ContentTypeGridIcon className={RAIL_OPTION_ICON_CLASS} type={type} />,
  })),
};

/**
 * Per-family quick rows rendered in place of the option list. Families without
 * an entry fall back to `MOBILE_FAMILY_OPTIONS` (Content, Style) or open the
 * drawer directly.
 */
const MOBILE_FAMILY_ROWS: Partial<Record<SettingsSectionId, ComponentType<MobileRailRowProps>>> = {
  QR: MobileQrRailRow,
  Color: MobileColorRailRow,
  Motion: MobileMotionRailRow,
  Shape: MobileShapeRailRow,
  Background: MobileBackgroundRailRow,
};

/**
 * Mode-pill row rendered under the scrollarea for families whose options are
 * grouped by fill mode. The pills read/write `MobileRailModeContext`.
 */
const MOBILE_FAMILY_FOOTERS: Partial<Record<SettingsSectionId, ComponentType<MobileRailRowProps>>> =
  {
    QR: MobileQrRailFooter,
    Color: MobileColorRailFooter,
    Shape: MobileShapeRailFooter,
    Background: MobileBackgroundRailFooter,
  };

export function MobileSettingsRail({ model }: { model: SettingsModel }) {
  const theme = model.actualTheme;
  const modelRef = useLatestModel(model);
  // Pre-edit state per section touched this session — X replays all of them,
  // ✓ drops the map. The drawer can wander sections on its own tab dock, so
  // the discard scope is "everything opened since the family opened".
  const snapshotsRef = useRef(new Map<SettingsSectionId, MobileFamilySnapshot>());
  const { height: railHeight, ref: railRef } = useMeasuredHeight<HTMLDivElement>();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [openFamily, setOpenFamily] = useState<SettingsSectionId | null>(null);
  const [drawerSection, setDrawerSection] = useState<SettingsSectionId | null>(null);
  const [drawerView, setDrawerView] = useState(MOBILE_DRAWER_SECTION_VIEW);
  const keyboardInset = useMobileKeyboardInset();

  const { fading, railModeContext, railPartContext, setOpenPart, viewFamily } = useRailViewState(
    openFamily,
    model,
    MOBILE_FAMILY_FOOTERS,
  );
  const options = viewFamily ? MOBILE_FAMILY_OPTIONS[viewFamily] : undefined;
  const FamilyRow = viewFamily ? MOBILE_FAMILY_ROWS[viewFamily] : undefined;
  const FamilyFooter = viewFamily ? MOBILE_FAMILY_FOOTERS[viewFamily] : undefined;
  const drilled = Boolean(options || FamilyRow);
  const drawerOpen = drawerSection !== null || drawerView === MOBILE_DRAWER_DETAIL_VIEW;

  const handleDrawerViewChange = useCallback((view: string) => {
    // The nav provider's empty-stack recovery asks for "default"; the section
    // view is the default inside this drawer.
    setDrawerView(view === "default" ? MOBILE_DRAWER_SECTION_VIEW : view);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerSection(null);
    setDrawerView(MOBILE_DRAWER_SECTION_VIEW);
  }, []);

  // First touch of a section captures its slices; later touches keep the
  // earliest snapshot so discard always returns to session start.
  const captureSection = useCallback(
    (section: SettingsSectionId) => {
      if (!snapshotsRef.current.has(section)) {
        snapshotsRef.current.set(section, captureFamilySnapshot(modelRef.current));
      }
    },
    [modelRef],
  );

  // Jumping sections always lands on the section view — a stale detail page
  // can't survive the switch. Each newly visited section joins the discard
  // snapshot set so the drawer's own section hops stay revertible.
  const openDrawerSection = useCallback(
    (section: SettingsSectionId) => {
      captureSection(section);
      setDrawerView(MOBILE_DRAWER_SECTION_VIEW);
      setDrawerSection(section);
    },
    [captureSection],
  );

  // Opening a family snapshots it so the corner cross can discard every
  // change made while it was open.
  const toggleFamily = useCallback(
    (section: SettingsSectionId) => {
      if (openFamily === section) {
        snapshotsRef.current.clear();
        setOpenFamily(null);
        return;
      }
      if (!snapshotsRef.current.has(section)) {
        snapshotsRef.current.set(section, captureFamilySnapshot(modelRef.current));
      }
      setOpenFamily(section);
    },
    [modelRef, openFamily],
  );

  // Discard: replay every section snapshot, then close drawer + family.
  const discardFamily = useCallback(() => {
    const snapshots = [...snapshotsRef.current.entries()];
    snapshotsRef.current.clear();
    for (const [section, snapshot] of snapshots) {
      restoreFamilySnapshot(section, snapshot, modelRef.current);
    }
    setOpenFamily(null);
  }, [modelRef]);

  // Save: edits already applied live — just close drawer + family.
  const saveFamily = useCallback(() => {
    snapshotsRef.current.clear();
    setOpenFamily(null);
  }, []);

  // Drawer corner buttons mirror the rail's: X discards the session, ✓ saves
  // it — both then close the drawer and the family behind it.
  const discardFromDrawer = useCallback(() => {
    discardFamily();
    closeDrawer();
  }, [closeDrawer, discardFamily]);

  const saveFromDrawer = useCallback(() => {
    saveFamily();
    closeDrawer();
  }, [closeDrawer, saveFamily]);

  const handleOptionClick = (option: MobileRailOption) => {
    if (option.drillsTo) {
      setOpenPart(option.drillsTo);
      return;
    }
    if (viewFamily === "Content") {
      model.onContentTypeChange(option.id as QrInputType);
    }
    openDrawerSection(viewFamily!);
  };

  const drawerHeight = useMobileDrawerHeight(drawerOpen);

  useEffect(() => {
    syncMobileWorkspaceChromeInsets({
      drawerHeight: Math.max(railHeight, drawerHeight),
      toolbarHeight,
      drawerBottomGapPx: MOBILE_RAIL_BOTTOM_GAP_PX,
      keyboardInsetPx: keyboardInset,
    });
  }, [drawerHeight, keyboardInset, railHeight, toolbarHeight]);

  useEffect(() => {
    return () => {
      clearMobileWorkspaceChromeInsets();
    };
  }, []);

  return (
    <SettingsThemeContext.Provider value={theme}>
      <MobileSettingsDensityContext.Provider value={true}>
        <MobileDrawerNavigationProvider currentView={drawerView} setView={handleDrawerViewChange}>
          <MobileRailModeContext.Provider value={railModeContext}>
            <MobileRailPartContext.Provider value={railPartContext}>
              <MobileDrawerStackReset open={drawerOpen} />
              <MobileLayerToolbar
                onToolbarHeightChange={setToolbarHeight}
                model={model}
                theme={theme}
              />
              <div
                ref={railRef}
                className="ds-root pointer-events-auto fixed z-[var(--z-mobile-rail)]"
                data-shell-theme={theme}
                data-mobile-settings=""
                data-slot="mobile-settings-rail-root"
                data-theme={theme}
              >
                {/* One atomic swap: the whole rail block (options + tabs +
                actions) fades out showing the old view, then the snapshot
                commits at opacity 0 and the new view fades in already laid
                out. Nothing re-renders mid-fade — no layout shifts, no live
                state leaking into the exiting frame. */}
                <div
                  className={
                    fading === "stage"
                      ? "ds-mobile-settings-rail__stage is-fading"
                      : "ds-mobile-settings-rail__stage"
                  }
                >
                  <ScrollArea
                    className="ds-mobile-settings-rail__scroll w-full min-w-0 max-w-full overflow-hidden"
                    chevron={false}
                    cueSize="tight"
                    orientation="horizontal"
                    persistKey={`mobile-settings-rail:${drilled ? `family:${viewFamily}` : "families"}`}
                    scrollFade
                    showScrollbar={false}
                    viewportClassName="min-w-0"
                  >
                    <div className="ds-mobile-settings-rail__swap">
                      <div
                        aria-label={drilled ? `${viewFamily} options` : "Settings sections"}
                        className={
                          fading === "row"
                            ? "ds-mobile-settings-rail__row is-fading"
                            : "ds-mobile-settings-rail__row"
                        }
                        role="group"
                      >
                        <MobileRailRowContent
                          FamilyRow={FamilyRow}
                          model={model}
                          options={options}
                          viewFamily={viewFamily}
                          onOpenDrawer={() => openDrawerSection(viewFamily!)}
                          onOpenSection={openDrawerSection}
                          onOptionClick={handleOptionClick}
                          onToggleFamily={toggleFamily}
                        />
                      </div>
                    </div>
                  </ScrollArea>
                  {drilled && FamilyFooter && viewFamily ? (
                    <MobileRailFamilyFooter
                      FamilyFooter={FamilyFooter}
                      model={model}
                      viewFamily={viewFamily}
                      onOpenDrawer={() => openDrawerSection(viewFamily)}
                    />
                  ) : null}
                  {drilled ? (
                    <MobileRailActions
                      viewFamily={viewFamily}
                      onDiscard={discardFamily}
                      onSave={saveFamily}
                    />
                  ) : null}
                </div>
              </div>
              <MobileSettingsDrawer
                model={model}
                view={drawerView}
                onClose={closeDrawer}
                onDiscard={discardFromDrawer}
                onSave={saveFromDrawer}
                section={drawerSection}
              />
            </MobileRailPartContext.Provider>
          </MobileRailModeContext.Provider>
        </MobileDrawerNavigationProvider>
      </MobileSettingsDensityContext.Provider>
    </SettingsThemeContext.Provider>
  );
}
