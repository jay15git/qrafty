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
    x?: any;
    y?: any;
    rotate?: any;
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

function composeTransform(sample: {
  scale?: number;
  x?: number;
  y?: number;
  rotate?: number;
}) {
  const parts: string[] = [];
  const x = Number.isFinite(sample.x) ? (sample.x as number) : 0;
  const y = Number.isFinite(sample.y) ? (sample.y as number) : 0;
  if (x !== 0 || y !== 0) {
    parts.push(`translate(${x * 100}%, ${y * 100}%)`);
  }
  if (Number.isFinite(sample.rotate) && sample.rotate !== 0) {
    parts.push(`rotate(${sample.rotate}deg)`);
  }
  if (Number.isFinite(sample.scale)) {
    parts.push(`scale(${sample.scale})`);
  }
  return parts.join(' ');
}

function applyDotMatrixSample(
  element: SVGElement,
  sample: {
    opacity: number;
    fill?: string;
    opacityMultiplier?: number;
    scale?: number;
    x?: number;
    y?: number;
    rotate?: number;
  },
  originalFills: WeakMap<SVGElement, string>,
  transformOnly = false,
) {
  const transform = composeTransform(sample);
  if (transform) {
    element.style.transform = transform;
  } else {
    element.style.removeProperty('transform');
  }

  if (transformOnly) {
    return;
  }

  const opacityMultiplier =
    sample.opacityMultiplier !== undefined && Number.isFinite(sample.opacityMultiplier)
      ? sample.opacityMultiplier
      : 1;
  element.style.opacity = String(
    Math.max(0, Math.min(1, sample.opacity * opacityMultiplier)),
  );

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

export function captureDotMatrixOriginalFills(targets: DotMatrixLoopTarget[]) {
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

export function seekDotMatrixTargets(
  targets: DotMatrixLoopTarget[],
  globalTimeMs: number,
  originalFills: WeakMap<SVGElement, string>,
  transformOnly = false,
) {
  targets.forEach(({ element, animation }) => {
    if (!element || !element.style) return;
    const sample = sampleDotMatrixAnimationFrame(animation as any, globalTimeMs);
    applyDotMatrixSample(element, sample, originalFills, transformOnly);
  });
}

export function startDotMatrixLoop(
  targets: DotMatrixLoopTarget[],
  requestFrame: (callback: () => void) => number,
  cancelFrame: (frame: number) => void,
  transformOnly = false
): DotMatrixLoopHandle {
  let frameId: number | undefined;
  let stopped = false;
  const originalFills = captureDotMatrixOriginalFills(targets);
  const startMs =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  const tick = () => {
    if (stopped) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const globalTimeMs = now - startMs;

    targets.forEach(({ element, animation }) => {
      if (!element || !element.style) return;
      const sample = sampleDotMatrixAnimationFrame(animation as any, globalTimeMs);
      applyDotMatrixSample(element, sample, originalFills, transformOnly);
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
