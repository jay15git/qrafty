'use client';

import * as React from 'react';
import { m, useAnimation } from 'motion/react';

import { useIsInView } from '@/components/vendor/animate-ui/use-is-in-view';
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

// Owns the animation lifecycle for AnimateIcon: the localAnimate state, the
// trigger callbacks, the prop/visibility-driven adjustments, and the runner
// wiring. The component keeps only prop plumbing, event handlers, and JSX.
// react-doctor-disable-next-line react-doctor/no-high-complexity-react-function -- vendored animate-ui hook; keep upstream structure for future merges
function useAnimateIconTriggers({
  animate = false,
  animation = 'default',
  delay = 0,
  loop = false,
  loopDelay = 0,
  completeOnStop = false,
  persistOnAnimateEnd = false,
  initialOnAnimateEnd = false,
  animateOnView = false,
  animateOnViewMargin = '0px',
  animateOnViewOnce = true,
}: Pick<
  AnimateIconProps,
  | 'animate'
  | 'animation'
  | 'delay'
  | 'loop'
  | 'loopDelay'
  | 'completeOnStop'
  | 'persistOnAnimateEnd'
  | 'initialOnAnimateEnd'
  | 'animateOnView'
  | 'animateOnViewMargin'
  | 'animateOnViewOnce'
>) {
  const controls = useAnimation();

  const [localAnimate, setLocalAnimate] = React.useState<boolean>(() => {
    if (animate === undefined || animate === false) return false;
    return delay <= 0;
  });
  const [animationEpoch, bumpAnimationEpoch] = React.useReducer(
    (value: number) => value + 1,
    0,
  );

  // State, not a ref: this value is a render input (it feeds the context value
  // below), and a ref read during render is unsafe under concurrent React.
  const [currentAnimation, setCurrentAnimation] = React.useState<
    string | StaticAnimations
  >(typeof animate === 'string' ? animate : animation);
  const statusRef = React.useRef<'initial' | 'animate'>('initial');
  const prevAnimateRef = React.useRef(animate);

  React.useLayoutEffect(() => {
    if (prevAnimateRef.current === animate) return;
    prevAnimateRef.current = animate;
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
      setCurrentAnimation(next);
      bumpAnimationEpoch();
      // localAnimate itself is set by the caller: event handlers set it
      // synchronously, prop-driven callers adjust it during render, and the
      // delayed start resolves through this timer.
      if (delay > 0) {
        delayRef.current = setTimeout(() => {
          setLocalAnimate(true);
        }, delay);
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
  }, [bumpGeneration]);

  React.useEffect(() => {
    activeRef.current = localAnimate;
  }, [localAnimate]);

  // The `animate` prop drives localAnimate through a guarded render update
  // (React's prev-prop pattern) so the first committed frame already reflects
  // it; this layout effect only runs the timer/ref side effects.
  const [prevAnimateDeps, setPrevAnimateDeps] = React.useState<
    readonly [
      TriggerProp | undefined,
      string | StaticAnimations | undefined,
      number | undefined,
    ]
  >([animate, animation, delay]);
  if (
    prevAnimateDeps[0] !== animate ||
    prevAnimateDeps[1] !== animation ||
    prevAnimateDeps[2] !== delay
  ) {
    const animateChanged = prevAnimateDeps[0] !== animate;
    setPrevAnimateDeps([animate, animation, delay]);
    if (animate !== undefined) {
      setLocalAnimate(Boolean(animate) && delay <= 0);
    }
    // The animation name follows the `animate` prop: on any change to it, and
    // on an `animation`/`delay` change while it is active. Derived during
    // render so the first committed frame already reflects it.
    if (animateChanged || animate) {
      setCurrentAnimation(typeof animate === 'string' ? animate : animation);
    }
  }

  React.useLayoutEffect(() => {
    if (animate === undefined) return;
    if (animate) {
      bumpGeneration();
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      bumpAnimationEpoch();
      if (delay > 0) {
        delayRef.current = setTimeout(() => {
          setLocalAnimate(true);
        }, delay);
      }
    } else {
      bumpGeneration();
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      if (loopDelayRef.current) {
        clearTimeout(loopDelayRef.current);
        loopDelayRef.current = null;
      }
    }
  }, [animate, animation, delay, bumpGeneration]);

  React.useEffect(() => {
    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      if (loopDelayRef.current) {
        clearTimeout(loopDelayRef.current);
        loopDelayRef.current = null;
      }
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

  // Viewport visibility drives the animation lifecycle. localAnimate follows
  // isInView through a guarded render update (initialized to a sentinel so the
  // mount pass still applies the initial visibility); the effect below only
  // runs the timer/ref side effects.
  const [prevViewDeps, setPrevViewDeps] = React.useState<
    | readonly [
        boolean,
        TriggerProp | undefined,
        string | StaticAnimations | undefined,
        number | undefined,
      ]
    | null
  >(null);
  if (
    prevViewDeps === null ||
    prevViewDeps[0] !== isInView ||
    prevViewDeps[1] !== animateOnView ||
    prevViewDeps[2] !== animation ||
    prevViewDeps[3] !== delay
  ) {
    setPrevViewDeps([isInView, animateOnView, animation, delay]);
    if (animateOnView) {
      setLocalAnimate(isInView && delay <= 0);
      if (isInView) {
        setCurrentAnimation(
          typeof animateOnView === 'string' ? animateOnView : animation,
        );
      }
    }
  }

  React.useEffect(() => {
    if (!animateOnView) return;
    if (isInView) {
      bumpGeneration();
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      bumpAnimationEpoch();
      if (delay > 0) {
        delayRef.current = setTimeout(() => {
          setLocalAnimate(true);
        }, delay);
      }
    } else {
      bumpGeneration();
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      if (loopDelayRef.current) {
        clearTimeout(loopDelayRef.current);
        loopDelayRef.current = null;
      }
    }
  }, [isInView, animateOnView, animation, delay, bumpGeneration]);

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

  return {
    controls,
    localAnimate,
    setLocalAnimate,
    startAnimation,
    stopAnimation,
    inViewRef,
    currentAnimation,
    animationEpoch,
  };
}

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
  const {
    controls,
    localAnimate,
    setLocalAnimate,
    startAnimation,
    stopAnimation,
    inViewRef,
    currentAnimation,
    animationEpoch,
  } = useAnimateIconTriggers({
    animate,
    animation,
    delay,
    loop,
    loopDelay,
    completeOnStop,
    persistOnAnimateEnd,
    initialOnAnimateEnd,
    animateOnView,
    animateOnViewMargin,
    animateOnViewOnce,
  });

  const childProps = (
    React.isValidElement(children) ? (children as React.ReactElement).props : {}
  ) as AnyProps;

  const handleMouseEnter = composeEventHandlers<React.MouseEvent<HTMLElement>>(
    childProps.onMouseEnter,
    () => {
      if (animateOnHover) {
        startAnimation(animateOnHover);
        setLocalAnimate(delay <= 0);
      }
    },
  );

  const handleMouseLeave = composeEventHandlers<React.MouseEvent<HTMLElement>>(
    childProps.onMouseLeave,
    () => {
      if (animateOnHover || animateOnTap) {
        stopAnimation();
        setLocalAnimate(false);
      }
    },
  );

  const handlePointerDown = composeEventHandlers<
    React.PointerEvent<HTMLElement>
  >(childProps.onPointerDown, () => {
    if (animateOnTap) {
      startAnimation(animateOnTap);
      setLocalAnimate(delay <= 0);
    }
  });

  const handlePointerUp = composeEventHandlers<React.PointerEvent<HTMLElement>>(
    childProps.onPointerUp,
    () => {
      if (animateOnTap) {
        stopAnimation();
        setLocalAnimate(false);
      }
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
      animation: currentAnimation,
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
      currentAnimation,
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

// Any animation-related prop set on the icon itself means it manages its own
// AnimateIcon instead of inheriting the parent context wholesale.
function hasAnimateOverrides<T extends string>(
  props: Pick<
    IconWrapperProps<T>,
    | 'animate'
    | 'animateOnHover'
    | 'animateOnTap'
    | 'animateOnView'
    | 'loop'
    | 'loopDelay'
    | 'initialOnAnimateEnd'
    | 'persistOnAnimateEnd'
    | 'delay'
    | 'completeOnStop'
  >,
) {
  return (
    props.animate !== undefined ||
    props.animateOnHover !== undefined ||
    props.animateOnTap !== undefined ||
    props.animateOnView !== undefined ||
    props.loop !== undefined ||
    props.loopDelay !== undefined ||
    props.initialOnAnimateEnd !== undefined ||
    props.persistOnAnimateEnd !== undefined ||
    props.delay !== undefined ||
    props.completeOnStop !== undefined
  );
}

function hasStandaloneAnimation<T extends string>(
  props: Pick<
    IconWrapperProps<T>,
    'animate' | 'animateOnHover' | 'animateOnTap' | 'animateOnView' | 'animation'
  >,
) {
  return (
    props.animate !== undefined ||
    props.animateOnHover !== undefined ||
    props.animateOnTap !== undefined ||
    props.animateOnView !== undefined ||
    props.animation !== undefined
  );
}

function iconClassName<T extends string>(
  className: IconWrapperProps<T>['className'],
  animation: string | StaticAnimations | undefined,
) {
  return cn(
    className,
    (animation === 'path' || animation === 'path-loop') && pathClassName,
  );
}

// Merges the icon's own props over the parent AnimateIcon context: explicit
// props win, then the parent's animate trigger, then the inherited animation
// while the parent is active.
function resolveContextualOverrides<T extends string>(
  props: Pick<
    IconWrapperProps<T>,
    | 'animate'
    | 'animation'
    | 'loop'
    | 'loopDelay'
    | 'persistOnAnimateEnd'
    | 'initialOnAnimateEnd'
    | 'delay'
    | 'completeOnStop'
  >,
  context: AnimateIconContextValue,
) {
  const inheritedAnimate: Trigger = context.active
    ? (props.animation ?? context.animation ?? 'default')
    : false;

  return {
    animate: (props.animate ?? context.animate ?? inheritedAnimate) as Trigger,
    animation: props.animation ?? context.animation,
    loop: props.loop ?? context.loop,
    loopDelay: props.loopDelay ?? context.loopDelay,
    persistOnAnimateEnd:
      props.persistOnAnimateEnd ?? context.persistOnAnimateEnd,
    initialOnAnimateEnd:
      props.initialOnAnimateEnd ?? context.initialOnAnimateEnd,
    delay: props.delay ?? context.delay,
    completeOnStop: props.completeOnStop ?? context.completeOnStop,
  };
}

// Icon rendered inside an AnimateIcon context: either it overrides the
// parent's animation props and gets its own AnimateIcon, or it re-provides
// the resolved animation to deeper nested icons.
function ContextualIcon<T extends string>({
  context,
  ...props
}: IconWrapperProps<T> & { context: AnimateIconContextValue }) {
  const {
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
    ...restProps
  } = props;

  if (
    hasAnimateOverrides({
      animate,
      animateOnHover,
      animateOnTap,
      animateOnView,
      loop,
      loopDelay,
      initialOnAnimateEnd,
      persistOnAnimateEnd,
      delay,
      completeOnStop,
    })
  ) {
    const resolved = resolveContextualOverrides(
      {
        animate,
        animation: animationProp,
        loop,
        loopDelay,
        persistOnAnimateEnd,
        initialOnAnimateEnd,
        delay,
        completeOnStop,
      },
      context,
    );

    return (
      <AnimateIcon
        animate={resolved.animate}
        animateOnHover={animateOnHover}
        animateOnTap={animateOnTap}
        animateOnView={animateOnView}
        animateOnViewMargin={animateOnViewMargin}
        animateOnViewOnce={animateOnViewOnce}
        animation={resolved.animation}
        loop={resolved.loop}
        loopDelay={resolved.loopDelay}
        persistOnAnimateEnd={resolved.persistOnAnimateEnd}
        initialOnAnimateEnd={resolved.initialOnAnimateEnd}
        delay={resolved.delay}
        completeOnStop={resolved.completeOnStop}
        asChild
      >
        <IconComponent
          size={size}
          className={iconClassName(className, resolved.animation)}
          {...restProps}
        />
      </AnimateIcon>
    );
  }

  const animationToUse = animationProp ?? context.animation;

  return (
    <AnimateIconNestedProvider
      animationToUse={animationToUse}
      // SVGMotionProps types `className` as MotionValueHelper; the nested
      // provider only forwards it to `cn`, which expects a plain string.
      className={className as string | undefined}
      completeOnStop={props.completeOnStop}
      context={context}
      IconComponent={IconComponent}
      size={size}
      {...restProps}
    />
  );
}
// Icon with animation props but no surrounding AnimateIcon: it owns its
// AnimateIcon wrapper directly.
function StandaloneAnimatedIcon<T extends string>(props: IconWrapperProps<T>) {
  const {
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
    delay,
    completeOnStop,
    className,
    ...restProps
  } = props;

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
        className={iconClassName(className, animationProp)}
        {...restProps}
      />
    </AnimateIcon>
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
  ...restProps
}: IconWrapperProps<T>) {
  const context = React.useContext(AnimateIconContext);

  if (context) {
    return (
      <ContextualIcon
        context={context}
        size={size}
        animation={animationProp}
        animate={animate}
        animateOnHover={animateOnHover}
        animateOnTap={animateOnTap}
        animateOnView={animateOnView}
        animateOnViewMargin={animateOnViewMargin}
        animateOnViewOnce={animateOnViewOnce}
        icon={IconComponent}
        loop={loop}
        loopDelay={loopDelay}
        persistOnAnimateEnd={persistOnAnimateEnd}
        initialOnAnimateEnd={initialOnAnimateEnd}
        delay={delay}
        completeOnStop={completeOnStop}
        className={className}
        {...restProps}
      />
    );
  }

  if (
    hasStandaloneAnimation({
      animate,
      animateOnHover,
      animateOnTap,
      animateOnView,
      animation: animationProp,
    })
  ) {
    return (
      <StandaloneAnimatedIcon
        size={size}
        animation={animationProp}
        animate={animate}
        animateOnHover={animateOnHover}
        animateOnTap={animateOnTap}
        animateOnView={animateOnView}
        animateOnViewMargin={animateOnViewMargin}
        animateOnViewOnce={animateOnViewOnce}
        icon={IconComponent}
        loop={loop}
        loopDelay={loopDelay}
        delay={delay}
        completeOnStop={completeOnStop}
        className={className}
        {...restProps}
      />
    );
  }

  return (
    <IconComponent
      size={size}
      className={iconClassName(className, animationProp)}
      {...restProps}
    />
  );
}

export { IconWrapper };
