import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { getMobileKeyboardInsetPx } from "@/features/shell/components/mobile-family-drawer-viewport";

export function useMobileKeyboardInset() {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useLayoutEffect(() => {
    let remeasureTimer = 0;

    const update = () => {
      setKeyboardInset(getMobileKeyboardInsetPx(window.innerHeight, window.visualViewport));
    };

    const remeasureAfterKeyboard = () => {
      update();
      window.clearTimeout(remeasureTimer);
      // iOS often skips visualViewport.resize after blur; trailing pass catches close.
      remeasureTimer = window.setTimeout(update, 280);
    };

    update();
    window.addEventListener("resize", remeasureAfterKeyboard);
    window.visualViewport?.addEventListener("resize", remeasureAfterKeyboard);
    window.visualViewport?.addEventListener("scroll", update);
    document.addEventListener("focusout", remeasureAfterKeyboard);
    document.addEventListener("focusin", remeasureAfterKeyboard);

    return () => {
      window.clearTimeout(remeasureTimer);
      window.removeEventListener("resize", remeasureAfterKeyboard);
      window.visualViewport?.removeEventListener("resize", remeasureAfterKeyboard);
      window.visualViewport?.removeEventListener("scroll", update);
      document.removeEventListener("focusout", remeasureAfterKeyboard);
      document.removeEventListener("focusin", remeasureAfterKeyboard);
    };
  }, []);

  return keyboardInset;
}

export function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    // The rail's height feeds the workspace canvas inset, so an unthrottled
    // observer turns a height animation into per-frame React renders.
    let frame = 0;
    const measure = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setHeight(node.getBoundingClientRect().height);
      });
    };

    setHeight(node.getBoundingClientRect().height);

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return { height, ref };
}

/* The settings drawer is portalled outside the rail's measured element, so
   `--mobile-drawer-height` (which positions the layer toolbar above
   the chrome) only saw the rail. Measure the open drawer too — the toolbar
   must clear whichever surface is taller. */
export function useMobileDrawerHeight(drawerOpen: boolean) {
  const [drawerHeight, setDrawerHeight] = useState(0);

  useEffect(() => {
    let frame = 0;
    let retries = 0;
    let observer: ResizeObserver | null = null;

    const measure = () => {
      if (!drawerOpen) {
        setDrawerHeight(0);
        return;
      }
      const el = document.querySelector<HTMLElement>('[data-slot="mobile-family-drawer-root"]');
      if (!el) {
        // The portal mounts a beat after `drawerOpen` flips — retry briefly.
        if (retries < 10) {
          retries += 1;
          frame = window.requestAnimationFrame(measure);
        }
        return;
      }
      setDrawerHeight(Math.round(el.getBoundingClientRect().height));
      if (!observer) {
        observer = new ResizeObserver(() =>
          setDrawerHeight(Math.round(el.getBoundingClientRect().height)),
        );
        observer.observe(el);
      }
    };

    frame = window.requestAnimationFrame(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [drawerOpen]);

  return drawerHeight;
}
