import {
  isPreserveModuleFill,
  sampleDotMatrixAnimationFrame,
} from './animations';

export interface DotMatrixLoopAnimation {
  from?: number;
  duration?: number;
  easing?: string;
  web?: {
    opacity?: any;
    fill?: any;
    opacityMultiplier?: any;
    scale?: any;
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

function getPaintTargets(element: SVGElement) {
  return element.matches(DOT_MATRIX_PAINTABLE_SELECTOR)
    ? [element]
    : Array.from(
        element.querySelectorAll<SVGElement>(DOT_MATRIX_PAINTABLE_SELECTOR),
      );
}

function readPaintTargetFill(element: SVGElement) {
  const attrFill = element.getAttribute('fill');
  if (attrFill && attrFill !== 'none') {
    return attrFill;
  }

  return element.style.getPropertyValue('fill') || '';
}

function restorePaintTargetFill(element: SVGElement, originalFill: string) {
  element.style.removeProperty('fill');
  if (originalFill) {
    element.setAttribute('fill', originalFill);
    return;
  }

  element.removeAttribute('fill');
}

function applyPaintTargetFill(element: SVGElement, fill: string) {
  element.style.setProperty('fill', fill);
}

function captureOriginalFills(targets: DotMatrixLoopTarget[]) {
  const fills = new WeakMap<SVGElement, string>();

  for (const { element } of targets) {
    const paintTargets = getPaintTargets(element);
    if (paintTargets.length === 0) {
      fills.set(element, readPaintTargetFill(element));
      continue;
    }

    for (const target of paintTargets) {
      fills.set(target, readPaintTargetFill(target));
    }
  }

  return fills;
}

function applyDotMatrixSample(
  element: SVGElement,
  sample: {
    opacity: number;
    fill?: string;
    opacityMultiplier?: number;
    scale?: number;
  },
  originalFills: WeakMap<SVGElement, string>,
) {
  const opacityMultiplier =
    sample.opacityMultiplier !== undefined && Number.isFinite(sample.opacityMultiplier)
      ? sample.opacityMultiplier
      : 1;
  element.style.opacity = String(
    Math.max(0, Math.min(1, sample.opacity * opacityMultiplier)),
  );

  if (sample.scale !== undefined && Number.isFinite(sample.scale)) {
    element.style.transform = `scale(${sample.scale})`;
  } else {
    element.style.removeProperty('transform');
  }

  const paintTargets = getPaintTargets(element);
  const shouldPreserve =
    !sample.fill || isPreserveModuleFill(sample.fill);

  if (paintTargets.length === 0) {
    if (shouldPreserve) {
      const original = originalFills.get(element);
      if (original !== undefined) {
        restorePaintTargetFill(element, original);
      }
      return;
    }

    applyPaintTargetFill(element, sample.fill!);
    return;
  }

  for (const target of paintTargets) {
    if (shouldPreserve) {
      const original = originalFills.get(target);
      if (original !== undefined) {
        restorePaintTargetFill(target, original);
      }
      continue;
    }

    applyPaintTargetFill(target, sample.fill!);
  }
}

export function startDotMatrixLoop(
  targets: DotMatrixLoopTarget[],
  requestFrame: (callback: () => void) => number,
  cancelFrame: (frame: number) => void
): DotMatrixLoopHandle {
  let frameId: number | undefined;
  let stopped = false;
  const originalFills = captureOriginalFills(targets);
  const startMs =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  const tick = () => {
    if (stopped) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const globalTimeMs = now - startMs;

    targets.forEach(({ element, animation }) => {
      if (!element || !element.style) return;
      const sample = sampleDotMatrixAnimationFrame(animation as any, globalTimeMs);
      applyDotMatrixSample(element, sample, originalFills);
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
