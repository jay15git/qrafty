"use client";

import * as React from "react";
import type { GradientStopEditorRenderer } from "@/components/ui/fill-picker/public-api";
import { useStopColorPickerState } from "@/components/ui/fill-picker/parts/gradient/stop-editor-shared";

import { StopColorEditorPopover } from "./stop-color-editor-popover";

interface StopEditorProps {
  /** Stop the popover edits — color + per-stop format are read/written via gradient context. */
  stopId: string;
  /**
   * Controlled open state. Required — open is always external because
   * the anchor element typically has its own pointer handling (drag on
   * Bar handles, click on StopList swatches) that would conflict with
   * a trigger-managed open state.
   */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Anchor element. Positioned against; provides positioning only. */
  children: React.ReactElement;
}

/**
 * Base UI variant of `<StopEditorPopover>`: binds `useStopColorPickerState`
 * (shared with the original so the memoization subtleties can't drift) and
 * renders the shared `StopColorEditorPopover` — the layout lives there so it
 * stays identical to the palette color editor.
 */
function StopEditor({ stopId, open, onOpenChange, children }: StopEditorProps) {
  const state = useStopColorPickerState(stopId);
  return (
    <StopColorEditorPopover state={state} open={open} onOpenChange={onOpenChange}>
      {children}
    </StopColorEditorPopover>
  );
}

/**
 * `<GradientPickerBase.Bar editOnClick>`'s stop-editor slot, filled with the
 * editor above. Injected as the default by the Base UI barrels
 * (`gradient.tsx`, `fill.tsx`).
 */
export const stopEditorSlot: GradientStopEditorRenderer = ({ children, ...props }) => (
  // The Bar always passes a single element (the stop handle) as `children`;
  // the slot type is widened to ReactNode only because it is React's own
  // children convention.
  <StopEditor {...props}>{children as React.ReactElement}</StopEditor>
);
