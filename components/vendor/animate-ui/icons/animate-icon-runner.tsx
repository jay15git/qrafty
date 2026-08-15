'use client';

import * as React from 'react';
import type { LegacyAnimationControls } from 'motion/react';

type StartAnim = (
  anim: 'initial' | 'animate',
  method?: 'start' | 'set',
) => Promise<void>;

type UseAnimateIconRunnerOptions = {
  localAnimate: boolean;
  controls: LegacyAnimationControls;
  loop: boolean;
  loopDelay: number;
  completeOnStop: boolean;
  persistOnAnimateEnd: boolean;
  initialOnAnimateEnd: boolean;
  statusRef: React.MutableRefObject<'initial' | 'animate'>;
  startAnim: StartAnim;
  runGenRef: React.MutableRefObject<number>;
  activeRef: React.MutableRefObject<boolean>;
  isAnimateInProgressRef: React.MutableRefObject<boolean>;
  animateEndPromiseRef: React.MutableRefObject<Promise<void> | null>;
  resolveAnimateEndRef: React.MutableRefObject<(() => void) | null>;
  loopDelayRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  delayRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
};

export function useAnimateIconRunner({
  localAnimate,
  controls,
  loop,
  loopDelay,
  completeOnStop,
  persistOnAnimateEnd,
  initialOnAnimateEnd,
  statusRef,
  startAnim,
  runGenRef,
  activeRef,
  isAnimateInProgressRef,
  animateEndPromiseRef,
  resolveAnimateEndRef,
  loopDelayRef,
  delayRef,
}: UseAnimateIconRunnerOptions) {
  React.useEffect(() => {
    const gen = ++runGenRef.current;
    const cancelledRef = { current: false };

    async function run() {
      if (cancelledRef.current || gen !== runGenRef.current) {
        await startAnim('initial');
        return;
      }

      if (!localAnimate) {
        if (
          completeOnStop &&
          isAnimateInProgressRef.current &&
          animateEndPromiseRef.current
        ) {
          try {
            await animateEndPromiseRef.current;
          } catch {
            // noop
          }
        }
        if (!persistOnAnimateEnd) {
          if (cancelledRef.current || gen !== runGenRef.current) {
            await startAnim('initial');
            return;
          }
          await startAnim('initial');
        }
        return;
      }

      if (loop) {
        if (cancelledRef.current || gen !== runGenRef.current) {
          await startAnim('initial');
          return;
        }
        await startAnim('initial', 'set');
      }

      isAnimateInProgressRef.current = true;
      animateEndPromiseRef.current = new Promise<void>((resolve) => {
        resolveAnimateEndRef.current = resolve;
      });

      if (cancelledRef.current || gen !== runGenRef.current) {
        isAnimateInProgressRef.current = false;
        resolveAnimateEndRef.current?.();
        resolveAnimateEndRef.current = null;
        animateEndPromiseRef.current = null;
        await startAnim('initial');
        return;
      }

      await startAnim('animate');

      if (cancelledRef.current || gen !== runGenRef.current) {
        isAnimateInProgressRef.current = false;
        resolveAnimateEndRef.current?.();
        resolveAnimateEndRef.current = null;
        animateEndPromiseRef.current = null;
        await startAnim('initial');
        return;
      }

      isAnimateInProgressRef.current = false;
      resolveAnimateEndRef.current?.();
      resolveAnimateEndRef.current = null;
      animateEndPromiseRef.current = null;

      if (initialOnAnimateEnd) {
        if (cancelledRef.current || gen !== runGenRef.current) {
          await startAnim('initial');
          return;
        }
        await startAnim('initial', 'set');
      }

      if (loop) {
        if (loopDelay > 0) {
          await new Promise<void>((resolve) => {
            loopDelayRef.current = setTimeout(() => {
              loopDelayRef.current = null;
              resolve();
            }, loopDelay);
          });

          if (cancelledRef.current || gen !== runGenRef.current) {
            await startAnim('initial');
            return;
          }
          if (!activeRef.current) {
            if (statusRef.current !== 'initial' && !persistOnAnimateEnd)
              await startAnim('initial');
            return;
          }
        } else {
          if (!activeRef.current) {
            if (statusRef.current !== 'initial' && !persistOnAnimateEnd)
              await startAnim('initial');
            return;
          }
        }
        if (cancelledRef.current || gen !== runGenRef.current) {
          await startAnim('initial');
          return;
        }
        await run();
      }
    }

    void run();

    return () => {
      cancelledRef.current = true;
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      if (loopDelayRef.current) {
        clearTimeout(loopDelayRef.current);
        loopDelayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAnimate, controls]);
}
