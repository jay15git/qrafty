"use client";

import * as React from "react";
import { Root as FillRoot } from "@/components/ui/fill-picker/parts/fill/root";
import { Tabs as FillTabs, Tab as FillTab } from "@/components/ui/fill-picker/parts/fill/tabs";
import {
  Pane as EngineFillPane,
  type PaneProps,
} from "@/components/ui/fill-picker/parts/fill/pane";
import { GradientStopEditorContext } from "@/components/ui/fill-picker-base/public-api";
import { stopEditorSlot } from "./parts/gradient/stop-editor";

/**
 * The engine `Pane` plus this variant's stop editor: the gradient pane owns
 * its gradient state directly (never via `<GradientPickerBase.Root>`), so a
 * `<Bar editOnClick>` nested inside it gets its editor from here.
 */
const FillPane = React.forwardRef<HTMLDivElement, PaneProps>(function Pane(
  props,
  ref,
) {
  return (
    <GradientStopEditorContext.Provider value={stopEditorSlot}>
      <EngineFillPane ref={ref} {...props} />
    </GradientStopEditorContext.Provider>
  );
});

const FillPickerBase = {
  Root: FillRoot,
  Tabs: FillTabs,
  Tab: FillTab,
  Pane: FillPane,
};

export const FillPicker = FillPickerBase;
