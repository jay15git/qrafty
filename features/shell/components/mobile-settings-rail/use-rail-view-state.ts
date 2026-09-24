import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";

import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import type { SettingsSectionId } from "@/features/shell/inspector/settings-panel-meta";
import type { QrStylePartId } from "@/features/shell/inspector/qr-style-parts";

import type { MobileRailRowProps } from "./rail-context";
import { defaultFamilyMode } from "./rail-modes";

/**
 * Two-phase stage swap: everything the rail renders — options, mode tabs,
 * X/label/tick — comes from `displayed`, a snapshot that only commits ~190ms
 * after the user picks something, while the stage sits at opacity 0. Nothing
 * re-renders mid-fade: the exiting content is frozen because it IS the
 * snapshot, not a dying AnimatePresence clone. `selectedMode`/`selectedPart`
 * stay live so the tab pill reacts instantly.
 */
export function useRailViewState(
  openFamily: SettingsSectionId | null,
  model: SettingsModel,
  familyFooters: Partial<Record<SettingsSectionId, ComponentType<MobileRailRowProps>>>,
) {
  // Selected Style part — the QR row shows its catalogue, the tabs track it.
  const [openPart, setOpenPart] = useState<QrStylePartId>("Module");
  // Browsed fill mode per family — unset entries derive from the model.
  const [familyModes, setFamilyModes] = useState<Partial<Record<SettingsSectionId, string>>>({});

  const incomingMode =
    openFamily && familyFooters[openFamily]
      ? (familyModes[openFamily] ?? defaultFamilyMode(openFamily, model))
      : undefined;
  const [displayed, setDisplayed] = useState({
    family: openFamily,
    mode: incomingMode,
    part: openPart,
  });
  // "stage" fades the whole rail block (family open/close); "row" fades only
  // the option row (mode/part tabs inside a family — tabs/actions stay lit).
  // Derived from the pending target so the fade starts on the same render the
  // target changes, without a synchronous setState in an effect.
  const targetPending =
    displayed.family !== openFamily ||
    displayed.mode !== incomingMode ||
    displayed.part !== openPart;
  const fading: "stage" | "row" | false = targetPending
    ? displayed.family === openFamily
      ? "row"
      : "stage"
    : false;

  useEffect(() => {
    if (!targetPending) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setDisplayed({ family: openFamily, mode: incomingMode, part: openPart });
    }, 190);
    return () => window.clearTimeout(timeout);
  }, [openFamily, incomingMode, openPart, targetPending]);

  const viewFamily = displayed.family;
  // Footer pill highlight: live for the displayed family so a tap slides the
  // pill instantly; during a family fade it still describes the exiting view.
  const railMode =
    viewFamily && familyFooters[viewFamily]
      ? (familyModes[viewFamily] ?? defaultFamilyMode(viewFamily, model))
      : undefined;

  const setRailMode = useCallback(
    (mode: string) => {
      setFamilyModes((current) => (viewFamily ? { ...current, [viewFamily]: mode } : current));
    },
    [viewFamily],
  );

  const railModeContext = useMemo(
    () => ({ mode: displayed.mode, selectedMode: railMode, setMode: setRailMode }),
    [displayed.mode, railMode, setRailMode],
  );

  const railPartContext = useMemo(
    () => ({
      part: displayed.part,
      selectedPart: openPart,
      selectPart: setOpenPart,
    }),
    [displayed.part, openPart],
  );

  return {
    fading,
    railModeContext,
    railPartContext,
    setOpenPart,
    viewFamily,
  };
}
