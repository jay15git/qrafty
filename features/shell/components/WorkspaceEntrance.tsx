"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { ThemeMode } from "@/features/shell/components/FloatingToolbar";
import { previewDrawerResize } from "@/features/canvas/preview/preview-drawer-resize";

import "./workspace-entrance.css";

export const ENTRANCE_COMPLETE_EVENT = "entrance-complete";
export const ENTRANCE_PRE_REVEAL_EVENT = "entrance-pre-reveal";

const REVEAL_MS = 940;
const MOBILE_INSET_QUERY = "(max-width: 767px)";

type EntrancePhase = "loading" | "revealing" | "done";

type WorkspaceEntranceProps = {
  theme: ThemeMode;
  children: ReactNode;
  onPhaseChange?: (phase: EntrancePhase) => void;
};

function isMobileChromeInsetsReady() {
  if (typeof window.matchMedia !== "function") {
    return true;
  }

  if (!window.matchMedia(MOBILE_INSET_QUERY).matches) {
    return true;
  }

  if (document.querySelector('[data-slot="mobile-settings-rail-root"]') === null) {
    return true;
  }

  const workspace = document.querySelector<HTMLElement>('[data-slot="workspace"]');
  const measuredDrawerHeight = workspace?.style.getPropertyValue("--mobile-drawer-height");

  return (
    Boolean(measuredDrawerHeight && measuredDrawerHeight !== "0px") &&
    !previewDrawerResize.getIsResizing()
  );
}

function getWorkspaceReadiness(root: HTMLElement) {
  const surfaceReady =
    root.querySelector('[data-slot="drafting-surface"]') !== null &&
    root.querySelector('[data-slot="drafting-workspace-loading"]') === null;

  if (!surfaceReady) {
    return "surface-pending" as const;
  }

  if (!isMobileChromeInsetsReady()) {
    return "insets-pending" as const;
  }

  return "ready" as const;
}

export function WorkspaceEntrance({ theme, children, onPhaseChange }: WorkspaceEntranceProps) {
  const [phase, setPhase] = useState<EntrancePhase>("loading");
  const rootRef = useRef<HTMLDivElement>(null);

  const updatePhase = useCallback(
    (next: EntrancePhase) => {
      setPhase(next);
      onPhaseChange?.(next);
    },
    [onPhaseChange],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    let revealFrame = 0;
    let pollFrame = 0;
    let observer: MutationObserver | null = null;

    const beginReveal = () => {
      window.dispatchEvent(new CustomEvent(ENTRANCE_PRE_REVEAL_EVENT));
      revealFrame = window.requestAnimationFrame(() => {
        updatePhase("revealing");
      });
    };

    const tryReveal = () => {
      if (getWorkspaceReadiness(root) !== "ready") {
        return false;
      }

      observer?.disconnect();
      window.cancelAnimationFrame(pollFrame);
      beginReveal();
      return true;
    };

    const scheduleInsetPoll = () => {
      if (getWorkspaceReadiness(root) !== "insets-pending") {
        return;
      }

      const poll = () => {
        if (tryReveal()) {
          return;
        }

        if (getWorkspaceReadiness(root) === "insets-pending") {
          pollFrame = window.requestAnimationFrame(poll);
        }
      };

      pollFrame = window.requestAnimationFrame(poll);
    };

    if (tryReveal()) {
      return () => window.cancelAnimationFrame(revealFrame);
    }

    observer = new MutationObserver(() => {
      if (tryReveal()) {
        return;
      }

      scheduleInsetPoll();
    });

    observer.observe(root, { childList: true, subtree: true });
    scheduleInsetPoll();

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(revealFrame);
      window.cancelAnimationFrame(pollFrame);
    };
  }, [updatePhase]);

  useEffect(() => {
    if (phase !== "revealing") {
      return;
    }

    const timer = window.setTimeout(() => {
      updatePhase("done");
      window.dispatchEvent(new CustomEvent(ENTRANCE_COMPLETE_EVENT));
    }, REVEAL_MS);

    return () => window.clearTimeout(timer);
  }, [phase, updatePhase]);

  return (
    <div
      ref={rootRef}
      className="relative h-full min-h-0"
      data-entrance={phase}
      data-shell-theme={theme}
      data-slot="entrance-root"
    >
      <div className="h-full min-h-0">{children}</div>
    </div>
  );
}
