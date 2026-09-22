"use client";

import * as React from "react";
import { StopPopover } from "@/components/ui/fill-picker/parts/gradient/stop-popover";
import { ColorPickerContext } from "@/components/ui/fill-picker/context";
import type { ColorPickerState } from "@/components/ui/fill-picker/hooks/use-color-picker";
import { Area as ColorArea } from "@/components/ui/fill-picker/parts/area";
import { EyeDropper } from "@/components/ui/fill-picker/parts/eye-dropper";

import { Hue } from "../hue";
import { Alpha } from "../alpha";
import { ChannelInput } from "../channel-input";
import { FormatSwitcher } from "../format-switcher";

interface StopColorEditorPopoverProps {
  /** Bound color-picker state — `useStopColorPickerState` for gradient stops,
   *  or a `useColorPicker` result for standalone colors (palette rows). */
  state: ColorPickerState;
  /** Controlled open state — the caller owns it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Anchor element. Positioned against; provides positioning only. */
  children: React.ReactElement;
}

/**
 * The shared per-stop color editor popover: `StopPopover` shell plus the
 * Area / Hue / Alpha / FormatSwitcher / EyeDropper / ChannelInput stack,
 * bound to whichever `ColorPickerState` the caller resolved. Used by the
 * gradient stop editor and the palette color row editor so the layout can't
 * drift between them.
 */
export function StopColorEditorPopover({
  state,
  open,
  onOpenChange,
  children,
}: StopColorEditorPopoverProps) {
  return (
    <StopPopover
      open={open}
      onOpenChange={onOpenChange}
      anchor={children}
      className="flex w-72 flex-col gap-3"
      onContentClick={(e) => e.stopPropagation()}
    >
      <ColorPickerContext.Provider value={state}>
        <ColorArea mode="oklch-cl" />
        <div className="flex flex-col gap-1.5">
          <Hue />
          <Alpha />
        </div>
        <div className="flex items-center gap-2">
          <FormatSwitcher className="flex-1" />
          <EyeDropper className="h-8 w-full flex-1" />
        </div>
        <ChannelInput showFormat={false} />
      </ColorPickerContext.Provider>
    </StopPopover>
  );
}
