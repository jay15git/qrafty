"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { CardBackgroundImageLayer } from "@/features/canvas/components/CardBackgroundImageLayer";
import { CanvasCardPaperShaderLayer } from "@/features/canvas/components/CardPaperShaderLayer";
import type { CanvasCardState } from "@/features/canvas/model/card-state";
import { cssFillToBackgroundStyle } from "@/features/canvas/model/css-fill-style";
import { paintToCss } from "@/features/canvas/model/paint";
import { cn } from "@/lib/utils";

const CROSSFADE_MS = 180;

type BackgroundMode = "solid" | "paper-shader" | "image";

type CardBackgroundLayersProps = {
  cardState: CanvasCardState;
  isImageMode: boolean;
  isPaperShaderMode: boolean;
  layoutHeight: number;
  layoutWidth: number;
  shaderDisplayHeight: number;
  shaderDisplayWidth: number;
};

function resolveBackgroundMode(isPaperShaderMode: boolean, isImageMode: boolean): BackgroundMode {
  if (isPaperShaderMode) {
    return "paper-shader";
  }

  if (isImageMode) {
    return "image";
  }

  return "solid";
}

type CrossfadeState = {
  mounted: boolean;
  opacity: number;
  prevActive: boolean;
};

function resolveCrossfadeTransition(state: CrossfadeState, active: boolean): CrossfadeState {
  let opacity = state.opacity;

  if (active && active !== state.prevActive) {
    // Start the fade-in from transparent so the CSS transition runs.
    opacity = 0;
  } else if (!active) {
    opacity = 0;
  }

  return { mounted: state.mounted || active, opacity, prevActive: active };
}

function CrossfadeShell({
  active,
  className,
  children,
}: {
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<CrossfadeState>(() => ({
    mounted: active,
    opacity: active ? 1 : 0,
    prevActive: active,
  }));

  // Adjust during render so prop changes settle in one commit; the effect below
  // only owns the async fade-in frame and the delayed unmount timer.
  if (active !== state.prevActive) {
    setState(resolveCrossfadeTransition(state, active));
  }

  const { mounted, opacity } = state;

  useEffect(() => {
    if (active && opacity === 0) {
      const frame = window.requestAnimationFrame(() => {
        setState((current) => ({ ...current, opacity: 1 }));
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!active && mounted) {
      const timer = window.setTimeout(() => {
        setState((current) => ({ ...current, mounted: false }));
      }, CROSSFADE_MS);
      return () => window.clearTimeout(timer);
    }
  }, [active, mounted, opacity]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity,
        transition: `opacity ${CROSSFADE_MS}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
}

function useMountedBackgroundModes(activeMode: BackgroundMode) {
  const [mountedModes, setMountedModes] = useState<Set<BackgroundMode>>(
    () => new Set([activeMode]),
  );
  const previousModeRef = useRef(activeMode);

  useEffect(() => {
    if (previousModeRef.current === activeMode) {
      return;
    }

    const previousMode = previousModeRef.current;
    previousModeRef.current = activeMode;
    setMountedModes((current) => new Set([...current, activeMode, previousMode]));

    const timer = window.setTimeout(() => {
      setMountedModes(new Set([activeMode]));
    }, CROSSFADE_MS);

    return () => window.clearTimeout(timer);
  }, [activeMode]);

  return mountedModes;
}

export function CardBackgroundLayers({
  cardState,
  isImageMode,
  isPaperShaderMode,
  layoutHeight,
  layoutWidth,
  shaderDisplayHeight,
  shaderDisplayWidth,
}: CardBackgroundLayersProps) {
  const activeMode = resolveBackgroundMode(isPaperShaderMode, isImageMode);
  const mountedModes = useMountedBackgroundModes(activeMode);
  const fillStyle = cssFillToBackgroundStyle(paintToCss(cardState.fill));
  const zIndexFor = (mode: BackgroundMode) => (activeMode === mode ? "z-[2]" : "z-[1]");

  return (
    <>
      {mountedModes.has("solid") ? (
        <CrossfadeShell active={activeMode === "solid"} className={zIndexFor("solid")}>
          <div
            aria-hidden="true"
            data-slot="canvas-card-fill"
            className="size-full"
            style={{
              ...fillStyle,
              borderRadius: "inherit",
            }}
          />
        </CrossfadeShell>
      ) : null}
      {mountedModes.has("image") && cardState.cardImage.value ? (
        <CrossfadeShell active={activeMode === "image"} className={zIndexFor("image")}>
          <CardBackgroundImageLayer
            fit={cardState.cardImage.fit}
            imageUrl={cardState.cardImage.value}
            opacity={cardState.cardImage.opacity / 100}
          />
        </CrossfadeShell>
      ) : null}

      {mountedModes.has("paper-shader") ? (
        <CrossfadeShell
          active={activeMode === "paper-shader"}
          className={zIndexFor("paper-shader")}
        >
          <CanvasCardPaperShaderLayer
            displayHeight={shaderDisplayHeight}
            displayWidth={shaderDisplayWidth}
            layoutHeight={layoutHeight}
            layoutWidth={layoutWidth}
            paperShader={cardState.paperShader}
          />
        </CrossfadeShell>
      ) : null}
    </>
  );
}
