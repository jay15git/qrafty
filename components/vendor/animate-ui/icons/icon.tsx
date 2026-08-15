'use client';

import * as React from 'react';
import { m, useAnimation } from 'motion/react';

import { useIsInView } from '@/hooks/use-is-in-view';
import { cn } from '@/lib/utils';
import { Slot } from '@/components/vendor/animate-ui/primitives/animate/slot';
import { useAnimateIconRunner } from '@/components/vendor/animate-ui/icons/animate-icon-runner';
import {
  AnimateIconContext,
  composeEventHandlers,
  pathClassName,
  useAnimateIconContext,
} from '@/components/vendor/animate-ui/icons/icon.utils';
import type {
  AnimateIconContextValue,
  AnimateIconProps,
  AnyProps,
  IconWrapperProps,
  StaticAnimations,
  Trigger,
  TriggerProp,
} from '@/components/vendor/animate-ui/icons/icon.types';

function AnimateIcon({
  asChild = false,
  animate = false,
  animateOnHover = false,
  animateOnTap = false,
  animateOnView = false,
  animateOnViewMargin = '0px',
  animateOnViewOnce = true,
  animation = 'default',
  loop = false,
  loopDelay = 0,
  initialOnAnimateEnd = false,
  completeOnStop = false,
  persistOnAnimateEnd = false,
  delay = 0,
  children,
  ...props
}: AnimateIconProps) {
  const controls = useAnimation();

  const [localAnimate, setLocalAnimate] = React.useState<boolean>(() => {
    if (animate === undefined || animate === false) return false;
    return delay <= 0;
  });
  const [animationEpoch, bumpAnimationEpoch] = React.useReducer(
    (value: number) => value + 1,
    0,
  );

  const currentAnimationRef = React.useRef<string | StaticAnimations>(
    typeof animate === 'string' ? animate : animation,
  );
  const statusRef = React.useRef<'initial' | 'animate'>('initial');
  const prevAnimateRef = React.useRef(animate);

  React.useLayoutEffect(() => {
    if (prevAnimateRef.current === animate) return;
    prevAnimateRef.current = animate;
    currentAnimationRef.current =
      typeof animate === 'string' ? animate : animation;
    bumpAnimationEpoch();
  }, [animate, animation]);

  const delayRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopDelayRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimateInProgressRef = React.useRef<boolean>(false);
  const animateEndPromiseRef = React.useRef<Promise<void> | null>(null);
  const resolveAnimateEndRef = React.useRef<(() => void) | null>(null);
  const activeRef = React.useRef<boolean>(localAnimate);

  const runGenRef = React.useRef(0);

  const bumpGeneration = React.useCallback(() => {
    runGenRef.current++;
  }, []);

  const startAnimation = React.useCallback(
    (trigger: TriggerProp) => {
      const next = typeof trigger === 'string' ? trigger : animation;
      bumpGeneration();
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      currentAnimationRef.current = next;
      bumpAnimationEpoch();
      if (delay > 0) {
        setLocalAnimate(false);
        delayRef.current = setTimeout(() => {
          setLocalAnimate(true);
        }, delay);
      } else {
        setLocalAnimate(true);
      }
    },
    [animation, delay, bumpGeneration],
  );

  const stopAnimation = React.useCallback(() => {
    bumpGeneration();
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (loopDelayRef.current) {
      clearTimeout(loopDelayRef.current);
      loopDelayRef.current = null;
    }
    setLocalAnimate(false);
  }, [bumpGeneration]);

  React.useEffect(() => {
    activeRef.current = localAnimate;
  }, [localAnimate]);

  React.useLayoutEffect(() => {
    if (animate === undefined) return;
    if (animate) startAnimation(animate as TriggerProp);
    else stopAnimation();
  }, [animate, animation, startAnimation, stopAnimation]);

  React.useEffect(() => {
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
      if (loopDelayRef.current) clearTimeout(loopDelayRef.current);
    };
  }, []);

  const viewOuterRef = React.useRef<HTMLElement>(null);
  const { ref: inViewRef, isInView } = useIsInView(viewOuterRef, {
    inView: !!animateOnView,
    inViewOnce: animateOnViewOnce,
    inViewMargin: animateOnViewMargin,
  });

  const startAnim = React.useCallback(
    async (anim: 'initial' | 'animate', method: 'start' | 'set' = 'start') => {
      try {
        await controls[method](anim);
        statusRef.current = anim;
      } catch {
        return;
      }
    },
    [controls],
  );

  React.useEffect(() => {
    if (!animateOnView) return;
    if (isInView) startAnimation(animateOnView);
    else stopAnimation();
    // eslint-disable-next-line react-doctor/no-derived-state-effect -- viewport visibility drives animation lifecycle
  }, [isInView, animateOnView, startAnimation, stopAnimation]);

  useAnimateIconRunner({
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
  });

  const childProps = (
    React.isValidElement(children) ? (children as React.ReactElement).props : {}
  ) as AnyProps;

  const handleMouseEnter = composeEventHandlers<React.MouseEvent<HTMLElement>>(
    childProps.onMouseEnter,
    () => {
      if (animateOnHover) startAnimation(animateOnHover);
    },
  );

  const handleMouseLeave = composeEventHandlers<React.MouseEvent<HTMLElement>>(
    childProps.onMouseLeave,
    () => {
      if (animateOnHover || animateOnTap) stopAnimation();
    },
  );

  const handlePointerDown = composeEventHandlers<
    React.PointerEvent<HTMLElement>
  >(childProps.onPointerDown, () => {
    if (animateOnTap) startAnimation(animateOnTap);
  });

  const handlePointerUp = composeEventHandlers<React.PointerEvent<HTMLElement>>(
    childProps.onPointerUp,
    () => {
      if (animateOnTap) stopAnimation();
    },
  );

  const content = asChild ? (
    <Slot
      ref={inViewRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...props}
    >
      {children}
    </Slot>
  ) : (
    <m.span
      ref={inViewRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...props}
    >
      {children}
    </m.span>
  );

  const contextValue = React.useMemo<AnimateIconContextValue>(
    () => ({
      controls,
      animation: currentAnimationRef.current,
      loop,
      loopDelay,
      active: localAnimate,
      animate,
      initialOnAnimateEnd,
      completeOnStop,
      delay,
    }),
    [
      animationEpoch,
      controls,
      localAnimate,
      loop,
      loopDelay,
      animate,
      initialOnAnimateEnd,
      completeOnStop,
      delay,
    ],
  );

  return (
    <AnimateIconContext.Provider value={contextValue}>
      {content}
    </AnimateIconContext.Provider>
  );
}

