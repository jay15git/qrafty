import { sampleDotMatrixAnimationFrame } from './animations';

export interface DotMatrixLoopAnimation {
  from?: number;
  duration?: number;
  easing?: string;
  web?: {
    opacity?: any;
    fill?: any;
  };
}

export interface DotMatrixLoopTarget {
  element: SVGElement;
  animation: DotMatrixLoopAnimation;
}

export interface DotMatrixLoopHandle {
  stop: () => void;
}

const DOT_MATRIX_PAINTABLE_SELECTOR = 'path,circle,rect,polygon';

function applyDotMatrixSample(
  element: SVGElement,
  sample: { opacity: number; fill?: string },
) {
  element.style.opacity = String(sample.opacity);

  if (!sample.fill) {
    return;
  }

  const paintTargets = element.matches(DOT_MATRIX_PAINTABLE_SELECTOR)
    ? [element]
    : Array.from(
        element.querySelectorAll<SVGElement>(DOT_MATRIX_PAINTABLE_SELECTOR),
      );

  if (paintTargets.length === 0) {
    element.style.fill = sample.fill;
    return;
  }

  for (const target of paintTargets) {
    target.style.fill = sample.fill;
  }
}

export function startDotMatrixLoop(
  targets: DotMatrixLoopTarget[],
  requestFrame: (callback: () => void) => number,
  cancelFrame: (frame: number) => void
): DotMatrixLoopHandle {
  let frameId: number | undefined;
  let stopped = false;
  const startMs =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  const tick = () => {
    if (stopped) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const globalTimeMs = now - startMs;

    targets.forEach(({ element, animation }) => {
      if (!element || !element.style) return;
      const sample = sampleDotMatrixAnimationFrame(animation as any, globalTimeMs);
      applyDotMatrixSample(element, sample);
    });

    frameId = requestFrame(tick);
  };

  frameId = requestFrame(tick);

  return {
    stop: () => {
      stopped = true;
      if (frameId !== undefined) {
        cancelFrame(frameId);
        frameId = undefined;
      }
    },
  };
}
