import { createContext, useEffect, useRef, type ReactNode } from "react";

import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import type { QrStylePartId } from "@/features/shell/settings/qr-style-parts";

export type MobileRailOption = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Circle + label (default) or a plain text pill. */
  shape?: "circle" | "pill";
  /** Style part this option drills into, swapping the row for its catalogue. */
  drillsTo?: QrStylePartId;
};

export type MobileRailRowProps = {
  model: SettingsModel;
  /** Opens the family drawer on this family's section (long-tail controls). */
  openDrawer: () => void;
};

/**
 * Detail callbacks run after the row re-rendered, so they must read the latest
 * model — the ReactNode handed to `openDetail` captures props at open time.
 */
export function useLatestModel(model: SettingsModel) {
  const ref = useRef(model);
  useEffect(() => {
    ref.current = model;
  });
  return ref;
}

/**
 * Browse mode shared between a family row (options in the scrollarea) and its
 * footer pills (mode switcher below it). `mode` is always resolved — the rail
 * fills it with the value derived from the model when nothing was browsed yet.
 */
export const MobileRailModeContext = createContext<{
  /** Mode the option row is currently displaying (lags during the fade-out
      beat so exiting content never swaps in place). */
  mode: string | undefined;
  /** Mode the user picked — the footer pills highlight it immediately. */
  selectedMode: string | undefined;
  setMode: (mode: string) => void;
} | null>(null);

/**
 * Selected QR style part shared between the Style family's row (catalogue
 * above) and its footer tabs. Always resolved — defaults to Module.
 * `part` lags like `mode`; `selectedPart` is what the tabs highlight.
 */
export const MobileRailPartContext = createContext<{
  part: QrStylePartId;
  selectedPart: QrStylePartId;
  selectPart: (part: QrStylePartId) => void;
} | null>(null);