function AnimateIconNestedProvider<T extends string>({
  animationToUse,
  className,
  completeOnStop,
  context,
  IconComponent,
  size,
  ...props
}: {
  animationToUse: string
  className?: string
  completeOnStop?: boolean
  context: AnimateIconContextValue
  IconComponent: IconWrapperProps<T>['icon']
  size: number
} & Omit<IconWrapperProps<T>, 'icon' | 'size' | 'className' | 'animation'>) {
  const nestedContextValue = React.useMemo<AnimateIconContextValue>(
    () => ({
      controls: context.controls,
      animation: animationToUse,
      loop: context.loop,
      loopDelay: context.loopDelay,
      active: context.active,
      animate: context.animate,
      initialOnAnimateEnd: context.initialOnAnimateEnd,
      delay: context.delay,
      completeOnStop: context.completeOnStop,
    }),
    [
      animationToUse,
      context.active,
      context.animate,
      context.completeOnStop,
      context.controls,
      context.delay,
      context.initialOnAnimateEnd,
      context.loop,
      context.loopDelay,
    ],
  );

  return (
    <AnimateIconContext.Provider value={nestedContextValue}>
      <IconComponent
        size={size}
        className={cn(
          className,
          (animationToUse === 'path' || animationToUse === 'path-loop') &&
            pathClassName,
        )}
        {...props}
      />
    </AnimateIconContext.Provider>
  );
}

