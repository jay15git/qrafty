"use client";

import { animate, m, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { SettingsPanelMotionFrozenProvider } from "@/features/shell/components/settings-panel-motion-frozen-context";

import "./settings-toolbar-motion.css";

const EXPANDABLE_PANEL_SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

/** Expanded column leaves enough room to keep the canvas legible on compact desktops. */
const SHELL_EXPANDED_WIDTH_RATIO = 0.28;
const SHELL_EXPANDED_WIDTH_MIN_PX = 320;
const SHELL_EXPANDED_WIDTH_MAX_PX = 400;
const SHELL_EXPANDED_WIDTH_FALLBACK_PX = 360;

function getExpandedSidebarWidthPx(): number {
  if (typeof window === "undefined") {
    return SHELL_EXPANDED_WIDTH_FALLBACK_PX;
  }

  return Math.round(
    Math.min(
      SHELL_EXPANDED_WIDTH_MAX_PX,
      Math.max(SHELL_EXPANDED_WIDTH_MIN_PX, window.innerWidth * SHELL_EXPANDED_WIDTH_RATIO),
    ),
  );
}

/**
 * One width drives the white settings column AND the grey canvas left inset.
 * Must be set on workspace / :root — canvas is not under the toolbar overlay,
 * so setting the var only on toolbar-root leaves the grey full-bleed (settings look like a transparent overlay).
 */
function syncSidebarColumnWidth(width: number) {
  const value = `${Math.max(0, width)}px`;
  const targets: Array<HTMLElement | null> = [
    document.documentElement,
    document.querySelector<HTMLElement>('[data-slot="workspace"]'),
    document.querySelector<HTMLElement>('[data-slot="chrome-root"]'),
  ];

  for (const target of targets) {
    target?.style.setProperty("--toolbar-width", value);
  }
}

export function DesktopSettingsShell({
  hovered,
  settings,
  showSettings,
}: {
  hovered?: boolean;
  settings: ReactNode;
  showSettings: boolean;
}) {
  const [internalHovered, setInternalHovered] = useState(false);
  const [isShellAnimating, setIsShellAnimating] = useState(false);
  const isHovered = hovered ?? internalHovered;

  // The column's real width (layout) snaps to the target; the visible reveal is
  // a clip-path inset animated by a spring — compositor-only, no layout work.
  const columnWidth = useMotionValue(SHELL_EXPANDED_WIDTH_FALLBACK_PX);
  const revealWidth = useMotionValue(SHELL_EXPANDED_WIDTH_FALLBACK_PX);
  const clipPath = useTransform(
    [columnWidth, revealWidth],
    ([column, reveal]: number[]) => `inset(0px ${Math.max(0, column - reveal)}px 0px 0px)`,
  );
  const transitionsEnabled = useRef(false);

  useMotionValueEvent(revealWidth, "change", (latest) => {
    // Keep the canvas left inset in lockstep with the animated reveal —
    // syncing only on commit leaves the grey inset one jump behind.
    syncSidebarColumnWidth(latest);
  });
  useMotionValueEvent(revealWidth, "animationStart", () => {
    setIsShellAnimating(true);
  });
  useMotionValueEvent(revealWidth, "animationComplete", () => {
    setIsShellAnimating(false);
  });
  useMotionValueEvent(revealWidth, "animationCancel", () => {
    setIsShellAnimating(false);
  });

  useEffect(() => {
    const updateExpandedWidth = () => {
      const next = getExpandedSidebarWidthPx();
      columnWidth.set(next);
      if (transitionsEnabled.current) {
        if (revealWidth.get() !== next) {
          animate(revealWidth, next, EXPANDABLE_PANEL_SPRING);
        }
      } else {
        revealWidth.jump(next);
      }
    };

    updateExpandedWidth();
    window.addEventListener("resize", updateExpandedWidth);
    const enableTransitionsFrame = window.requestAnimationFrame(() => {
      transitionsEnabled.current = true;
    });

    return () => {
      window.removeEventListener("resize", updateExpandedWidth);
      window.cancelAnimationFrame(enableTransitionsFrame);
    };
  }, [columnWidth, revealWidth]);

  const handleShellMouseEnter = useCallback(() => {
    if (hovered === undefined) {
      setInternalHovered(true);
    }
  }, [hovered]);

  const handleShellMouseLeave = useCallback(() => {
    if (hovered === undefined) {
      setInternalHovered(false);
    }
  }, [hovered]);

  const panelContent = showSettings ? (
    <SettingsPanelMotionFrozenProvider frozen={isShellAnimating}>
      {settings}
    </SettingsPanelMotionFrozenProvider>
  ) : null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[25]"
      data-slot="settings-toolbar-anchor"
      onMouseEnter={handleShellMouseEnter}
      onMouseLeave={handleShellMouseLeave}
    >
      {/*
        White column clip: width tracks viewport for responsive sidebar.
        Same width updates --toolbar-width so grey canvas left inset
        grows in lockstep — white expands, grey minimizes. No overlay on the canvas.
        The reveal animates via clip-path (paint-only) instead of width so the
        browser never re-runs layout per frame.
      */}
      <m.div
        className="pointer-events-auto absolute inset-y-0 left-0 z-[25] overflow-hidden bg-transparent text-[var(--glass-fg)]"
        data-hovered={isHovered ? "true" : "false"}
        data-shell-animating={isShellAnimating ? "true" : "false"}
        data-slot="desktop-settings-shell"
        data-toolbar-appearance="settings"
        style={{ width: columnWidth, clipPath }}
      >
        <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">
          <div className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-hidden">
            {panelContent}
          </div>
        </div>
      </m.div>
    </div>
  );
}
