"use client";

// ---------------------------------------------------------------------------
// Select — public surface
//
// Implementation lives in components/ui/select/:
//   context.tsx  — SelectContext / SelectContentContext / popupShape
//   root.tsx     — Select (value + open state, ack-deferred close)
//   trigger.tsx  — SelectTrigger
//   overlays.tsx — SelectOverlays (selected bg, hover pill, focus ring)
//   content.tsx  — SelectContent (portal, positioner, popup, scroll area)
//   item.tsx     — SelectItem
// ---------------------------------------------------------------------------

export { Select } from "./select/root";
export type { SelectProps } from "./select/root";
export { SelectTrigger } from "./select/trigger";
export { SelectContent } from "./select/content";
export { SelectItem } from "./select/item";
