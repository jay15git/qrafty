"use client";

import { createContext, useContext } from "react";
import { shapeClasses } from "@/lib/shape-classes";

// ---------------------------------------------------------------------------
// Select context
//
// Built on Base UI's Select primitive, which owns positioning (collision
// flipping, anchor tracking), dismissal (outside press, focus-out, Escape
// nesting inside dialogs), list keyboard navigation + typeahead, combobox
// hover/selection overlays, the spring open/close animation (via actionsRef
// deferred unmount), and the animated checkmark.
// ---------------------------------------------------------------------------

interface SelectContextValue {
  value: string;
  open: boolean;
  actionsRef: React.RefObject<{ unmount: () => void } | null>;
}

export const SelectContext = createContext<SelectContextValue | null>(null);

export function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select compound components must be inside <Select>");
  return ctx;
}

// Content context for the popup's hover pill and row registration
interface SelectContentContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  checkedIndex?: number;
}

export const SelectContentContext = createContext<SelectContentContextValue | null>(null);

// The trigger follows the global pill/rounded shape; the popup does not.
// Like Dropdown and Combobox, the list keeps the smaller "rounded" radii
// whatever the rest of the UI is shaped: pill corners on a popover distort
// its padding and break the concentric fit of the rows' hover and selection
// backgrounds inside it.
export const popupShape = shapeClasses;
