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
      element.style.opacity = String(sample.opacity);
      if (sample.fill) {
        element.style.fill = sample.fill;
      }
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
