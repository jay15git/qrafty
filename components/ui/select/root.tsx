"use client";

import {
  Children,
  isValidElement,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { SizeProvider, type SizeVariant } from "@/lib/size-context";
import { SelectContext } from "./context";

// How long a selection holds the popup open before closing, so the
// acknowledgment — the checkmark drawing in and the selected background
// springing to the picked row — is visible instead of being cut off by the
// ~60ms close fade. Escape and outside presses still close immediately.
const selectionAckMs = 300;

export interface SelectProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  /** Pins trigger and popup to one step of the size ladder (default 36px,
   *  compact 28px — see /docs/sizes). Omitted, both follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

/**
 * Walk the children tree collecting `{ value, label }` pairs from SelectItem
 * elements. Passed to Base UI's `items` prop so the trigger can resolve the
 * label of an initial value before the popup has ever mounted (items only
 * render while open). Non-string labels fall back to the raw value, matching
 * the previous labelMap behaviour.
 */
function collectSelectItems(
  node: ReactNode,
  out: { value: string; label: ReactNode }[] = []
) {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as {
      value?: unknown;
      label?: ReactNode;
      triggerLabel?: ReactNode;
      children?: ReactNode;
    };
    if (typeof props.value === "string") {
      out.push({
        value: props.value,
        label:
          props.triggerLabel ??
          props.label ??
          (typeof props.children === "string" ? props.children : props.value),
      });
    } else if (props.children) {
      collectSelectItems(props.children, out);
    }
  });
  return out;
}

export function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  name,
  required,
  size,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const actionsRef = useRef<{ unmount: () => void } | null>(null);
  const currentValue = value !== undefined ? value : internalValue;

  const items = useMemo(() => collectSelectItems(children), [children]);

  const handleValueChange = useCallback(
    (next: string | null) => {
      const v = next ?? "";
      if (value === undefined) setInternalValue(v);
      onValueChange?.(v);
    },
    [value, onValueChange]
  );

  const ackTimeoutRef = useRef<number | null>(null);
  const cancelAckClose = useCallback(() => {
    if (ackTimeoutRef.current !== null) {
      clearTimeout(ackTimeoutRef.current);
      ackTimeoutRef.current = null;
    }
  }, []);
  useEffect(() => cancelAckClose, [cancelAckClose]);

  // Picking an item acknowledges before closing: the close is deferred by
  // selectionAckMs so the checkmark draw and the selected background's spring
  // to the picked row are seen. Every other close reason (Escape, outside
  // press, trigger toggle, focus-out) closes immediately and cancels any
  // pending acknowledgment; re-picking within the window restarts it.
  const handleOpenChange = useCallback(
    (nextOpen: boolean, eventDetails: { reason: string }) => {
      if (!nextOpen && eventDetails.reason === "item-press") {
        cancelAckClose();
        ackTimeoutRef.current = window.setTimeout(() => {
          ackTimeoutRef.current = null;
          setOpen(false);
        }, selectionAckMs);
        return;
      }
      cancelAckClose();
      setOpen(nextOpen);
    },
    [cancelAckClose]
  );

  const ctx = useMemo(
    () => ({ value: currentValue, open, actionsRef }),
    [currentValue, open]
  );

  // A size prop pins the whole compound (trigger + portalled popup — React
  // context crosses portals) to one step of the ladder.
  const root = (
    <SelectContext.Provider value={ctx}>
      <SelectPrimitive.Root
        // Always controlled; "" (no selection) maps to Base UI's null.
        value={currentValue === "" ? null : currentValue}
        onValueChange={handleValueChange}
        open={open}
        onOpenChange={handleOpenChange}
        actionsRef={actionsRef}
        items={items}
        disabled={disabled}
        name={name}
        required={required}
        // Non-modal: the page keeps scrolling and the Positioner tracks the
        // anchor, so the popup follows its trigger instead of detaching.
        modal={false}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  );

  return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
}

Select.displayName = "Select";
