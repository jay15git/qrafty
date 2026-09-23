"use client";

// ---------------------------------------------------------------------------
// FamilyDrawer — public surface
//
// Implementation lives in components/ui/family-drawer/:
//   context.ts       — FamilyDrawerContext / useFamilyDrawer / view types
//   root.tsx         — FamilyDrawerRoot (open + view state, measured bounds)
//   content.tsx      — FamilyDrawerContent (animated height frame)
//   animated.tsx     — FamilyDrawerAnimatedWrapper / FamilyDrawerAnimatedContent
//   view-content.tsx — FamilyDrawerViewContent
//   parts.tsx        — Trigger / Portal / Overlay / Close / Header / Buttons
// ---------------------------------------------------------------------------

export { FamilyDrawerRoot } from "./family-drawer/root";
export { FamilyDrawerPortal } from "./family-drawer/parts";
export { FamilyDrawerContent } from "./family-drawer/content";
export { FamilyDrawerAnimatedWrapper, FamilyDrawerAnimatedContent } from "./family-drawer/animated";
export { useFamilyDrawer } from "./family-drawer/context";
export type { ViewsRegistry, ViewComponent } from "./family-drawer/context";
