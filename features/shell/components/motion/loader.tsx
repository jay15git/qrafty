"use client";
// beui.dev/components/motion/loader

import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_IN_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type LoaderVariant = "dots" | "percent";

export interface LoaderProps {
  /** Which animation to render. */
  variant?: LoaderVariant;
  /** Base square size in px. Everything scales from this. */
  size?: number;
  /** Seconds per animation cycle. */
  speed?: number;
  /** Accessible label announced to screen readers. */
  label?: string;
  /** 0–100 value for the `percent` variant. Omit for the self-animating demo loop. */
  progress?: number;
  /** Stretch the `percent` variant's track to its container instead of `size * 1.4`. */
  fullWidth?: boolean;
  className?: string;
}

export function Loader({
  variant = "dots",
  size = 32,
  speed = 1,
  label = "Loading",
  progress,
  fullWidth = false,
  className,
}: LoaderProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-foreground", className)}
    >
      {variant === "dots" && <Dots size={size} speed={speed} reduce={reduce} />}
      {variant === "percent" && (
        <Percent
          size={size}
          speed={speed}
          reduce={reduce}
          progress={progress}
          fullWidth={fullWidth}
        />
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

interface PartProps {
  size: number;
  speed: number;
  reduce: boolean;
}

function Dots({ size, speed, reduce }: PartProps) {
  const dot = size * 0.24;
  return (
    <span className="flex items-center" style={{ gap: size * 0.14 }}>
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          className="rounded-full bg-current"
          style={{ width: dot, height: dot }}
          animate={
            reduce ? { opacity: [0.4, 1, 0.4] } : { y: [0, -size * 0.3, 0], opacity: [0.5, 1, 0.5] }
          }
          transition={{
            duration: speed,
            ease: EASE_IN_OUT,
            repeat: Infinity,
            delay: i * speed * 0.16,
          }}
        />
      ))}
    </span>
  );
}

function Percent({
  size,
  speed,
  reduce,
  progress,
  fullWidth,
}: PartProps & { progress?: number; fullWidth?: boolean }) {
  const [p, setP] = useState(0);
  const controlled = progress !== undefined;
  useEffect(() => {
    if (controlled) return;
    const dur = (reduce ? speed * 2 : speed) * 1000;
    const start = { t: 0 };
    const tickMs = 40;
    const id = setInterval(() => {
      start.t += tickMs;
      const next = Math.min(100, Math.round((start.t / dur) * 100));
      setP(next);
      if (next >= 100) start.t = 0;
    }, tickMs);
    return () => clearInterval(id);
  }, [speed, reduce, controlled]);

  const shown = controlled ? Math.min(100, Math.max(0, Math.round(progress))) : p;

  return (
    <span
      className={cn("flex flex-col items-center", fullWidth && "w-full")}
      style={{ gap: size * 0.14, width: fullWidth ? "100%" : size * 1.4 }}
    >
      <span
        className="font-mono font-medium tabular-nums"
        style={{ fontSize: size * 0.42, lineHeight: 1 }}
      >
        {shown}%
      </span>
      <span
        className="w-full overflow-hidden rounded-full bg-current/15"
        style={{ height: Math.max(3, size * 0.1) }}
      >
        <span
          className="block h-full rounded-full bg-current transition-[width] duration-[var(--motion-slow)] ease-out"
          style={{ width: `${shown}%` }}
        />
      </span>
    </span>
  );
}