function IconWrapper<T extends string>({
  size = 28,
  animation: animationProp,
  animate,
  animateOnHover,
  animateOnTap,
  animateOnView,
  animateOnViewMargin,
  animateOnViewOnce,
  icon: IconComponent,
  loop,
  loopDelay,
  persistOnAnimateEnd,
  initialOnAnimateEnd,
  delay,
  completeOnStop,
  className,
  ...props
}: IconWrapperProps<T>) {
  const context = React.useContext(AnimateIconContext);

  if (context) {
    const {
      controls,
      animation: parentAnimation,
      loop: parentLoop,
      loopDelay: parentLoopDelay,
      active: parentActive,
      animate: parentAnimate,
      persistOnAnimateEnd: parentPersistOnAnimateEnd,
      initialOnAnimateEnd: parentInitialOnAnimateEnd,
      delay: parentDelay,
      completeOnStop: parentCompleteOnStop,
    } = context;

    const hasOverrides =
      animate !== undefined ||
      animateOnHover !== undefined ||
      animateOnTap !== undefined ||
      animateOnView !== undefined ||
      loop !== undefined ||
      loopDelay !== undefined ||
      initialOnAnimateEnd !== undefined ||
      persistOnAnimateEnd !== undefined ||
      delay !== undefined ||
      completeOnStop !== undefined;

    if (hasOverrides) {
      const inheritedAnimate: Trigger = parentActive
        ? (animationProp ?? parentAnimation ?? 'default')
        : false;

      const finalAnimate: Trigger = (animate ??
        parentAnimate ??
        inheritedAnimate) as Trigger;

      return (
        <AnimateIcon
          animate={finalAnimate}
          animateOnHover={animateOnHover}
          animateOnTap={animateOnTap}
          animateOnView={animateOnView}
          animateOnViewMargin={animateOnViewMargin}
          animateOnViewOnce={animateOnViewOnce}
          animation={animationProp ?? parentAnimation}
          loop={loop ?? parentLoop}
          loopDelay={loopDelay ?? parentLoopDelay}
          persistOnAnimateEnd={persistOnAnimateEnd ?? parentPersistOnAnimateEnd}
          initialOnAnimateEnd={initialOnAnimateEnd ?? parentInitialOnAnimateEnd}
          delay={delay ?? parentDelay}
          completeOnStop={completeOnStop ?? parentCompleteOnStop}
          asChild
        >
          <IconComponent
            size={size}
            className={cn(
              className,
              ((animationProp ?? parentAnimation) === 'path' ||
                (animationProp ?? parentAnimation) === 'path-loop') &&
                pathClassName,
            )}
            {...props}
          />
        </AnimateIcon>
      );
    }

    const animationToUse = animationProp ?? parentAnimation;

    return (
      <AnimateIconNestedProvider
        animationToUse={animationToUse}
        className={className}
        completeOnStop={completeOnStop}
        context={context}
        IconComponent={IconComponent}
        size={size}
        {...props}
      />
    );
  }

  if (
    animate !== undefined ||
    animateOnHover !== undefined ||
    animateOnTap !== undefined ||
    animateOnView !== undefined ||
    animationProp !== undefined
  ) {
    return (
      <AnimateIcon
        animate={animate}
        animateOnHover={animateOnHover}
        animateOnTap={animateOnTap}
        animateOnView={animateOnView}
        animateOnViewMargin={animateOnViewMargin}
        animateOnViewOnce={animateOnViewOnce}
        animation={animationProp}
        loop={loop}
        loopDelay={loopDelay}
        delay={delay}
        completeOnStop={completeOnStop}
        asChild
      >
        <IconComponent
          size={size}
          className={cn(
            className,
            (animationProp === 'path' || animationProp === 'path-loop') &&
              pathClassName,
          )}
          {...props}
        />
      </AnimateIcon>
    );
  }

  return (
    <IconComponent
      size={size}
      className={cn(
        className,
        (animationProp === 'path' || animationProp === 'path-loop') &&
          pathClassName,
      )}
      {...props}
    />
  );
}

export { IconWrapper };
