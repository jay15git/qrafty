import type { PointerEvent } from "react";

const LAYER_MOVE_CURSOR_LOCK_CLASS = "canvas-layer-moving";

export function isTouchLikePointer(event: { pointerType: string }) {
  return event.pointerType === "touch" || event.pointerType === "pen";
}

export function lockLayerMoveCursor() {
  document.documentElement.classList.add(LAYER_MOVE_CURSOR_LOCK_CLASS);
  document.body.classList.add(LAYER_MOVE_CURSOR_LOCK_CLASS);
}

export function unlockLayerMoveCursor() {
  document.documentElement.classList.remove(LAYER_MOVE_CURSOR_LOCK_CLASS);
  document.body.classList.remove(LAYER_MOVE_CURSOR_LOCK_CLASS);
}

export function releasePointerCaptureSafe(event: PointerEvent<HTMLElement>) {
  const target = event.currentTarget;
  if (typeof target.hasPointerCapture === "function" && target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }
}
